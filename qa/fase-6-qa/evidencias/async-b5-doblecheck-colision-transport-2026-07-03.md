# Doble check B5 + serialización compartida — colisión `transport` — 2026-07-03

La integración del front destapó un **bug real de colisión de nombres** (vía un error de tipos de TS),
latente también en el backend. Corregido en ambos lados + serialización async compartida para todas las
tareas runtime.

## Hallazgo (colisión `transport`)

El despacho async usaba la clave de config `transport` para el **broker**, pero MT101 ya usa
`transport` como **ruta de pago** (`Mt101PayTransport`: DB/REST/SFTP...). Doble uso de la misma clave:

- **Backend**: `TaskDispatchPlanner` leía `config.get("transport")` como broker → una tarea MT101
  marcada async leería p.ej. `"REST"` como broker → `MessageBrokerRegistry.resolve("REST")` falla.
  Latente (async gated) pero real.
- **Frontend**: al añadir `transport?: string` a la base `ProcessTaskRuntimeDraft`, colisionó con
  `Mt101PayTaskDraft.transport: Mt101PayTransport` → error de compilación TS2345.

## Corrección: clave propia `asyncTransport`

- **Backend** `TaskDispatchPlanner`: lee `asyncTransport` (no `transport`). Tests actualizados.
- **Frontend** base `ProcessTaskProvider` (compartida por todas las tareas runtime):
  - `ProcessTaskRuntimeDraft` gana `async?`, `asyncTransport?`, `continueOnFailure?`.
  - `hydrateRuntime` (config→draft) y `withRuntime` (draft→config) los mapean con la clave
    `asyncTransport`. **Condicionales**: solo presentes cuando activos → un draft/config síncrono queda
    idéntico que antes (no rompe roundtrips estrictos ni ensucia la config).

## Pruebas

- **Backend**: `TaskDispatchPlannerTest` 6/6, `AsyncTaskDispatchServiceTest` 6/6 (con `asyncTransport`),
  `AsyncTaskExecutionE2EIT` 3/3.
- **Frontend** (`nx test web --include=<spec>`):
  - `db-task-binding.spec` **9/9** (2 nuevos: round-trip de `async`/`asyncTransport`/`continueOnFailure`;
    y sync omite las claves async y no colisiona con `transport`).
  - `mt101-pay.provider.spec` **9/9** (roundtrip de dominio intacto → la serialización compartida no
    afecta a las tareas existentes).
  - `async-dispatch-section.component.spec` 8/8.

## Estado

Colisión resuelta y serialización async compartida en la base (todas las tareas runtime persisten
`async`/`asyncTransport`/`continueOnFailure`). Falta el render de `<ih-async-dispatch-section>` en los
templates de los task-forms (por-form o en un área compartida de opciones de ejecución) — siguiente
slice, ya de bajo riesgo y verificable.
