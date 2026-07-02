# Revisión del análisis v14 (app_htoh(14)) contra el código real

Fecha: 2026-06-19
Alcance: verificar estáticamente cada P0/P1 del análisis v14 contra el código real.
Sin código fallback (los fixes fallan fuerte, no degradan en silencio). SOLID + ADR-011.

## Veredicto general

El análisis v14 es **el más preciso de la serie**: acredita bien los fixes de v13 y
acierta en casi todos los pendientes. De sus hallazgos, **2 P0 eran reales y se
corrigieron ahora** (race de ejecución, timeline con tope 5000); el maker-checker y
varios P1 son ciertos; y el multiarchivo mantiene el matiz de v13 (no es bug hoy).

| # | Hallazgo v14 | Veredicto vs código | Acción |
|---|---|---|---|
| P0.1 | Maker-checker omitible (legacy + UI + sin SoD) | **CIERTO (parcial)** | claim atómico ✓; SoD/UI pendiente |
| P0.2 | Race: dos executes concurrentes del mismo run | **CONFIRMADO** | **FIXED** (claim atómico APPROVED→BUILDING) |
| P0.3 | Multiarchivo ambiguo (recordNumber global) | **Matiz** (no bug hoy) | P2 (igual que v13) |
| P0.4 | Timeline no escala (`findBySet(5000)` + scan) | **CONFIRMADO** | **FIXED** (lookup indexado por fila) |
| P1 | `:20:` correctivo puede exceder 16 chars | **CIERTO (teórico)** | **FIXED** (guard fail-fast) |
| P1 | `mt101_fragment_record.status` desincronizado | **CIERTO** | pendiente (decisión) |
| P1 | Timeline financiero por `:20:` sin scope fuerte | **CIERTO (riesgo bajo)** | pendiente |
| P1 | Fragmentos correctivos huérfanos tras fallo parcial | **CIERTO** | pendiente (cleanup) |

---

## P0.2 — CONFIRMADO y CORREGIDO: race de ejecución concurrente

`executeApprovedRebuildRun` hacía: leer run (check `APPROVED` en Java) → luego
`markStatus(runId, "BUILDING")` **incondicional** → build. Dos ejecuciones simultáneas
podían pasar el check y ambas construir el mismo set correctivo (fragmentos duplicados,
supersede parcial).

**Fix (sin fallback):** transición atómica condicional
```sql
update mt101_rebuild_run set status='BUILDING' where rebuild_run_id=? and status='APPROVED'
```
`Mt101RebuildRepository.claimForExecution` devuelve true solo si ESTA llamada hizo la
transición. Si no (otro executor ya lo tomó), `Mt101RebuildService` **lanza** en vez de
construir un segundo set.

## P0.4 — CONFIRMADO y CORREGIDO: timeline con tope 5000

`Mt101RowTimelineService` cargaba `failedRecordRepository.findBySet(set, null, 5000)` y
**escaneaba** buscando la fila. Con >5000 cuarentenas, una fila más allá del tope no
mostraba su `RECORD_VALIDATION_ISSUE`.

**Fix:** usar el lookup **indexado** que ya existía,
`findBySourceRow(set, recordNumber, null, 50)` (por `(fragment_set_id, source_record_number)`),
sin escanear las primeras 5000.

## P1 — CORREGIDO: `:20:` correctivo > 16 chars

`:20: = R + reference_code + messageIndex`. `reference_code` es `varchar(12)` y
`messageIndex` llega hasta el nº de fragmentos correctivos. En el peor caso teórico
`1 + 12 + len(N)` puede pasar de 16 (límite SWIFT de `:20:`). **Fix:** validar
`1 + reference_code.length() + len(affectedFragments) <= 16` antes de construir; si no,
**abortar** (sin truncado silencioso). En la práctica el código de secuencia es corto
(p.ej. `1`), así que nunca se alcanza; el guard evita el caso patológico.

## P0.1 — CIERTO (parcial): maker-checker

- `POST /mt101-quarantine/rebuild` (legacy) hace request+approve+execute en una llamada.
- La UI usa ese endpoint legacy, no el flujo gobernado `/rebuild-runs/{request,approve,execute}`.
- `approveRun` valida `status='REQUESTED'` pero **no** `approved_by != requested_by`.

El **claim atómico** (P0.2) cierra la parte de doble-ejecución. Lo que queda es
gobernanza: la **segregación de funciones** (approver ≠ requester) y que la **UI use el
flujo gobernado**. No se fuerza SoD aún porque rompería el atajo legacy de un actor;
requiere primero retirar/segregar ese endpoint. Pendiente acordado.

## P0.3 — Matiz (no bug hoy)

`recordNumber` es global por ejecución (no 1-based por archivo). Como `(fragmentSetId,
recordNumber)` es único dentro de la ejecución, **no hay ambigüedad** en correction/
timeline hoy. Solo sería bug si se adopta numeración por-archivo, y entonces habría que
exigir `sourceFileHash`. Decisión de diseño, P2.

## P1 pendientes (ciertos, no críticos)

- **`fragment_record.status`** se inserta `BUILT` y no se sincroniza con las transiciones
  del fragmento padre. Recomendación: tomar el estado del fragmento (no duplicar) o
  sincronizar en cada transición.
- **Archive por `:20:`**: `findLatestBySendersReference` usa solo `senders_reference`. Con
  los correctivos ya únicos (prefijo `R`), el riesgo baja; aún así conviene scope por
  `process_execution_id`/`fragment_set_id` para `:20:` históricos.
- **Huérfanos tras fallo parcial**: el build correctivo no es una transacción única con
  supersede + resolve. Si falla tras crear fragmentos, el run queda `FAILED` con
  fragmentos `BUILT` huérfanos. Falta cleanup/retry seguro por `rebuild_run_id`.

---

## Fixes aplicados (verificados)

| Fix | Archivo | Test |
|---|---|---|
| Claim atómico APPROVED→BUILDING | `Mt101RebuildRepository.claimForExecution` + `Mt101RebuildService` | `Mt101RebuildServiceTest` (6) verde |
| Timeline lookup indexado por fila | `Mt101RowTimelineService` (usa `findBySourceRow`) | `Mt101RowTimelineServiceTest` (3) verde |
| Guard `:20:` ≤ 16 chars | `Mt101RebuildService` | cubierto por rebuild tests |

`mvn test` 17/17 verdes (rebuild 6, reprocess 8, timeline 3). Sin código fallback.

## Mejoras de gobernanza y robustez (2ª tanda)

Tras los 3 P0 técnicos, se implementaron dos pendientes mayores:

| Mejora | Implementación | Test |
|---|---|---|
| **Segregación de funciones (maker-checker)** | `approveRebuildRun` exige `approver != requester`; overload break-glass (`allowSelfApproval`) solo para el atajo de emergencia; el endpoint legacy `/rebuild` queda restringido a `platform-admin` | `Mt101RebuildServiceTest.governedFlowRejectsSelfApprovalAndAllowsDifferentApprover` (7 verdes) |
| **Cleanup de fragmentos huérfanos** | Tras fallo del rebuild, `Mt101RebuildService` borra los fragmentos correctivos creados (`deleteByFragmentSet`, cascade a `fragment_record`) y revierte el supersede parcial (`revertSupersededBy`), con `addSuppressed` para no perder el error original | cubierto por rebuild tests |

Queda como **único pendiente de gobernanza**: que la **UI** use el flujo gobernado de 3
pasos (request → approve por otro usuario → execute) en vez del break-glass. Es trabajo
de frontend (superficie del `rebuild_run`), no de backend.

## Conclusión

v14 es acertado. El **core** (ubicar fila en 1M, traza, corregir con lock, reconstruir
solo lo afectado con `:20:` únicos, sin perder pagos válidos ni retroceder enviados)
está **cerrado y verificado en vivo a 100k** (lote `K100-1`). Con esta revisión se
cierran además: **race de ejecución** (claim atómico), **timeline a escala** (lookup
indexado), **límite de 16 del `:20:`** (guard), **maker-checker real** (SoD + break-glass
role-gated) y **cleanup de huérfanos**. Lo único pendiente es la **UI del flujo
gobernado** y dos P1 menores (sincronía de `fragment_record.status`, scope de archive).
Sin código fallback.
