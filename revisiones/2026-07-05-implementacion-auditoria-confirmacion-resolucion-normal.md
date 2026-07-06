# Implementación — auditoría de confirmación en la resolución del UNCERTAIN normal (v57-fix, follow-up #2)

Fecha: 2026-07-05
Alcance: implementa el [análisis](2026-07-05-analisis-auditoria-confirmacion-resolucion-normal.md) con la **corrección
del doble-check** (subconsulta escalar, no join). El resolver del UNCERTAIN normal ahora persiste una confirmación de
auditoría por fragmento resuelto en `mt101_confirmation`, en paridad con el correctivo. Sin reenvío, sin rutas legacy.

## Cambios

### Fuente durable (subconsulta escalar, no join)
`Mt101FragmentRepository.unresolvedPayStatusRecords` añade `archiveId` vía **subconsulta escalar**
`(select max(a.id) from mt101_archive a where a.senders_reference = f.senders_reference and
a.process_execution_id = f.process_execution_id)`. **NO** un LEFT JOIN: el índice V36
`(senders_reference, process_execution_id)` es NO único; un join podría multiplicar filas de fragmento → doble
consulta/transición. La subconsulta devuelve exactamente un valor por fragmento (o null). La query sigue 1:1.

### Resolver
`Mt101PayUncertainResolutionService`:
- inyecta `Mt101ConfirmationRepository`;
- por cada fragmento **resuelto** (SENT/REJECTED) arma
  `ConfirmationRow(archiveId, "STATUS_API", result.gatewayReference(), result.confirmedStatus(), result.rawBody())`
  con los datos que el ejecutor **ya devolvía** (antes se descartaban) y batch-insert en `mt101_confirmation` por
  página, en el DataSource de resolución;
- un **pendiente/error** NO deja confirmación (se reintenta luego). **Nunca reenvía.**

## Alcance / decisiones

- **Solo la fila de confirmación** (auditoría). El sync de `mt101_archive` (CONFIRMED/REJECTED) que hace el correctivo
  queda fuera: la transición de `build_fragment` ya es la fuente de verdad del desenlace.
- `archive_id` null como best-effort (si falta `process_execution_id`/archive) — la transición de `build_fragment`
  sigue siendo la verdad; la confirmación huérfana es aceptable (raro en el flujo normal).
- El audit **no aborta** la resolución salvo error de BD real (se propaga como IllegalStateException).

## Pruebas (evidenciadas)

- `Mt101PayUncertainResolutionServiceTest` (+1 = 4, Testcontainers + WireMock):
  `persistsAConfirmationRowPerResolvedFragmentCorrelatedByArchiveId` (SENT → 1 confirmación correlacionada al archive
  por `(senders_reference, process_execution_id)`, con el `confirmedStatus` del gateway; un PENDING → **sin**
  confirmación), más los de v52/v55 (REST accepted/rejected/pending, gateway error, route-aware) — que ahora corren
  con el schema ampliado (archive + confirmation) y la subconsulta escalar.
- **Suite Mt101 completa: 299 tests, 0 fallos** (BUILD SUCCESS), incluyendo los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT`, `Mt101MillionFileProcessE2EIT`, `Mt101OutboundEndToEndIT`), que validan el arranque
  CDI del constructor ampliado del resolver.

## Conclusión

Paridad de auditoría entre el flujo normal y el correctivo: la resolución del UNCERTAIN normal deja evidencia
por-fragmento de la respuesta del banco (`gateway_reference`, `confirmed_status`, `raw_payload`) en
`mt101_confirmation`, correlacionada al archive de forma segura (subconsulta escalar, sin multiplicar filas). Nunca
reenvía; un pendiente no deja rastro hasta resolverse.
