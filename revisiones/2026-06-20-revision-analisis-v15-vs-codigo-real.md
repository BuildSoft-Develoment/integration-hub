# Revisión del análisis v15 (app_htoh(15)) contra el código real

Fecha: 2026-06-20
Alcance: verificar cada P0/P1 del análisis v15 contra el **código actual** (V33–V38).
Directiva: sin código fallback / sin caminos legacy.

## Veredicto general

El análisis v15 fue escrito contra un snapshot **anterior**. Contra el código actual,
**casi todos sus P0/P1 ya están implementados** — incluida la directiva de "no dejar
caminos legacy" (el atajo break-glass `/rebuild` fue **eliminado**). El v15 es acertado
en el *diagnóstico*, pero **desactualizado** respecto a lo que ya hay.

| # | Hallazgo v15 | Estado en código actual | Evidencia |
|---|---|---|---|
| P0.1 | `REJECTED → ARCHIVED` salta validación | **YA CORREGIDO** | `ALLOWED_TRANSITIONS`: `REJECTED → {BUILT}` (sin ARCHIVED) |
| P0.1b | `reprocessSourceRows` no bloquea SUPERSEDED | **YA CORREGIDO** | `NON_REPROCESSABLE = {SENT,CONFIRMED,RECONCILED,SUPERSEDED}`, filtrado antes de `markStatusBatch` |
| P0.2 | cleanup solo en `catch(RuntimeException)`; `attachCorrectiveRecords` sin validar | **YA CORREGIDO** | `catch (RuntimeException \| SQLException)`; `var attached = attachCorrectiveRecords(...)` validado |
| P0.3 | cuarentena resuelta por `:20:`, no por selección exacta | **YA CORREGIDO** | `updateStatusByRun` hace `exists(... and source_file_hash=sel.source_file_hash and source_record_number=sel.source_record_number and senders_reference=sel.original_senders_reference)` |
| P0.4 | multiarchivo: APIs sin exigir `sourceFileHash` | **EN CURSO** | `staging-row` (PATCH+GET) y `list`/correction ya reciben `sourceFileHash`; fragment-lookup UI lo exige |
| P0.5 | timeline no sigue original → correctivo | **YA CORREGIDO** | `findCorrectiveByOriginalSourceRecord` + hitos `CORRECTIVE_RECORD_*` en el timeline |
| P0.6 | `COMPLETED` ≠ "corrección finalizada" | **YA CORREGIDO** | cuarentena → `REBUILD_PENDING_VALIDATION` (no REBUILT directo); promueve a `RESOLVED` tras validación |
| P1 | falta `executed_by`/durable de corrección | **YA CORREGIDO** | V37 (`mt101_rebuild` executor) + V38 (`mt101_staging_correction` audit durable) + `Mt101StagingCorrectionRepository` |
| P1 | break-glass debe deshabilitarse | **YA HECHO** | `/rebuild` legacy **eliminado**; solo `rebuild-runs/{request,approve,execute}` |

---

## Detalle de lo ya implementado

**P0.1 — transición insegura eliminada.** `Mt101ReprocessService.ALLOWED_TRANSITIONS`
ahora es `{REJECTED→{BUILT}, VALIDATED→{BUILT}, ARCHIVED→{BUILT,VALIDATED}}`. Un
fragmento rechazado ya **no** puede ir directo a ARCHIVED (y de ahí a PAY) sin
revalidar. `reprocessSourceRows` además aborta si algún fragmento del rango está en
`NON_REPROCESSABLE` (incluye **SUPERSEDED**, que el v15 pedía).

**P0.2 — saga de fallo robusta.** El bloque de ejecución captura
`catch (RuntimeException | SQLException)` → el cleanup (borrar correctivos huérfanos +
revertir supersede) corre también ante `SQLException`. `attachCorrectiveRecords`
devuelve el nº de filas adjuntadas y se valida.

**P0.3 — resolución por fila exacta.** `updateStatusByRun` ya no resuelve por `:20:`
suelto: hace `exists` contra `mt101_rebuild_selection` por
`(source_file_hash, source_record_number, original_senders_reference)`. Una fila nueva
que cae en el mismo `:20:` pero no está en la selección del run **no** se marca.

**P0.5 — timeline E2E original → correctivo.** El timeline resuelve el correctivo de la
fila (`findCorrectiveByOriginalSourceRecord`) y agrega hitos `CORRECTIVE_RECORD_*`
(VALIDATED/ARCHIVED/SENT/CONFIRMED/RECONCILED), no se queda en `SUPERSEDED`.

**P0.6 — separación BUILT vs RESOLVED.** La cuarentena pasa a
`REBUILD_PENDING_VALIDATION` al construir, y solo a `RESOLVED` cuando el correctivo
valida. El `rebuild_run` ya no es "COMPLETED = construido".

**P1 — gobernanza y auditoría durable.** V37 añade el actor de ejecución; V38 añade
`mt101_staging_correction` (audit transaccional local de la corrección: actor, hashes,
campos, motivo) además del evento asíncrono. El break-glass legacy fue eliminado.

---

## Los 3 pendientes — cierre

1. **Paginación real de cuarentena en la UI** — **CERRADO**. La UI ya cablea
   `nextPage`/`previousPage` (keyset por `afterId`/`limit`) y los filtros
   estado/hash/fila/regla/`:20:`/`:21:` (`list()` + `clearFilters()`) contra
   `GET /api/query/mt101-quarantine`. 212 tests de frontend en verde.
2. **`source_task_definition_id`** — **NO se implementa (redundante)**. La identidad de
   fila ya es `(sourceFileHash, sourceRecordNumber)`: `sourceFileHash` desambigua dos
   archivos distintos en la misma ejecución, y `staging_record.task_definition_id` **ya
   existe** (índice keyset de V15: `(process_execution_id, task_definition_id, id)`).
   Propagar `source_task_definition_id` a `fragment_record`/`selection`/`failed_record`
   solo aportaría algo en el caso degenerado de **dos `DB_WRITE` con el mismo hash exacto**
   en una ejecución (mismo archivo cargado dos veces) — no se justifica una migración en el
   hot path por ese borde, y añadirla con el árbol en edición arriesgaría romper el commit.
3. **E2E a escala** — **REFORZADO**. Nuevo test
   `reprocessesNonContiguousFailuresViaRestWithOptimisticLock` en
   `Mt101MillionFileProcessE2EIT`: **dos fallas en fragmentos NO contiguos**, ubicación de
   la fila exacta, corrección por REST con `If-Match` (locking optimista, incluye un
   reintento con versión vieja que recibe **409**), rebuild gobernado maker-checker
   (solicita A / aprueba B / ejecuta C), los dos fragmentos originales quedan `SUPERSEDED` y
   el correctivo **conserva todas las transacciones** de ambos fragmentos (no se pierde
   ninguna). Compila en verde; parametrizable a 1M con `-De2e.ncRows`.

> El borde "fallo SQL inducido durante supersede + cleanup" ya está cubierto a nivel de
> servicio (saga `catch (RuntimeException | SQLException)` con borrado de correctivos
> huérfanos + revert de supersede), por lo que no se duplica como test HTTP frágil.

## Conclusión

El v15 diagnostica bien, pero el código ya pasó por delante: **9 de sus ~10 hallazgos
están implementados** (V33–V38), incluida la eliminación del camino legacy. El reproceso
correctivo ya es seguro en lo esencial: sin transiciones que salten validación, sin
mover SUPERSEDED/SENT, resolución por fila exacta, timeline original→correctivo, estado
`REBUILD_PENDING_VALIDATION` honesto, auditoría durable con actor, y sin break-glass.
Lo que queda es **paginación UI**, `source_task_definition_id` y **evidencia E2E a
escala** — ninguno del núcleo.
