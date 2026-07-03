# Capacidad de offload async por tarea: guard de backend + gating de UI — 2026-07-03

## Problema (doble check en profundidad)

La pregunta "¿pueden **todas** las tareas soportar async?" reveló que el modelo actual es más
restrictivo de lo que la superficie sugería:

- El **consumer async ejecuta con un `TaskContext` reconstruido** (`new TaskContext(peId, tdId)`): solo
  lleva `processExecutionId`/`taskDefinitionId`, la `configuration` y —en scatter— los `records` del
  slice. **No** propaga el contexto en vivo que el motor síncrono inyecta (`sourcePayload`,
  `readResult`, `taskOutputs`, `executionVariables`).
- Auditoría de los ~20 providers: **casi todos** dependen de ese contexto (directa o indirectamente vía
  `Mt101MessageInputResolver` → `taskOutputs`, o `sourcePayload`/`executionVariables`). El único
  genuinamente offloadable es **`REST_CALL`**, y solo en **scatter** (necesita los `records`, que solo
  viajan como slices; `processExecutionId`/`taskDefinitionId` sí están en el context reconstruido).
- **Fugas silenciosas** que existían sin guard:
  - `DB_WRITE` en modo `once` marcado async → context vacío → `readResult=null` → **escribía cero
    registros en silencio**.
  - Provider **suspendible** (`MT101_STATUS`) marcado async → el consumer hacía
    `if (result.suspended()) → recordDead → DEAD` → la tarea **quedaba colgada**.

## Solución (sin código fallback, falla fuerte)

Capacidad declarada por el provider + guard que **lanza** (no degrada a síncrono ni deja DEAD/no-op).

### SPI

- Nuevo enum **`AsyncOffloadSupport { SUPPORTED, SLICE_ONLY, UNSUPPORTED }`**.
- `TaskProvider.asyncOffloadSupport()` **default `UNSUPPORTED`** (conservador: async deshabilitado hasta
  que el provider declare explícitamente que su trabajo viaja en el envelope).
- `RestCallTaskProvider` → **`SLICE_ONLY`** (único capaz real hoy).

### Motor

- `ProcessTaskRuntimeService.runTask`, al entrar al bloque async (`asyncEnvelope.isPresent()`), llama a
  `guardAsyncOffloadable(provider, taskType, executionMode)`:
  - `instanceof SuspendableTaskProvider` → lanza (suspendible no offloadable: el consumer lo mataría).
  - `SUPPORTED` → cualquier modo; `SLICE_ONLY` → solo `batch`/`per-record`; `UNSUPPORTED` → nunca.
  - Si no procede, `IllegalStateException` con motivo claro. **No hay camino legacy.**
- El **redrive del DLQ** (`buildEnvelope`, ungated) es seguro: solo re-encola tareas ya suspendidas,
  que necesariamente pasaron el guard al despacharse (verificado por `AsyncTaskDlqIT`).

### Catálogo (fuente de verdad para la UI)

- `TaskTypeCatalogEntry` + `TaskTypeResponse` + `GET /api/task-types` exponen `asyncOffload` por tipo.
- `TaskTypeCatalogService` lo resuelve del provider (`resolve(type).asyncOffloadSupport()`); remotos =
  `UNSUPPORTED` (ya son async vía su transporte); tipos sin provider resoluble → `UNSUPPORTED`.

### Frontend (gating por capacidad, mode-aware)

- `MessagingTransportsService.asyncCapabilities()` normaliza `/api/task-types` a `{ TIPO: capacidad }`.
- `ProcessTaskRuntimePanelComponent` la carga y expone `asyncOffloadSupport()` para el tipo actual
  (default `SUPPORTED` ante error/lectura ausente: no gatea por una lectura fallida — el backend es la
  barrera real).
- `AsyncDispatchSectionComponent` (input `offloadSupport`):
  - `UNSUPPORTED` → oculta el toggle + hint `ui.asyncNotSupported`.
  - `SLICE_ONLY` en `once` → oculta + hint `ui.asyncScatterOnly`; disponible en `batch`/`per-record`.
  - Si async ya está activo (config previa), **mantiene el toggle** para poder desactivarlo.

## Pruebas

- **Backend unit (10/10)**:
  - `ProcessTaskRuntimeAsyncGuardTest` (4): lanza para UNSUPPORTED, suspendible y SLICE_ONLY-en-once;
    permite SUPPORTED-once.
  - `TaskTypeCatalogServiceTest` (3, +1 nuevo): el catálogo refleja la capacidad del provider; remoto y
    no-resoluble = UNSUPPORTED.
  - `TaskTypeCatalogResourceTest` (1) y `MessagingTransportsResourceTest` (2): passthrough del campo.
- **Backend IT async (9/9)** — el guard no regresó nada: `AsyncTaskExecutionE2EIT` (3, once async con
  `TEST_FOLLOW_UP`=SUPPORTED), `AsyncScatterGatherE2EIT` (1), `AsyncScatterWiringIT` (1), `AsyncTaskDlqIT`
  (4). Test-providers opt-in: `TEST_FOLLOW_UP`→SUPPORTED, `TEST_SCATTER_BATCH`→SLICE_ONLY.
- **Frontend (23/23)**: `async-dispatch-section.spec` (+6: oculta/hint UNSUPPORTED, SLICE_ONLY por modo,
  toggle visible si ya activo) y `process-task-runtime-panel.spec` (+2: expone capacidad del catálogo,
  default SUPPORTED si ausente).

## Estado

Cerrado el gap real: un tipo no capaz marcado async (por UI **o** JSON/API crudo) ahora **falla fuerte
y visible** en vez de offloadar→DEAD/colgar/no-op. Async sigue opt-in por tarea + gated OFF por feature
flag; la cobertura async-capaz se puede **crecer deliberadamente** (declarar más providers SUPPORTED/
SLICE_ONLY) sin tocar el motor. Los niveles 2 (serializar contexto) y 3 (suspensión anidada) quedan como
propuesta separada por su tamaño.
