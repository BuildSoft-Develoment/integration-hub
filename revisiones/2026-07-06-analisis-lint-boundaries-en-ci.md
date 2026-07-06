# Análisis — enganchar `lint:boundaries` en CI (#1)

Fecha: 2026-07-06
Tipo: **análisis** (validación contra código real; sin implementar). Fuera del money-path — higiene de arquitectura FE.

## Problema

El guard de fronteras de módulo del frontend (`frontend/eslint.boundaries.config.mjs`, script
`npm run lint:boundaries`) **existe pero no está gateado en CI**: hoy solo se corre a mano. Si alguien introduce una
importación que viola la dirección de dependencias, el pipeline **pasa igual** y la degradación entra en silencio —
justo lo que un guard debería impedir.

## Estado real (verificado en código)

- **El guard es lo ÚNICO que gobierna estas fronteras.** Las libs de dominio (`core/*`, `shared/*`, `features/*`,
  `plugin-ui-kit`) **no son projects Nx** (no tienen `project.json`) → `@nx/enforce-module-boundaries` no las cubre y
  `nx lint web` **ni siquiera las lintea**. El `eslint.boundaries.config.mjs` dedicado es el único enforcement.
- **Qué impone** (2 grupos de reglas, no es no-op): (a) una **feature** no importa otra feature (bajo acoplamiento);
  (b) las capas **bajas** (`core/shared/plugin-ui-kit`) no dependen de features (dirección features → abajo). Vía
  `no-restricted-imports` sobre `@integration-hub/features/*`.
- **CI actual** (`.github/workflows/ci.yml`, 3 jobs):
  - `governance` → `npm run check:all` = `check:template && check:project` (constitution/protocols/docs/trace/...).
    **No corre boundaries.**
  - `backend` → `./mvnw -B verify`.
  - `frontend` → `npm ci` → `nx lint web` → `nx run web:test-plugins` → `nx test web` → `nx build web`.
    **Ningún paso corre `lint:boundaries`.**
- **Verificación empírica (verde hoy)**: `npm run lint:boundaries` desde `frontend/` → **exit 0**, sin violaciones.
  Config presente; `eslint` y `@typescript-eslint/parser` ya instalados vía el mismo `package-lock` que usa `npm ci` en
  CI. → enganchar el gate **no rompe** el pipeline actual y **no requiere dependencias nuevas**.

## Veredicto

Gap **real de higiene/CI**, riesgo casi nulo, esfuerzo trivial. El guard ya está escrito, verde y es el único
enforcement de estas fronteras; falta solo **ejecutarlo en el pipeline** para que un PR que las viole falle.

## Diseño propuesto (para la fase de implementación)

**Opción A (recomendada) — paso dedicado en el job `frontend`.** Añadir, **justo después de `Lint`** (feedback rápido:
es un check de segundos, y al ir antes de `test-plugins`/`test`/`build` una violación falla el job en segundos en vez de
tras el build completo):

```yaml
      - name: Boundaries (dirección de dependencias de módulo)
        working-directory: frontend
        run: npm run lint:boundaries
```

- **Por qué job `frontend` y no `governance`**: la regla es del frontend (paths de `libs/**`), y necesita el `npm ci`
  que solo hace ese job. `governance` corre en la raíz y no instala deps del FE.
- **Atribución clara**: paso propio con nombre → si falla, el reporte dice "boundaries", no se confunde con `nx lint`.
- **Sin cambios de deps ni de package.json**: reutiliza el script y las deps existentes.

**Opción B (alternativa) — plegar en el script `lint`.** `"lint": "nx lint web && npm run lint:boundaries"`. Cubre CI
**y** el `npm run lint` local con un solo entrypoint (DRY). Contra: acopla dos linters bajo un nombre, cambia el
comportamiento local de `lint`, y pierde la atribución separada en el reporte de CI. **No recomendada** frente a A.

## Alcance / no-objetivos

- **No** convierte las libs en projects Nx (ése es el pendiente #3-FE "opción idiomática Nx", mayor y aparte). Este
  cambio solo **gatea el guard que ya existe**.
- **No** añade reglas nuevas de fronteras (el config es extensible, pero eso es otro trabajo).

## Doble-check — verificación contra código (self-review)

Reté cada afirmación contra el código y de forma **empírica**. **El análisis se sostiene, sin errores**; el supuesto
central (el guard es un enforcement real, no teatro) quedó **probado en positivo**, no solo asumido por el verde.

- **Gate en POSITIVO (la verificación clave, lección #4)**: inyecté violaciones **reales** en archivos reales —
  `libs/features/audit/src/index.ts` importando otra feature, y `libs/core/providers/src/index.ts` importando una
  feature — y corrí el guard: **exit 1, `✖ 2 problems (2 errors)`**, uno por cada grupo de reglas (feature→feature y
  capa-baja→feature). Revertido con `git checkout --` → verde de nuevo (exit 0). → **ambas reglas disparan sobre
  violaciones reales**; el guard no es un no-op de globs mal apuntados.
- **Alias correcto**: `frontend/tsconfig.base.json` define las features como `@integration-hub/features/<name>`
  (`sources`, `audit`, ...). El patrón del config (`@integration-hub/features/*` + `/**`) **matchea** el alias real —
  confirmado por el positivo de arriba.
- **Governance NO lo cubre (confirmado, con matiz)**: `check:project` corre 40+ validadores y `check:template` otros
  9 — todos spec/doc/backend. Ninguno lintea imports TS. El más cercano, **`check:feature-dependencies`, valida el
  grafo DECLARADO** en `traceability.md > ## Dependencias` (ciclos, existencia, orden de fase) a nivel **spec**, no los
  imports de código. → capa **complementaria**, distinta; el guard sigue siendo el único enforcement a nivel de
  **import de código**.
- **CI es el único punto de gateo**: **no hay** husky/lint-staged/pre-commit hooks en `frontend/` ni en la raíz. →
  enganchar en `ci.yml` es la única forma de gatearlo.

**Neto**: la recomendación (Opción A, paso dedicado en el job `frontend`) no cambia y queda reforzada — el guard es
real, apunta bien, no está cubierto por nada más, y ponerlo en CI es trivial y sin riesgo (verde hoy, sin deps nuevas).
