# Opción B — Etapa B3: consumer por-slice + gather N→1 — 2026-07-02

El consumer procesa work-items de slice y agrega el scatter, reanudando la tarea **exactamente una
vez** cuando cierra el conteo. Inerte end-to-end hasta cablear el dispatch al motor (B2b).

## Piezas

- **`SliceGatherService`** (atomicidad del gather): `commitCompletedSlice` hace el **dedup por-slice
  (inbox) + el incremento del tracker en UNA transacción**. Si no fueran atómicos, un crash entre
  ambos dejaría la slice "procesada pero no contada" → el scatter nunca llegaría a `total` y la tarea
  quedaría colgada. `insertIfAbsent` ahora devuelve si insertó (1) o era duplicado (0); solo si es
  nuevo se incrementa. `failSlice` transiciona a FAILED (dedupado igual).
- **`AsyncTaskConsumer`** enruta por el header `kind=SLICE`:
  - decodifica `AsyncSliceWorkItem`, resuelve el provider (debe ser `BatchTaskProvider`), reconstruye
    `List<ReadRecord>` y ejecuta `executeRecords` sobre los records de la slice;
  - éxito → `commitCompletedSlice`; **solo la slice que cierra** (`batchCompleted`) dispara
    `completeFromExternalResult` (reanuda la tarea una vez con el resultado agregado);
  - fallo de negocio / provider inválido / suspensión → `failSlice`; **solo la que transiciona** el
    scatter a FAILED falla la tarea una vez;
  - fallo transitorio de `executeRecords` → propaga (nack → reentrega de la slice).

## Garantía exactamente-una-vez

Con N workers en paralelo: el incremento atómico del tracker (Etapa B1) hace que **una** sola slice
vea `batchCompleted`, y el dedup atómico del inbox evita doble conteo por reentrega. Resultado: la
tarea se reanuda (o falla) **exactamente una vez**, sin doble continuación ni continuación perdida.

## Pruebas

- **`AsyncTaskConsumerTest`** **11/11** (8 per-task + 3 slice): una slice intermedia cuenta pero **no**
  reanuda; la última reanuda **una vez** con éxito agregado; una slice fallida que transiciona el
  scatter **falla** la tarea una vez. El provider recibe los records de su slice.
- **`AsyncSliceDispatchServiceTest`** 3/3 (B2) y el per-task **`AsyncTaskExecutionE2EIT` 3/3** sin
  regresión (el nuevo `SliceGatherService` resuelve por CDI; el camino per-task no se toca).

## Estado del roadmap

| Etapa | Qué | Estado |
|---|---|---|
| B1 | Tracker N→1 atómico | ✅ |
| B2 | Dispatch por-slice (productor) | ✅ |
| B3 | Consumer por-slice + gather | ✅ (esta entrega) |
| B2b | Cablear el motor: runTask/fastpath async+batch → `dispatchSlices` (reemplazar el guard) + E2E | pendiente |
| B4 | Fallos parciales: requeue por-slice (hoy: fail-fast) | pendiente |
| B5 | Front: toggle sync/async + transporte + paralelismo + badge | pendiente |

La lógica del scatter-gather está completa y probada; falta **cablearla al motor** (B2b) para el flujo
end-to-end, la política de requeue por-slice (B4) y la UI (B5).
