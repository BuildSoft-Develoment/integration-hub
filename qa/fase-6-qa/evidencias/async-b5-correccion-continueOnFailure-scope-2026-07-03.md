# Corrección B5: `continueOnFailure` es política de tarea general, no async — 2026-07-03

Tu consulta destapó un error de **scope en la UI**: puse `continueOnFailure` dentro de la sección
async, pero es una política de ejecución de **tarea general** (existe en el backend síncrono desde
antes), distinta del `fileErrorPolicy` de **source**.

## Los tres ámbitos (verificados en código)

| Config | Ámbito | Backend | Front antes |
|---|---|---|---|
| `fileErrorPolicy` (failFast/continue) | por **archivo** (source) | `StreamingPipelineService`, `FileReadTaskFastPath` | ✅ existe (source providers) |
| `continueOnFailure` (bool) | por **tarea** | `ProcessExecutionService:234` (sync) + scatter async (B4) | ❌ no existía |
| `asyncTransport` / `async` | despacho | `TaskDispatchPlanner` | (componente async nuevo) |

`continueOnFailure` lo reusa mi scatter (fallos de slice), pero es **la misma clave de task-level** que
el motor síncrono ya honra para cualquier tarea que falle.

## Corrección

- **`AsyncDispatchSectionComponent`**: se le quitó `continueOnFailure` (input/output/toggle). Queda solo
  el toggle async + el selector de transporte + el hint de modo (per-task vs scatter).
- **`TaskContinueOnFailureComponent`** (nuevo): componente general presentacional para la política
  `continueOnFailure`, independiente de async — aplica a cualquier tarea (batch síncrono incluido, que
  no tenía UI). Distinto del `fileErrorPolicy` de source.
- **i18n**: `ui.asyncContinueOnFailure` → `ui.continueOnFailure` + `ui.continueOnFailureHint` (es/en).
- La **serialización** en la base compartida (`ProcessTaskProvider`) ya era general y no cambia:
  `continueOnFailure` se persiste para cualquier tarea runtime, condicional (solo si true).

## Pruebas

- **`AsyncDispatchSectionComponent` spec** (recortado) y **`TaskContinueOnFailureComponent` spec**
  (nuevo): **11/11** verdes (`nx test web --include=<specs>`).
- La serialización compartida sigue cubierta por `db-task-binding.spec` (round-trip async 9/9) y
  `mt101-pay` (dominio intacto) del commit previo.

## Estado

Scope corregido: async section = async + transporte; `continueOnFailure` = opción de tarea general.
Falta el render de ambos componentes en los templates de los task-forms (siguiente slice).
