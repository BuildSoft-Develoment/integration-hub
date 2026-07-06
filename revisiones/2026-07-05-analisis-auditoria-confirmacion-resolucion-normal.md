# Análisis — persistencia de confirmación de auditoría en la resolución del UNCERTAIN normal (follow-up #2 de v52/v55)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Contexto: el resolver del UNCERTAIN normal (`Mt101PayUncertainResolutionService`) consulta el gateway por fragmento y
transiciona `build_fragment` a SENT/REJECTED, pero **no** persiste una fila de confirmación por-fragmento. El
correctivo sí (escribe `mt101_confirmation` vía `persistConfirmations`). Falta el rastro de auditoría de qué respondió
el banco en la resolución normal.

## Estado hoy (verificado)

- El resolver clasifica `confirmedStatus` y transiciona `build_fragment`; **descarta** `rawBody`/`gatewayReference`
  que el ejecutor ya devuelve (`StatusQueryResult(confirmedStatus, gatewayReference, rawBody, pending, error)`).
- No hay inserción en `mt101_confirmation`. El motivo del rechazo queda en `build_fragment.error_message` + los
  conteos en la respuesta del endpoint, pero **no** hay evidencia por-fragmento de la respuesta del gateway
  (payload crudo, gateway_reference, timestamp).

## Piezas disponibles (a reusar)

- `mt101_confirmation` (V12): `(archive_id → mt101_archive, confirmation_type, gateway_reference, confirmed_status,
  raw_payload, received_at)`. Correlaciona **solo** por `archive_id` (no tiene senders_reference) → **se necesita
  archive_id** para que la confirmación sea trazable.
- `Mt101ConfirmationRepository.insertConfirmations(connection, table, rows)` — batch, `archive_id` admite null.
- Correlación disponible: `mt101_archive` tiene `process_execution_id` (V36) + índice
  `(senders_reference, process_execution_id)`. `build_fragment` también tiene `process_execution_id`. Así
  `archive_id` se obtiene por `join mt101_archive a on a.senders_reference = f.senders_reference and
  a.process_execution_id = f.process_execution_id` — único e indexado.
- El ejecutor **ya provee** `rawBody`/`gatewayReference`/`confirmedStatus` (diseñado así en v55) → no hay que tocarlo.

## Diseño propuesto (bounded, sin reenvío)

1. **Enriquecer la fuente durable** `unresolvedPayStatusRecords`: añadir `archiveId` al registro vía el join a
   `mt101_archive` por `(senders_reference, process_execution_id)` (left join → null si no hay archive).
2. **Persistir confirmación en el resolver**: para cada fragmento **resuelto** (SENT/REJECTED), armar
   `ConfirmationRow(archiveId, "STATUS_API", result.gatewayReference(), result.confirmedStatus(), result.rawBody())`
   y batch-insert vía `Mt101ConfirmationRepository` en la conexión de resolución. (El resolver hoy descarta
   rawBody/gatewayReference; pasa a conservarlos por página.)
3. **Alcance:** solo la fila de confirmación (auditoría). El sync de `mt101_archive` (CONFIRMED/REJECTED) que hace el
   correctivo queda fuera — la transición de `build_fragment` ya refleja el desenlace; sincronizar el archive es un
   concern aparte que se puede añadir después.

## Consideraciones / riesgos

- **archive_id null**: si `build_fragment.process_execution_id` es null o no hay archive, `archive_id` = null → la
  confirmación queda huérfana (no trazable). En el flujo normal `process_execution_id` está poblado; documentar el
  supuesto y aceptar null como best-effort (la transición de `build_fragment` sigue siendo la fuente de verdad).
- **Multi-DB**: `mt101_confirmation`/`mt101_archive`/`build_fragment` deben estar co-locados en la BD de
  `connectionRef` (lo están en el pipeline normal). Se persiste en el mismo DataSource que la resolución.
- **Pendiente/error**: sin respuesta concluyente del gateway → **no** se persiste confirmación (igual que el
  correctivo; se reintenta luego).
- **Valor vs money-path**: es traza/gobierno (evidencia de la respuesta del banco), **no** correctitud — v52/v55 ya
  transicionan `build_fragment` correctamente. Prioridad menor que los money-path cerrados.

## Veredicto

Gap **REAL de trazabilidad** (no de correctitud): la resolución normal no deja evidencia por-fragmento de la respuesta
del gateway, a diferencia del correctivo. Bounded: un join extra en la query durable + un insert batch reusando
`Mt101ConfirmationRepository` (el ejecutor ya da los datos). Sin reenvío. Recomendado para paridad de auditoría entre
el flujo normal y el correctivo.
