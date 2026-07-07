# Implementación — migración idiomática Nx: libs de dominio como proyectos

Fecha: 2026-07-07
Tipo: **implementación** (opción idiomática del análisis de fronteras).
Contexto: cierra la "tarea frontend dedicada" que dejó agendada
[2026-07-05-analisis-fronteras-nx-frontend.md](2026-07-05-analisis-fronteras-nx-frontend.md): registrar las libs
de dominio como proyectos Nx tagueados + `depConstraints` + caching, y retirar el guard manual `lint:boundaries`.

Rama: `frontend/nx-libs-as-projects`. Toolchain: npm/Nx (independiente del backend).

## Resultado

`nx show projects`: **5 → 19**. Las 13 libs de dominio (`core/{providers,services,i18n}`,
`shared/{ui,models}`, `features/*` ×9) son proyectos Nx **non-buildable** (sin target `build` → el build de
`web` sigue compilando el source vía tsconfig paths, no depende de `^build`; lint inferido por
`@nx/eslint/plugin`). Fronteras impuestas por `@nx/enforce-module-boundaries` (tags), caching + `affected`
para lint habilitados, y el guard manual retirado.

## Fases (cada una: análisis → doble-check → implementación → evidencia)

- **Fase 0 — romper el ciclo `shared/ui ↔ core/services`** (`659ea657`). Prerequisito: Nx rechaza ciclos.
  `ResourcePresentation`/`IhBreadcrumbItem` → leaf `@integration-hub/shared/models`; `UiMessageSnackbarComponent`
  → `plugin-ui-kit`. El doble-check destapó este ciclo que el análisis inicial no había visto.
- **Fase 1 — registrar libs + tags** (`4bf525b6`). `project.json` non-buildable + `type:*`/`scope:*`. Activar el
  lint de las libs (antes solo `web`) destapó un **2º ciclo** `core-providers ↔ core-services` (providers usaba
  `I18nService` de services) → roto extrayendo `I18nService` a la leaf `@integration-hub/core/i18n`. También
  surfaceó 3 self-imports, 3 no-empty-function y un choque de root de `ui-kit-storybook` (usaba
  `libs/shared/ui`, movido a `.storybook`); todo corregido.
- **Fase 2 — `depConstraints` reales por tag** (`a8a23602`). Reemplaza el `*→*` (no-op) por 4 reglas:
  `type:app → app,feature,core,shared`; `type:{feature,core,shared} → core,shared` (feature↛feature,
  {core,shared}↛feature). Prueba negativa: un import feature→feature falla el lint.
- **Fase 3 — test targets por-lib: OMITIDA (decisión de ROI).** El suite completo corre en ~15s como una unidad
  (`web:test` globa `libs/**/*.spec.ts`), las libs **ya se testean**, y `@angular/build:unit-test` es
  app-oriented (per-lib requeriría pelearlo o montar vitest+Angular con tooling nuevo + 13 configs). Mucho
  esfuerzo/incertidumbre por un ahorro trivial de `affected -t test` sobre un suite ya rápido → se difiere.
- **Fase 4 — retirar el boundaries manual** (`d3bde982`). Borra `eslint.boundaries.config.mjs`, quita el script
  `lint:boundaries`, `lint` pasa a `nx run-many -t lint`, y el CI reemplaza los dos steps (Lint web + Boundaries)
  por `nx run-many -t lint` (app + libs). El enforcement migra del manual a Nx (que además cubre ciclos,
  deep-imports e imports hacia arriba).

## Fronteras: tags + depConstraints

| Lib | tags |
|---|---|
| `core/{providers,services,i18n}` | `type:core, scope:core` |
| `shared/{ui,models}`, `plugin-ui-kit` | `type:shared, scope:shared` |
| `features/*` ×9 | `type:feature, scope:<nombre>` |
| `apps/{web,sample-plugin}` | `type:app` |

`depConstraints` en `frontend/eslint.config.mjs`. Cada proyecto matchea exactamente una regla por su `type:*`
(los `scope:*` son inertes: no hay sourceTag para ellos); sin catch-all `*→*`.

## Evidencia
- `nx show projects` = 19; `nx run-many -t lint` **18/18 verde**; prueba negativa (feature→feature falla por tag).
- `nx build web` ✓; `nx test web` **511/511** ✓; app sirve (HTTP 200); `affected` funciona (un cambio en
  `core-i18n` afecta 13 proyectos).

## Notas / deuda diferida
- **~138 warnings** pre-existentes en libs (no-explicit-any 100, non-null 26, unused 12) que nunca se lintearon
  (CI solo linteaba `web`). Quedan como **warnings** (no fallan CI) → limpieza aparte.
- **Fase 3** (test targets por-lib) y `nx affected -t test` en CI quedan agendados si el suite crece.
