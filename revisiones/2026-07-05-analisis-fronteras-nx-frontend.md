# Análisis — fronteras de módulo Nx en el frontend (madurez, app_htoh 55)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Contexto: app_htoh(55) señaló que Nx no impone fronteras fuertes (tags vacíos, la regla permite cualquier import).

## Estado hoy (verificado)

1. **La regla existe pero no impone nada.** `frontend/eslint.config.mjs` tiene `@nx/enforce-module-boundaries` en
   `error`, pero con el `depConstraints` **default permisivo**:
   ```js
   depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }]
   ```
   `*` → `*` permite que **cualquier** proyecto dependa de **cualquier** otro. La regla está ON pero es un no-op.
2. **Los tags están vacíos** en los proyectos que sí tienen `project.json`: `apps/web`, `apps/sample-plugin`,
   `libs/plugin-ui-kit` → todos `"tags": []`.
3. **Las libs de dominio NO son proyectos Nx.** `libs/core/{providers,services}`, `libs/shared/ui`,
   `libs/features/{sources,connections,readers,processes,payments,executions,overview,schedules,audit}` tienen su
   `src/index.ts` (barrel) y un **alias de tsconfig** (`@integration-hub/...` en `tsconfig.base.json`), pero **NO**
   tienen `project.json` ni `package.json` → no están registradas en el grafo de proyectos Nx. La regla de fronteras
   opera sobre aristas del **grafo de proyectos**; si el destino no es un proyecto, el import **no se gobierna**.

**Conclusión:** hoy no hay fronteras reales — ni por el `depConstraints` permisivo, ni porque las libs de dominio no
son proyectos Nx gobernables. Es **maintainability/arquitectura frontend**, no correctitud ni money-path.

### Verificación autoritativa + correcciones del doble-check profundo

`nx show projects` (corrido en el repo) devuelve **solo 5 proyectos**:
`["plugin-ui-kit","sample-plugin","ui-kit-storybook","web-e2e","web"]`. Las libs de dominio (`core/services`,
`core/providers`, `shared/ui`, `features/*`) **NO aparecen** → confirmado a nivel de herramienta que **no son
proyectos Nx** (son carpetas con alias de tsconfig + barrel).

Dos correcciones a la redacción inicial:

1. **`enforce-module-boundaries` NO es un no-op total.** Con `*→*` no hay constraints por TAG, pero la regla **sí**
   sigue imponiendo, para los proyectos que reconoce: `enforceBuildableLibDependency` (línea del config) y las
   restricciones de **deep-import** (importar por la API pública/barrel, no rutas internas). Lo correcto es: para los
   5 proyectos reales hay algo de gobierno; para las libs de dominio (que son lo que el análisis quiere gobernar) **no
   aplica NADA** porque no son proyectos.
2. **El prerrequisito (registrar las libs como proyectos Nx) NO es opcional sino obligatorio** — sin él, endurecer
   `depConstraints` no gobierna las libs. Y registrar las libs como proyectos **desbloquea además** el grafo de Nx:
   caching por lib, `affected`, y las fronteras. Es un refactor **mayor** (no "solo tags") pero de más valor: hoy las
   "libs" son cosméticas (carpetas+barrels bundleadas en `web` vía tsconfig paths), sin aristas de proyecto, sin
   caching por lib.

## Diseño propuesto (frontend, bounded pero no trivial)

1. **Registrar las libs como proyectos Nx con tags.** Añadir un `project.json` (o `package.json` con `nx.tags`) a cada
   lib con una taxonomía `scope:*` + `type:*`, p.ej.:
   - `libs/shared/ui` → `scope:shared, type:ui`
   - `libs/core/services` → `scope:core, type:data-access`
   - `libs/core/providers` → `scope:core, type:util` (o `data-access`)
   - `libs/features/payments` → `scope:payments, type:feature`
   - `libs/features/{sources,readers,processes,executions,audit,schedules,connections,overview}` →
     `scope:<nombre>, type:feature`
   - `libs/plugin-ui-kit` → `scope:shared, type:ui` (o `scope:plugins`)
   - `apps/web` → `type:app`
2. **Reemplazar el `*→*` por `depConstraints` reales**, p.ej.:
   - `type:app` → `type:feature, type:ui, type:data-access, type:util`
   - `type:feature` → `type:ui, type:data-access, type:util` (una feature NO depende de otra feature)
   - `type:ui` → `type:ui, type:util`
   - `type:data-access` → `type:data-access, type:util`
   - `scope:<feature>` → `scope:<feature>, scope:shared, scope:core` (una feature no invade el scope de otra)
3. **Corregir las violaciones** que `nx lint`/`eslint` revele tras endurecer (imports feature→feature, ui→feature,
   etc.). Es la parte de esfuerzo incierto: depende de cuántos cruces existan hoy.

## Consideración de alcance / validación

- Es **puramente frontend/tooling** (ESLint + Nx), sin comportamiento en runtime ni money-path. La validación es
  `nx lint` / `eslint` en el toolchain **npm/Nx** del frontend — un stack distinto al de los tests Java de este ciclo.
- El esfuerzo tiene una parte **acotada** (registrar ~12 libs + taxonomía + depConstraints) y una parte de **esfuerzo
  incierto** (arreglar las violaciones existentes, que solo se conocen al correr el lint endurecido).
- **Alternativa más ligera** (si no se quiere registrar libs como proyectos): un `no-restricted-imports` de ESLint por
  patrón de path (prohibir `@integration-hub/features/*` desde otra feature). Menos idiomático que Nx pero no requiere
  convertir las carpetas en proyectos.

## Veredicto (revisado tras el doble-check profundo)

Gap **REAL de arquitectura frontend** (no correctitud, no money-path): las fronteras no se imponen y, más de fondo, las
libs de dominio **no son proyectos Nx**, así que hoy son carpetas cosméticas fuera del grafo. La solución idiomática es
**mayor** de lo que sugería "solo tags": hay que **convertir ~12 carpetas en proyectos Nx** (project.json + tags),
definir `depConstraints` reales, y corregir las violaciones que emerjan — con la ventaja adicional de desbloquear
caching/`affected`. Vive en el **toolchain frontend** (`nx lint`/npm), un stack distinto al Java de este ciclo.

Recomendación:
- **Opción idiomática (mayor)**: tarea **frontend dedicada** — registrar libs como proyectos tagueados + depConstraints
  + arreglar violaciones, validando con `nx lint` y `nx affected`. Aporta fronteras + caching, pero es un refactor de
  estructura del monorepo, no un cambio pequeño.
- **Opción ligera (guard rápido)**: un `no-restricted-imports` de ESLint por patrón de path (p.ej. prohibir
  `@integration-hub/features/*` importado desde otra feature) — impone la frontera **sin** convertir carpetas en
  proyectos ni tocar el grafo. Menos idiomático y sin caching, pero acotado y de bajo riesgo.

Dado que este ciclo ha sido backend/money-path, y que la opción idiomática es un refactor de estructura del frontend
con esfuerzo incierto, recomiendo **no mezclarla con el backend**: o se agenda como tarea frontend, o se aplica la
opción ligera como guard inmediato si se quiere cerrar el hallazgo ya.
