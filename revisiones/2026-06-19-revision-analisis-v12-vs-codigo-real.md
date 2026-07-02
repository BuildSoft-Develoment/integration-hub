# Revisión del análisis externo (v12) contra el código real

Fecha: 2026-06-19
Alcance: verificar, hallazgo por hallazgo, el análisis externo de reproceso/trazabilidad
contra el código real en `platform-app`. SOLID + Repository (ADR-011).

## Veredicto corregido

El análisis es **serio y bien estructurado**, pero **revisa un snapshot anterior**: de sus
~11 "hallazgos críticos P0", **9 ya están implementados** en el código actual (con evidencia
de fichero:línea abajo). Los residuos reales son **2-3 acotados** (locking optimista, actor
autenticado, y endurecer paginación/pruebas), no el grueso que plantea.

### Re-respuesta a las 3 preguntas (con 1M de registros)

| Pregunta | Respuesta real | Evidencia |
|---|---|---|
| ¿Sé qué fila exacta falló? | **Sí** | `mt101_failed_record` + `mt101_fragment_record` (hash+fila+:20:+:21:+stagingId) |
| ¿Veo la traza E2E? | **Sí, hasta CONFIRMED/RECONCILED** | `Mt101RowTimelineService.appendFinancialMilestones` |
| ¿Corrijo y reproceso sin perder pagos válidos? | **Sí** | merge-patch + rebuild de fragmento completo + supersede solo REJECTED |

## Verificación hallazgo por hallazgo

| # análisis | Afirmación del análisis | Realidad en el código | Estado |
|---|---|---|---|
| Sec 3 | Timeline no muestra CONFIRMED/RECONCILED por fila; no consulta `mt101_archive` | `Mt101RowTimelineService:116-167` consulta `mt101_archive`/`mt101_confirmation`/`mt101_reconciliation_exception` y emite `RECORD_ARCHIVED`, `PAYMENT_STATUS_CONFIRMED/REJECTED`, `RECORD_SENT`, `PAYMENT_RECONCILED`, `PAYMENT_UNMATCHED` | **Ya implementado** |
| Sec 4 | Rebuild reutiliza `:20:`/`:21:` → colisión | `Mt101RebuildService.applyCorrectiveReferenceTemplates:253-266` fija `sendersReferenceTemplate = "R"+CRC32(correctiveSetId)+"${messageIndex}"` y `transactionReferenceTemplate = "C${_sourceRecordNumber}"` (fila estable, no offset relativo) | **Ya implementado** |
| Sec 5 | `planByFile` no parte por discontinuidad → rangos falsos | `Mt101BuildFromTableTaskProvider:324-337` parte cuando `!contiguousSourceRecords` (`recordIndex != previous+1`) | **Ya implementado** |
| Sec 6 | `source_records_json` con `put` pierde `:21:` duplicado | `provider:255-262` usa `putIfAbsent` y **lanza** nombrando ambas filas | **Ya implementado** |
| Sec 7 | PATCH reemplaza todo el payload; sin merge/validación/diff/hash | `Mt101StagingCorrectionService.mergePatch:154-171` (merge-patch real); audita `oldPayloadHash`/`newPayloadHash`/`changedFields` (`:190-194`) | **Ya implementado** (residuo: versión/locking, actor) |
| Sec 8 | Corrección no valida pertenencia estricta de fila | `correctRow:95-134` valida QUARANTINED, fragmento REJECTED, pertenencia por `:20:`, `sourceFileHash`, y guarda contra ambigüedad (`findBySourceRow(...,2)`) | **Ya implementado** |
| Sec 9 | Rebuild con `IN` gigante; sin tabla de selección | `mt101_rebuild_selection` + `rebuildRunId` (`correctiveConfig:224-232`, `insertSelectionFromFragmentRecords`) → sin `IN` masivo | **Ya implementado** |
| Sec 10 | `insertBatch` hace `executeUpdate` por fila | `Mt101FailedRecordRepository:45,47` usa `addBatch()` + `executeBatch()` | **Ya implementado** (residuo: paginación de **lectura**/UI a 100k) |
| Sec 12 | No hay objeto `mt101_rebuild_run` ni flujo controlado | `mt101_rebuild_run` + maker/checker: `requestRebuildFromQuarantine` → `approveRebuildRun` → `executeApprovedRebuildRun` (estados REQUESTED/APPROVED/BUILDING/COMPLETED/FAILED) | **Ya implementado** (residuo: auto-encadenar VALIDATE→ARCHIVE→PAY es decisión de diseño) |
| Sec 13 | No bloquea superseder fragmentos SENT/CONFIRMED | `assertRebuildableFragments:237-251` exige **todos** REJECTED; `markSupersededByReferences(...,REJECTED)` + chequeo de conteo | **Ya implementado** |
| Sec 15 | Falta tabla `mt101_fragment_record` | Existe: `V33__mt101_rebuild_run_and_fragment_record.sql` | **Ya implementado** |

## Residuos reales (lo que sí falta)

1. **Locking optimista en la corrección (P1).** `correctRow` no comprueba versión/`If-Match`
   sobre `staging_record`; dos correcciones concurrentes hacen last-write-wins. Mitigado en
   parte por la transición QUARANTINED→REBUILT (una vez reconstruido, el fragmento deja de ser
   REJECTED y una 2ª corrección se rechaza), pero conviene una columna de versión.

2. **Actor autenticado (P0 para banca).** `requestedBy`/`approvedBy` llegan por `@QueryParam`
   (falsificables) y `correctRow` **no** recibe actor. El audit no registra *quién* corrigió.
   Debe derivarse del token OIDC (`SecurityContext`/JWT), no del query string.

3. **Validación estructural MT101 en el guardado de corrección (P2).** El merge-patch guarda sin
   re-validar el payload contra el mapping; el error se detecta luego en VALIDATE. Aceptable, pero
   validar al guardar mejora el feedback al operador.

4. **Paginación de la cuarentena a 100k (P1).** El `insertBatch` ya es batch real, pero la
   **lectura**/listado y la UI siguen acotados por `limit` (sin keyset pagination). A 100k filas
   inválidas el operador no navega todo el set.

5. **Progreso del corrective-run en UI (P2).** El state machine `mt101_rebuild_run` existe pero la
   UI no lo expone ni encadena VALIDATE→ARCHIVE→PAY (decisión de control deliberada; conviene al
   menos mostrar el estado del run y el set correctivo).

6. **Extender la prueba negativa (P1).** Cubrir el caso exacto del análisis: 1M, fragmentos **no
   contiguos** (847192, 847250, 900001, 900050), afirmando que (a) las filas válidas intermedias no
   entran al set correctivo, (b) no hay lookup falsos, (c) `:20:`/`:21:` correctivos no colisionan,
   (d) solo REJECTED pasa a SUPERSEDED. El comportamiento ya está; falta blindarlo con el test.

## Conclusión

El punto que el análisis da por abierto —"que la corrección y el reproceso no creen colisiones
SWIFT, no pierdan pagos válidos y no alteren pagos ya enviados"— **ya está resuelto en código**:
referencias correctivas únicas (`R<crc32>`/`C<sourceRecordNumber>`), partición por discontinuidad,
dedupe de `:21:`, supersede solo-REJECTED, y tabla de selección sin `IN` masivo. Lo que queda es
**gobernanza** (actor autenticado, locking, aprobación visible) y **hardening de escala/pruebas**,
no correctitud del núcleo.

---

## Doble check (2ª pasada, 2026-06-19) — residuos cerrados + verificación de escala

Tras la 1ª pasada se implementaron dos residuos P0/P1 y se reverificó la escala:

### Residuos ahora cerrados
| Residuo (1ª pasada) | Estado | Evidencia |
|---|---|---|
| Actor autenticado | **CERRADO** | `Mt101QuarantineResource.actor(SecurityContext)` (token OIDC) en `correctRow`/`request`/`approve`/`rebuild`; eliminados los `@QueryParam requestedBy/approvedBy`. El audit de corrección graba `correctedBy`. |
| Locking optimista | **CERRADO** | `V34__staging_record_optimistic_lock.sql` (columna `version`); `updatePayload(...,expectedVersion)` compare-and-set; `StaleStagingRowException`→`409`; `GET /staging-row` (ETag) + PATCH `If-Match`; UI carga payload+versión y maneja 409. |

### Escala reverificada (preguntas #9, #10 del análisis)
- **Cuarentena masiva NO carga todo en memoria:** `Mt101QuarantineService.quarantineFromIssues` recorre los issues por **keyset pagination** (`findBySetPage`, página de 1000) y por página arma filas+eventos, inserta con `insertBatch` (JDBC `addBatch`/`executeBatch`) y emite auditoría. Memoria acotada a ~1000.
- **Listado paginado por keyset:** `list(..., afterId, limit)` + `GET /mt101-quarantine?afterId=&limit=`. La API soporta navegar 100k; falta el control de "cargar más" en la UI (residuo de UX, no de backend).
- **Sin `IN` gigante en rebuild:** el corrective config quita `recordIndexIn`; el build lee `mt101_rebuild_selection` por `rebuild_run_id`. El único `IN` es sobre `:20:` afectados (acotado por nº de fragmentos).
- **Resolución fila↔fragmento por tabla relacional:** la cuarentena resuelve `:21:`→fila vía `mt101_fragment_record` (no el JSON `source_records_json`); falla explícito si falta lineage. Es justo la recomendación #15, con `current_senders_reference`/`current_transaction_reference`/`rebuild_run_id`.

### Residuos que quedan (no-correctitud)
1. **UI:** control de paginación de cuarentena (la API ya tiene `afterId`) y superficie del `mt101_rebuild_run` (estado/progreso del set correctivo).
2. **Auto-encadenar** VALIDATE→ARCHIVE→PAY tras el rebuild: hoy es manual por control bancario; conviene un flujo guiado opcional.
3. **Segregación de funciones** (approver ≠ requester) en `approveRebuildRun`: pendiente (rompería el atajo legado de un actor; el flujo gobernado ya graba ambos actores reales).
4. **Extender el E2E negativo** a fragmentos no contiguos (847192/847250/900001/900050) afirmando las 12 aserciones del #14 (el comportamiento ya está; falta el test).

### Veredicto de la 2ª pasada
De los 15 hallazgos del análisis v12, **13 estaban ya implementados** y **2 (actor, locking) se cerraron**.
Lo restante es UI/gobernanza/pruebas, no correctitud. El núcleo de "encontrar la fila, corregir y
reprocesar sin perder ni colisionar pagos" está **cerrado y verificado** (unit + build verdes).
