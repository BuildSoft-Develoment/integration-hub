# Implementación — guard de fronteras de módulo del frontend (v60-fix, opción ligera, SOLID)

Fecha: 2026-07-05
Alcance: implementa la **opción ligera** del
[análisis](2026-07-05-analisis-fronteras-nx-frontend.md) — un guard de ESLint por patrón de path que impone la
**dirección de dependencias** entre libs, **sin** convertir las carpetas en proyectos Nx. Es tooling/arquitectura
frontend; **cero** runtime, cero money-path.

## Por qué la opción ligera (y no la idiomática)

El análisis dejó dos caminos: (a) registrar ~12 libs como proyectos Nx + tags + `depConstraints` (idiomático, aporta
caching/`affected`, pero refactor mayor de estructura con esfuerzo incierto), y (b) un `no-restricted-imports` por path
(acotado, bajo riesgo). Este ciclo cierra el hallazgo con (b) como **guard inmediato y real**; (a) queda agendable como
tarea frontend dedicada.

## Hallazgo de tooling que condicionó el diseño (verificado)

`npm run lint` = `nx lint web` → **solo lintea el proyecto `web`** (`apps/web`). Las libs de dominio **no** son
proyectos Nx (`nx show projects` devuelve solo 5: `plugin-ui-kit, sample-plugin, ui-kit-storybook, web-e2e, web`), así
que el lint estándar **ni siquiera las toca**. Consecuencias de diseño:

1. Meter la regla en `eslint.config.mjs` (la config principal) **no la haría efectiva** sobre las libs, porque el
   comando que corre CI (`nx lint web`) no las incluye.
2. Correr `eslint libs` con la config principal **arrastraría el ruleset completo** de typescript-eslint sobre archivos
   que nunca se han linteado → un backlog de violaciones preexistentes ajenas a las fronteras (ruido que enmascara el
   guard).

Por eso el guard vive en una **config dedicada** con **script propio**, no en la config principal.

## Cambios

- **`frontend/eslint.boundaries.config.mjs`** (NUEVO): config flat **dedicada** a fronteras. Declara **solo** el parser
  de TypeScript (`@typescript-eslint/parser`) + la regla `no-restricted-imports` — **no** hereda el recomendado de
  typescript-eslint, así que no arrastra el backlog. Dos bloques:
  - `libs/features/**` → prohíbe importar `@integration-hub/features/*` (una feature no importa otra feature).
  - `libs/core/**` + `libs/shared/**` → prohíbe importar `@integration-hub/features/*` (las capas bajas no dependen de
    features: la dirección va de features hacia core/shared, no al revés).
- **`frontend/package.json`**: nuevo script
  `"lint:boundaries": "eslint --no-config-lookup --config eslint.boundaries.config.mjs \"libs/**/*.ts\""`.
  `--no-config-lookup` asegura que solo se aplique esta config (no se mezcla con `eslint.config.mjs`).
- **`frontend/libs/features/schedules/src/lib/api/schedules-api.service.ts`**: la **única** arista feature→feature del
  monorepo (`schedules` importa `ProcessApiService` de `features/processes`) queda **grandfathered** con un
  `// eslint-disable-next-line no-restricted-imports` visible + comentario de deuda (el servicio debería vivir en
  `core/services`). El guard queda verde hoy; la deuda es explícita y rastreable.

### SOLID
- **SRP**: la config dedicada tiene una única responsabilidad (fronteras arquitectónicas), separada del ruleset de
  estilo/calidad de `eslint.config.mjs`.
- **OCP**: extender = añadir un bloque `files`/`patterns` (p.ej. `type:ui` no depende de `feature`), sin tocar lo
  existente.
- **DIP**: impone que las abstracciones de bajo nivel (core/shared) **no** dependan de detalles de alto nivel
  (features) — es literalmente la regla de inversión de dependencias, aplicada a nivel de módulo.

## Pruebas (evidenciadas)

1. **Verde con el grandfather**: `npm run lint:boundaries` → **exit 0**, sin errores ni directives sin usar.
2. **Prueba negativa (que el guard SÍ atrapa)**: inyecté dos sondas temporales —
   - `libs/core/services/src/__boundary_probe__.ts` importando `features/processes` → **error** ("Las capas core/shared
     no deben depender de features…").
   - `libs/features/audit/src/__boundary_probe__.ts` importando `features/processes` → **error** ("Una feature no debe
     importar otra feature…").
   Ambas violaciones fueron reportadas por `no-restricted-imports` (parseando TS real: tipos, decoradores). Sondas
   eliminadas tras la prueba.
3. **Re-verde tras limpiar**: exit 0 de nuevo.
4. **Cobertura del parser**: se corrigió un fallo inicial en que la config no declaraba parser y Espree rompía todo TS
   con "Parsing error" (la regla nunca llegaba a evaluarse). Con `@typescript-eslint/parser` el guard evalúa imports
   reales.

## Limitaciones / deuda documentada

- **No es la solución idiomática Nx**: no hay tags, `depConstraints`, ni caching/`affected` por lib. Para eso hay que
  registrar las libs como proyectos (tarea frontend mayor, ver el análisis).
- **El grandfather es deuda real**: mover `ProcessApiService` a `@integration-hub/core/services` eliminaría la única
  excepción y permitiría quitar el `eslint-disable`. Refactor acotado pero fuera del alcance de este guard.
- **Enforcement**: `lint:boundaries` es un script aparte; para que sea barrera efectiva debe correrse en el pipeline de
  CI del frontend (no está en `npm run lint`, que sigue siendo `nx lint web`). Se deja el script listo para engancharlo.

## Nota sobre el arranque de la app

Este cambio es **100% tooling de frontend** (config de ESLint + un comentario): no toca backend, ni runtime, ni el
money-path. Arrancar el stack (`start-platform-stack.cmd`) **no valida nada de este guard** — la validación real es la
corrida de ESLint (positiva + negativa) evidenciada arriba. Por eso, a diferencia de los ciclos backend, aquí la
evidencia es el propio `lint:boundaries`, no el login en localhost:8080.

## Conclusión

El hallazgo de fronteras queda cerrado con un guard **real y verificado**: impone la dirección de dependencias entre
libs (features aisladas; core/shared no dependen de features), parsea TS de verdad, atrapa violaciones en ambas
direcciones, y deja la única arista existente como deuda visible. Diseño SOLID (config de responsabilidad única,
extensible, que codifica la inversión de dependencias). La opción idiomática Nx (proyectos + tags + caching) queda
agendable como tarea frontend dedicada.
