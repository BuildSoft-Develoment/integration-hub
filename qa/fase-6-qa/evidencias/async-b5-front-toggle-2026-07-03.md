# Opción B — B5 (front): selector sync/async de tarea — 2026-07-03

Primer slice del front del feature async (ADR-015): el componente reusable que expone en la UI la
elección sync/async que hoy solo existe como config JSON en el backend. **Verificado** (pude ejecutar
el test de front: `nx test web --include=...` → 8/8).

## Piezas

- **`AsyncDispatchSectionComponent`** (standalone, signals, Material, i18n): presentacional — recibe
  `async`/`transport`/`continueOnFailure`/`executionMode`/`transports`/`readonly` y emite
  `asyncChange`/`transportChange`/`continueOnFailureChange`. El form host persiste los cambios en la
  config de la tarea.
  - `distributed = async && (executionMode ∈ {batch, per-record})` → distingue **scatter** (Opción B)
    de **offload per-task** (once). El `continueOnFailure` y el hint de "distribuido" solo aparecen en
    modo scatter.
- **`MessagingTransportsService`**: `GET /api/messaging/transports` (endpoint ya construido) → lista de
  transportes para el selector.
- **i18n**: keys `ui.asyncDispatch*` / `ui.asyncMode*` en `es.ts` + `en.ts`.

## Semántica reflejada en la UI

| async | executionMode | Hint |
|---|---|---|
| off | * | "Se ejecuta en el motor de forma síncrona." |
| on | once | "Se offloada al broker … como una unidad (per-task)." |
| on | batch/per-record | "Se reparte en slices … distribuido entre workers (scatter-gather)." |

## Pruebas

- **`AsyncDispatchSectionComponent` spec 8/8** (`nx test web --include=<spec>`): batch/per-record async
  ⇒ distributed; once async ⇒ no distributed; async off ⇒ no distributed; los 3 hints según
  async+mode; emite los 3 cambios. (Fix aplicado: un `it` no puede reconfigurar TestBed dos veces →
  tests separados por caso.)

## Estado / integración

El componente reusable está **verificado**. Falta el paso de **integración** en los `process-task-form`
(añadir `async`/`transport`/`continueOnFailure` al draft de cada tipo + serialización a la config JSON
+ render de `<ih-async-dispatch-section>` + fetch de transportes). Es de bajo riesgo ahora que el
componente está verificado; se hace por-form (o en un área compartida de "opciones de ejecución").
