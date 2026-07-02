# Revisión del análisis v16 (app_htoh(16)) contra el código real

Fecha: 2026-06-20
Alcance: verificar cada bloqueante/riesgo del v16 contra el **código actual** (V33–V38).
Directiva: sin código fallback / sin caminos legacy.

## Veredicto general

A diferencia del v15 (que estaba desactualizado, ~9/10 ya implementado), el **v16 acierta**:
los 6 puntos son **gaps reales y abiertos** en el código actual. El reproceso correctivo ya
es sólido en lo funcional (ubicar la fila, corregir, reconstruir el fragmento, no perder
transacciones), pero la **integridad del reproceso gobernado** todavía tiene huecos de
concurrencia, atomicidad y congelado maker-checker. Confirmo todos contra `file:line`.

| # | Hallazgo v16 | Veredicto | Evidencia en código |
|---|---|---|---|
| B1 | `correctiveSetId` reusable puede borrar un lote existente | **VÁLIDO** | `Mt101RebuildService:79-82` solo valida `corrective != set`; `createRun` (`Mt101RebuildRepository:30`) solo protege `on conflict (rebuild_run_id)`; al ejecutar `replaceExisting=true` (`Mt101RebuildService:271`) borra el set destino |
| B2 | La aprobación no congela los datos aprobados | **VÁLIDO** | `insertSelectionFromFragmentRecords` (`Mt101RebuildRepository:329-333`) NO guarda `payload_hash` ni `staging_version`; el build correctivo relee el staging **actual** |
| B3 | `reprocessSourceRows` tiene carrera de estados | **VÁLIDO** | `updateStatusBatch` (`Mt101FragmentRepository:172-173`) actualiza por `(fragment_set_id, senders_reference)` **sin** `and status = esperado`; el chequeo previo (`Mt101ReprocessService:160-179`) es TOCTOU |
| B4 | Auditoría de reproceso no atómica con el cambio de estado | **VÁLIDO** | `markStatusBatch` (conexión propia) y `auditRepository.insert(dataSource, …)` son transacciones distintas (`Mt101ReprocessService:186-193`; idem `resetByStatus:94-97`) |
| B5 | Un rebuild correctivo rechazado no reabre la cuarentena | **VÁLIDO** | `deriveLifecycleStatus` devuelve `FAILED` con fragmentos REJECTED (`Mt101RebuildRepository:202-203`), pero `quarantineStatus("FAILED")` cae en `default → null` (`Mt101RebuildService:376-385`) → el `failed_record` se queda en `REBUILD_PENDING_VALIDATION` |
| R6 | Lifecycle depende de abrir la pantalla | **VÁLIDO** | `synchronizeLifecycle` se invoca **solo** en `Mt101QuarantineResource:152` (listar); sin scheduler ni hooks en los providers; `last_lifecycle_sync_at` existe en V33 pero **nunca se escribe** |
| R7 | La corrección de staging no tiene aprobación propia | **VÁLIDO (diseño)** | la corrección (`Mt101StagingCorrectionService`) es independiente del maker-checker; el operador edita el payload antes del rebuild (se solapa con B2) |
| R8 | Multiarchivo: mismo hash, distinto origen | **VÁLIDO (matiz)** | identidad = `sourceFileHash + sourceRecordNumber`; dos archivos byte-idénticos de orígenes distintos comparten SHA-256 → ambigüedad. Es el **caso complementario** al v15 |

---

## Detalle verificado y corrección sin fallback

### B1 — `correctiveSetId` reusable (riesgo destructivo)
**Hoy:** `requestRebuildFromQuarantine` solo rechaza `corrective == set`
(`Mt101RebuildService.java:80`). `createRun` inserta con `on conflict (rebuild_run_id)
do nothing` (`Mt101RebuildRepository.java:30`) — protege el *id de run*, no que el
`correctiveSetId` ya exista como **lote de fragmentos** legítimo. Al ejecutar,
`correctiveConfig` fuerza `replaceExisting=true` (`Mt101RebuildService.java:271`) y
`MT101_BUILD_FROM_TABLE` hace `delete from mt101_build_fragment where fragment_set_id = ?`
(`Mt101FragmentRepository.java:23`). Si `correctiveSetId` apunta a un lote real, se borra.

**Corrección (sin fallback):**
- El **servidor genera** el `correctiveSetId` de forma determinística e irrepetible:
  `<original>-FIX-<rebuildRunId>` (o sufijo con `reference_code`). La API/UI deja de
  aceptar un `correctiveSetId` arbitrario del cliente.
- En `request`, **rechazar** (no degradar) si el id generado ya existe en
  `mt101_build_fragment` o en otro `mt101_rebuild_run`. Falla ruidosa.

### B2 — La aprobación no congela los datos aprobados
**Hoy:** `mt101_rebuild_selection` persiste `source_file_hash, source_record_number,
record_index, staging_id, original_:20:/:21:` (`Mt101RebuildRepository.java:329-333`),
pero **no** `payload_hash` ni `staging_version`. El build correctivo relee el staging
**vigente** por `processExecutionId + rebuildRunId`. Secuencia rota: A corrige la fila →
solicita → B aprueba → A vuelve a editar la fila → ejecutar usa el payload nuevo, no el
aprobado. La segregación maker-checker queda debilitada.

**Corrección (sin fallback):**
- Al **solicitar/aprobar**, snapshot por fila en `mt101_rebuild_selection`:
  `selected_payload_hash`, `selected_staging_version` (tomados de `staging_record`).
- Al **ejecutar**, comparar contra el staging actual; si difiere, **invalidar la
  aprobación** y devolver el run a `REQUESTED` (no ejecutar con datos no aprobados).
- **Bloquear** nuevas correcciones de filas que estén en un run `APPROVED`/`BUILDING`
  (lock lógico en `Mt101StagingCorrectionService`, error 409 explícito).

### B3 — Carrera de estados en `reprocessSourceRows`
**Hoy:** el servicio valida estados (`Mt101ReprocessService.java:160-179`) y luego llama a
`markStatusBatch` → `updateStatusBatch` con
`update … set status = ? where fragment_set_id = ? and senders_reference = ?`
(`Mt101FragmentRepository.java:172-173`), **sin** condición de estado. Entre el chequeo y
el update, `MT101_PAY` puede marcar `SENT` y el reproceso lo pisaría a `BUILT`
(retroceder un pago enviado). El patrón seguro **ya existe** en el repo: `resetStatus`
(`:383`, `and status = ?`) y `markSupersededByReferences` (`:554`, `and status = ?`).

**Corrección (sin fallback):**
- Transición **condicional** por fila:
  `update … set status = :to where fragment_set_id = :set and senders_reference = :ref
  and status = :expected`, y **verificar `rowcount == esperado`**; si no, abortar toda la
  operación (no marcar parcialmente). Reusar el patrón de `resetStatus`/`markSuperseded`.

### B4 — Auditoría no atómica con el cambio de estado
**Hoy:** `reprocessSourceRows` hace `markStatusBatch` (conexión propia del `FragmentStore`)
y después `auditRepository.insert(dataSource, …)` (`Mt101ReprocessService.java:186-193`):
dos transacciones independientes. Si el cambio de estado aplica y el insert de auditoría
falla, la mutación queda **sin evidencia durable local**. Idéntico en `resetByStatus`
(`:94-97`). Para banca esto no puede ser best-effort.

**Corrección (sin fallback):**
- Operación única de repositorio `transitionFragmentStatusAndAudit(...)` que en **una sola
  transacción local** haga el `update` condicional (B3) + el `insert` en
  `mt101_reprocess_audit` y haga `commit` atómico; rollback si cualquiera falla.

### B5 — Rebuild correctivo rechazado no reabre la cuarentena
**Hoy:** `deriveLifecycleStatus` devuelve `FAILED` cuando el set correctivo tiene REJECTED
(`Mt101RebuildRepository.java:202-203`); el run avanza a `FAILED`
(`updateLifecycleIfAdvanced:271-274`). Pero en `synchronizeLifecycle`,
`quarantineStatus("FAILED")` no tiene `case` → `null` (`Mt101RebuildService.java:376-385`)
→ no se toca `failed_record`, que queda en `REBUILD_PENDING_VALIDATION`. La operación ve
`run=FAILED` y `cuarentena=PENDING_VALIDATION`: incoherente.

**Corrección (sin fallback):**
- Añadir `case "FAILED" -> "REBUILD_REJECTED"` en `quarantineStatus` (estado explícito),
  conservando `rebuild_run_id`, `:20:/:21:` correctivos y la regla nueva, para que la
  operación sepa que debe corregir de nuevo o abrir un run nuevo. Alternativa equivalente:
  reabrir a `QUARANTINED` con esos metadatos. Sin estado ambiguo.

### R6 — Lifecycle solo avanza al abrir la pantalla
**Hoy:** `synchronizeLifecycle` se llama únicamente al listar cuarentena
(`Mt101QuarantineResource.java:152`). No hay scheduler ni hook tras
VALIDATE/ARCHIVE/PAY/STATUS/RECONCILE. La columna `last_lifecycle_sync_at` (V33) **no se
escribe** en ninguna parte. Un correctivo confirmado por el banco puede seguir en `BUILT`
hasta que alguien abra la UI.

**Corrección (sin fallback):**
- Sincronizar el lifecycle del run **en los providers MT101** (al cerrar cada etapa del set
  correctivo) o con un scheduler dedicado, y **persistir `last_lifecycle_sync_at`** en cada
  pasada. La UI deja de ser el disparador de la verdad.

### R7 — La corrección de staging no tiene aprobación propia
**Hoy:** la corrección audita fuerte (actor, motivo, ticket, hashes, campos, versión vía
`mt101_staging_correction`), pero es independiente del maker-checker. El operador puede
editar el payload antes del rebuild. Se solapa con B2.

**Corrección (sin fallback):** cubierto por B2 (snapshot + lock + invalidación). Si el
piloto lo exige, formalizar `CORRECTION_REQUESTED → CORRECTION_APPROVED → APPLIED`, pero
B2 ya cierra el agujero de integridad esencial.

### R8 — Multiarchivo: mismo hash, distinto origen
**Matiz importante** respecto al v15: allí concluí que `source_task_definition_id` era
redundante porque `sourceFileHash` desambigua **contenidos distintos**. El v16 plantea el
**caso complementario** y correcto: dos archivos **byte-idénticos** de orígenes distintos
(`/sftp/bancoA/pagos.csv` y `/sftp/bancoB/pagos.csv`) comparten SHA-256 → `(hash,
recordNumber)` colisiona. `staging_record` ya tiene `process_execution_id` y
`task_definition_id`; faltaría persistir `source_instance_id`/`source_location` y propagarlo
al lineage MT101 para una identidad operativa completa:
`processExecutionId + sourceTaskDefinitionId + sourceInstanceId + sourceFileHash +
sourceRecordNumber`. Es un borde raro pero real para banca; razonable cerrarlo antes de
multiarchivo concurrente de orígenes distintos.

---

## Lo que el v16 da por pendiente y **ya está resuelto**

- **Ejecución concurrente del mismo run (test #7)** — ya cubierto: `claimForExecution`
  hace la transición atómica `APPROVED → BUILDING` condicional
  (`Mt101RebuildService.java:196`, `Mt101RebuildRepository.java:113`); solo un executor gana.
- **Bloqueo de SENT/CONFIRMED/RECONCILED/SUPERSEDED** en reproceso técnico — ya cubierto
  (`Mt101ReprocessService.java:40,160-168`). El hueco no es *si* bloquea, sino la **carrera**
  (B3): el bloqueo es read-then-act, no un update condicional atómico.
- **`REJECTED → ARCHIVED` eliminado** — confirmado (`ALLOWED_TRANSITIONS`, `:31-34`).

## Prioridad recomendada (sin fallback, antes de piloto)

1. **B1** — `correctiveSetId` generado por servidor + rechazo si ya existe (destructivo).
2. **B2** — snapshot `payload_hash`/`staging_version` al aprobar + lock de corrección.
3. **B4 + B3** — `transitionFragmentStatusAndAudit` en una transacción con update condicional.
4. **B5** — `REBUILD_REJECTED` (o reapertura) para el correctivo fallido.
5. **R6** — lifecycle automático + `last_lifecycle_sync_at`.
6. **R8** — `source_instance_id` en la identidad (multiarchivo de orígenes idénticos).

## Prueba crítica para v16 (estado)

El plan de 12 pasos del v16 es correcto. Estado actual del E2E:
- Pasos 1-5, 11 (ubicar fila, PATCH+If-Match, request/approve por otro usuario, no perder
  transacciones, no contiguos) — **cubiertos** por
  `Mt101MillionFileProcessE2EIT.reprocessesNonContiguousFailuresViaRestWithOptimisticLock`.
- Paso 7 (dos execute concurrentes, uno gana) — **cubierto** por `claimForExecution`
  (falta el test que lo ejerza explícitamente en concurrencia).
- Pasos 6, 8, 9, 10, 12 (editar tras aprobar invalida; `correctiveSetId` existente falla
  sin borrar; PAY vs REJECTED→BUILT nunca retrocede; REBUILD_REJECTED reabre; lifecycle sin
  UI) — **fallan hoy**: dependen de B1, B2, B3, B5 y R6.

## Conclusión

El v16 es un **buen análisis y vigente**: identifica los riesgos reales que quedan, todos
verificados en el código. El núcleo (1M → fila exacta → corrección → set correctivo → no
perder transacciones) está fuerte; lo que falta es **blindar la integridad del reproceso
gobernado** contra concurrencia, mutaciones post-aprobación, atomicidad de auditoría,
coherencia del estado de cuarentena y avance automático del lifecycle. En ese orden.

---

## Implementación (2026-06-20) — sin fallback / sin caminos legacy

| # | Estado | Qué se implementó |
|---|---|---|
| **B1** | ✅ Hecho | El `correctiveSetId` lo **genera el servidor**: `<original>-FIX-<referenceCode>` (secuencia de BD). La API/UI dejó de aceptarlo del cliente (`requestRebuild` sin `correctiveSetId`). Se **rechaza** (`fragmentSetExists`) si el id ya existe como lote. `createRun` ya no usa `on conflict do nothing`. |
| **B2** | ✅ Hecho | Migración **V39**: `mt101_rebuild_selection.selected_payload_hash` + `selected_staging_version`. La selección congela hash SHA-256 + versión del staging al solicitar. Al ejecutar, `countStaleSelections` compara contra el staging actual; si cambió, `revertApprovalToRequested` revoca la aprobación y aborta. Además, corregir una fila en un run `APPROVED`/`BUILDING` da **409** (`RowLockedForRebuildException`). |
| **B3** | ✅ Hecho | `transitionStatusConditional`: UPDATE por referencia con `and status = :esperado`; si el nº de filas cambiadas ≠ esperado, **rollback** (no pisa un PAY concurrente). |
| **B4** | ✅ Hecho | `reprocessSourceRows` y `resetByStatus` hacen el cambio de estado **+** el `insert` de `mt101_reprocess_audit` en **una sola transacción local** (overloads connection-scoped). |
| **B5** | ✅ Hecho | `quarantineStatus("FAILED") -> "REBUILD_REJECTED"` (estado explícito). Frontend: `REBUILD_REJECTED` clasificado como error en timeline + color en cuarentena. |
| **R6** | ✅ Hecho | `Mt101RebuildLifecycleScheduler` (`@Scheduled`, `integrationhub.mt101.rebuild-lifecycle-sync-every:60s`) → `synchronizeActiveLifecycles()` sobre `findActiveOriginalSets()`. `touchLifecycleSync` persiste `last_lifecycle_sync_at` en cada pasada. El lifecycle ya no depende de abrir la UI. |
| **R8** | ⏸️ Diferido | `source_instance_id` (mismo hash, distinto origen). Requiere propagar una nueva dimensión de identidad por el **hot path** de ingesta (staging→fragment_record→selection→failed_record) y todas las consultas/UI. Es el borde más raro (dos archivos byte-idénticos de orígenes distintos en una ejecución) y el más invasivo; se deja como follow-up acotado para no arriesgar el flujo bancario que ya funciona. La identidad actual `(sourceFileHash, sourceRecordNumber)` sigue siendo correcta para todo lo demás. |

**Limpieza de código muerto:** se quitó la dependencia `Mt101FragmentStore` (sin uso) de
`Mt101ReprocessService`, el método `fragmentSource`, el `rebuildRunParams`/`fieldCorrective`
del frontend, y el test del path eliminado (`rejectsCorrectiveSetEqualToOriginal`).

**Verificación:** `compile` + `test-compile` en verde; `Mt101RebuildServiceTest`,
`Mt101ReprocessServiceTest`, `Mt101StagingCorrectionServiceTest`,
`Mt101LargeVolumeLineageRebuildTest` pasan (Testcontainers); frontend 212/212 y build de
producción OK.
