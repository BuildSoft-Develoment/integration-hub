# Opción B — E2E completo del scatter-gather (cierra el hueco del doble check B4) — 2026-07-03

Valida el lazo scatter-gather **end-to-end** en un solo test, cerrando el único hueco de cobertura que
el doble check de B4 identificó (cada pieza estaba probada por unidad/IT, pero no el flujo completo).

## Qué ejercita (sin FILE_READ)

En vez de montar un FILE_READ real (archivo + reader) para alimentar records, el scatter se inyecta vía
`suspendTask(..., ScatterDispatch)` —exactamente lo que hace el motor en B2b— y luego se entregan los
work-items al consumer real:

1. **Dispatch atómico (B2b + B1 + B2)**: `suspendTask(scatter de 3 slices)` abre el tracker con
   `total=3`, encola 3 work-items `kind=SLICE` y suspende la tarea, en una sola transacción.
2. **Consumo por-slice (B3)**: se leen los 3 `envelope_json` del outbox (== payload de wire) y se pasan
   al `AsyncTaskConsumer`; cada uno ejecuta el `BatchTaskProvider` de prueba sobre los records de su
   slice.
3. **Gather N→1 (B1 + B3)**: las dos primeras slices cuentan sin reanudar; la **tercera cierra** el
   conteo y dispara `completeFromExternalResult` una sola vez.
4. **Completación (Etapa 4)**: la tarea suspendida se reanuda y el proceso completa.

## Aserciones (todo verificado)

- `SLICE_EXECUTIONS == 3` (una ejecución por slice) y `TOTAL_RECORDS == 5` (los 5 records repartidos
  llegaron completos a los workers) → el reparto por-slice es correcto y sin pérdida.
- `task_async_dispatch.status == COMPLETED` → el gather cerró.
- `process_task_execution.status == COMPLETED` y `process_execution.status == COMPLETED` → la tarea se
  reanudó y el proceso completó (una sola vez, en la última slice).
- `task_inbox` = 3 filas `PROCESSED` → dedup por-slice correcto.

## Pieza de prueba

- `RecordingBatchTaskProvider` (test-only, `TEST_SCATTER_BATCH`): cuenta slices ejecutadas y records
  totales; devuelve success. Es el "worker" del scatter en el test.
- `AsyncScatterGatherE2EIT` **1/1** (Postgres real).

## Estado

Backend de la **Opción B completo y verificado end-to-end** (B1 tracker · B2 dispatch · B3 gather ·
B2b motor · B4 fallos parciales · **E2E completo**). Pendiente: front (B5, no ejecutable en este
entorno) y follow-ups (scatter para input table-streaming, redrive por-slice del inbox).
