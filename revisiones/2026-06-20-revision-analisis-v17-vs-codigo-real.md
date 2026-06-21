# Revisión del análisis v17 (app_htoh(17)) contra el código real

Fecha: 2026-06-20
Alcance: verificar cada bloqueante/riesgo del v17 contra el **código actual** (post-B1–B5+R6, V39).
Directiva: sin código fallback / sin caminos legacy.

## Veredicto general

El v17 vuelve a acertar: reconoce correctamente lo que cerró el v16 (set correctivo
server-side, snapshot de aprobación, lock de fila, transición condicional + auditoría
atómica, scheduler de lifecycle) y **encuentra los huecos que quedan**, todos reales. El
más importante es que el rebuild correctivo **se queda en `BUILT` y nadie lo lleva a
SENT** automáticamente: el ciclo bancario no está cerrado E2E. Y captura un detalle fino:
el estado `REBUILD_REJECTED` que añadí en B5 **no tiene ruta de reapertura** — es un
callejón sin salida que yo mismo introduje. Buen catch.

| # | Hallazgo v17 | Veredicto | Evidencia |
|---|---|---|---|
| B1' | `REBUILD_REJECTED` deja la fila bloqueada (sin corregir ni re-rebuild) | **VÁLIDO (regresión de B5)** | corrección exige `QUARANTINED` (`Mt101StagingCorrectionService:217`); request exige `QUARANTINED` (`Mt101RebuildService:84,89`). Una fila en `REBUILD_REJECTED` no entra a ninguno |
| B2' | El rebuild termina en `BUILT`; no continúa VALIDATE→ARCHIVE→PAY→STATUS→RECONCILE | **VÁLIDO (hueco mayor)** | `execute` deja `markStatus(...,"BUILT")` (`Mt101RebuildService:247`); el scheduler solo **deriva** estado (`deriveLifecycleStatus` lee, no ejecuta). Nada corre las tareas MT101 sobre el set correctivo |
| B3' | Multiarchivo / dos `DB_WRITE` con mismo hash+fila puede mezclar | **VÁLIDO (= R8, diferido)** | selección por `(process_execution_id, source_file_hash, record_index)` sin `source_task_definition_id`/`source_instance_id` |
| R-a | Creación de run no atómica | **VÁLIDO** | `requestRebuildFromQuarantine` hace `nextReferenceCode`→`fragmentSetExists`→`createRun`→`insertSelection`→`countSelection`→`updateSelectionStats` en **conexiones separadas** (`Mt101RebuildService:101-114`) |
| R-b | `correctiveSetId` puede exceder `varchar(80)` | **VÁLIDO** | `set + "-FIX-" + referenceCode` sin guard de longitud (`Mt101RebuildService:103`); `corrective_set_id`/`fragment_set_id` son `varchar(80)` |
| R-c | Validación del `:20:` correctivo usa nº de fragmentos originales, no peor caso | **VÁLIDO** | `maxSendersReferenceLength = 1 + referenceCode.length() + String.valueOf(references.size()).length()` (`Mt101RebuildService:204`); un correctivo puede fragmentar más que el original |
| R-d | El scheduler solo sincroniza el datasource por defecto | **VÁLIDO** | `synchronizeActiveLifecycles` usa `defaultDataSource`; `mt101_rebuild_run` no guarda `connectionRef` |
| R-e | El E2E no ejercita el ciclo correctivo real (VALIDATE→PAY→RECONCILE) | **VÁLIDO** | el negativo llega a `SUPERSEDED`+correctivo completo; el lifecycle test mueve estados a mano (acoplado a B2') |

> No-hallazgo correcto del v17: `encode(sha256(payload_json::bytea), 'hex')` es válido en
> PostgreSQL 16 (sha256 es core desde PG11). Coincido: no es problema.

---

## Detalle y corrección sin fallback

### B1' — `REBUILD_REJECTED` es un callejón sin salida (regresión de B5)
**Hoy:** B5 marca la fila `REBUILD_REJECTED` cuando el correctivo trae fragmentos REJECTED,
pero ni `correctRow` ni `requestRebuildFromQuarantine` aceptan ese estado (ambos exigen
`QUARANTINED`). La fila queda sin ruta: no se corrige otra vez ni se abre un nuevo rebuild.

**Corrección (sin fallback):** acción gobernada **`reopenRejectedRebuild`**:
`REBUILD_REJECTED → QUARANTINED`, conservando `rebuild_run_id` previo, `:20:/:21:`
correctivos y la nueva regla de rechazo, con auditoría (quién/por qué reabrió) en
`mt101_reprocess_audit`. Así la fila vuelve al ciclo corregir→rebuild. Sin esto, B5 sólo
cambió un estado ambiguo por uno terminal-muerto.

### B2' — el correctivo se queda en `BUILT` (ciclo bancario no cerrado)
**Hoy:** `executeApprovedRebuildRun` construye el set correctivo y marca el run `BUILT`;
la cuarentena pasa a `REBUILD_PENDING_VALIDATION`. **Nada** ejecuta `MT101_VALIDATE/
ARCHIVE/PAY/STATUS/RECONCILE` sobre el set correctivo: el scheduler R6 sólo **deriva** el
lifecycle leyendo `mt101_build_fragment` del correctivo, que nunca avanza solo. El
correctivo, en la práctica, **no se envía** sin una operación externa.

**Corrección (sin fallback):** una **ejecución hija de recuperación** ligada al
`rebuildRunId` que orqueste el correctivo por el pipeline real
(`BUILT → VALIDATING → VALIDATED → ARCHIVED → SENT → CONFIRMED → RECONCILED`), reusando los
providers MT101 sobre `correctiveSetId`. No debe depender de que un operador arme otro
pipeline a mano. Es el **pendiente principal**: convierte el rebuild en un proceso
bancario completo, gobernado y reanudable.

### B3' — identidad multiarchivo (= R8 del v16, diferido)
Igual que en v16: la identidad `(sourceFileHash, sourceRecordNumber)` no distingue dos
`DB_WRITE` con el mismo hash en una ejecución, ni dos archivos byte-idénticos de orígenes
distintos. Falta `source_task_definition_id` + `source_instance_id`/`source_location` en la
identidad. Sigue diferido por invasividad en el hot path; documentado.

### R-a — creación de run no atómica
**Hoy:** los 6 pasos de `requestRebuildFromQuarantine` corren en conexiones independientes.
Un fallo intermedio deja un run `REQUESTED` con selección incompleta (o stats inconsistentes).

**Corrección (sin fallback):** envolver `createRun`+`insertSelection`+`countSelection`+
`updateSelectionStats` en **una transacción local** (connection-scoped, como ya se hizo en
B4). Si algo falla, rollback: no debe quedar un rebuild incompleto que parezca válido. Los
huecos en la secuencia de `reference_code` son irrelevantes.

### R-b — longitud de `correctiveSetId`
**Hoy:** `set + "-FIX-" + referenceCode` sin chequear los 80 chars. Con un `fragmentSetId`
largo, el correctivo desborda y el INSERT falla con un error oscuro de BD.

**Corrección (sin fallback):** validar la longitud **antes** de crear el run y, si no cabe,
generar un id acotado determinista (p.ej. `FIX-<referenceCode>-<shortHashOriginal>`)
garantizando ≤ 80; o abortar ruidoso con mensaje accionable. Nunca dejar que lo trunque la BD.

### R-c — peor caso del `:20:` correctivo
**Hoy:** estima el largo con `references.size()` (fragmentos originales afectados). Un
correctivo puede fragmentar **más** (otros tamaños/reglas), así que `messageIndex` podría
superar esa cota y el guard subestima.

**Corrección (sin fallback):** usar el **peor caso real** `selectedRows` (cota: una fila por
fragmento) para el chequeo de 16 chars del `:20:`, o validar **después** del plan de
fragmentación y antes de persistir.

### R-d — scheduler solo en `defaultDataSource`
**Hoy:** `synchronizeActiveLifecycles` recorre `findActiveOriginalSets(defaultDataSource)`.
Un rebuild creado con `connectionRef` queda fuera del barrido automático.

**Corrección (sin fallback):** persistir `connection_ref` en `mt101_rebuild_run` y que el
scheduler recorra cada datasource aplicable. (Hoy en dev hay un solo datasource, pero la
garantía debe ser explícita.)

### R-e — cobertura E2E del ciclo correctivo
**Hoy:** el negativo prueba bien hasta `SUPERSEDED` + correctivo completo; el lifecycle test
mueve estados a mano. Falta el E2E que lleve el correctivo por VALIDATE/ARCHIVE/PAY reales.
Está **acoplado a B2'**: sin orquestación automática del correctivo, no hay qué probar E2E.

---

## Prioridad recomendada (sin fallback, antes de piloto)

1. **B1'** — reapertura gobernada `REBUILD_REJECTED → QUARANTINED` (cierra la regresión de B5). *Pequeño.*
2. **R-a** — `request` + selección + snapshot en una sola transacción. *Pequeño.*
3. **R-b + R-c** — guard de longitud del id correctivo + peor caso del `:20:`. *Pequeño.*
4. **B2'** — orquestar el correctivo por VALIDATE→ARCHIVE→PAY→STATUS→RECONCILE (ejecución hija reanudable). *Grande — el pendiente principal.*
5. **R-d** — scheduler multi-datasource (`connection_ref` en el run). *Medio.*
6. **B3'** — identidad multiarchivo (`source_task_definition_id`/`source_instance_id`). *Grande — sigue diferido.*
7. **R-e** — E2E del ciclo correctivo completo (depende de B2').

---

## Implementación (2026-06-20) — sin fallback / sin caminos legacy

| # | Estado | Qué se implementó |
|---|---|---|
| **B1'** | ✅ Hecho | Acción gobernada `reopenRejectedRebuild` (`REBUILD_REJECTED → QUARANTINED`) con cambio de estado **+** auditoría (`REBUILD_REOPEN`) en una transacción; endpoint `POST /api/query/mt101-fragments/reprocess/reopen-rejected`; botón **Reabrir** en la UI sobre filas `REBUILD_REJECTED`. Cierra la regresión de B5. |
| **R-a** | ✅ Hecho | `requestRebuildFromQuarantine` hace `createRun`+`insertSelection`+`countSelection`+`updateSelectionStats` en **una transacción local** (overloads connection-scoped). Rollback completo si algo falla: no queda un run REQUESTED con selección incompleta. |
| **R-b** | ✅ Hecho | Guard de longitud: si `<original>-FIX-<referenceCode>` excede `varchar(80)`, aborta ruidoso antes de crear el run (no lo trunca la BD). |
| **R-c** | ✅ Hecho | El guard del `:20:` usa el **peor caso** `max(selectedRows, references.size())` (una fila por fragmento), no sólo el nº de fragmentos originales. |
| **R-d** | ✅ Hecho | Migración **V40**: `mt101_rebuild_run.connection_ref`. `createRun` lo persiste y el scheduler (`synchronizeActiveLifecycles`) resuelve el datasource de cada run con su `connectionRef`, no sólo el default. |
| **B2'** | ⏸️ Diferido (diseño) | Orquestar el correctivo por VALIDATE→ARCHIVE→PAY→STATUS→RECONCILE. Es una **feature de fondo**: requiere una ejecución hija gobernada que reúse los providers MT101 con los configs del proceso original. Además **PAY envía dinero**: auto-encadenar PAY sin maker-checker propio del correctivo sería incorrecto para banca. Debe diseñarse como proceso hijo reanudable **con su propia aprobación**, no como un encadenado automático. Es el pendiente principal. |
| **B3'** | ⏸️ Diferido (= R8) | Identidad multiarchivo (`source_task_definition_id` + `source_instance_id`). Invasivo en el hot path de ingesta + todas las consultas; sigue diferido. |

**Verificación:** `compile` + `test-compile` en verde; `Mt101RebuildServiceTest` (7),
`Mt101ReprocessServiceTest` (10, con 2 nuevos de reapertura), `Mt101StagingCorrectionServiceTest`
(6), `Mt101LargeVolumeLineageRebuildTest` (1) y el **E2E negativo** pasan; frontend 212/212 + build OK.

> **Pendiente de fondo (B2'):** hoy el rebuild correctivo se construye pero **no se envía**
> solo. Cerrarlo de verdad (y su prueba E2E real, R-e) es el siguiente trabajo grande, y debe
> hacerse gobernado por el riesgo de PAY.

## Conclusión

El v17 es **acertado y vigente**. El core de trazabilidad (1M → fila exacta → hash → :20:/
:21: → regla → fragmento → correctivo → evidencia de aprobación/ejecución) está maduro. Lo
que falta es **convertir el rebuild correctivo en un proceso bancario completo, gobernado y
reanudable** (B2'), y cerrar los bordes de integridad que quedan: la reapertura de
`REBUILD_REJECTED` (B1', regresión de B5), la atomicidad del request (R-a), los guards del
id/`:20:` correctivo (R-b/R-c), el scheduler multi-datasource (R-d) y, a más largo plazo, la
identidad multiarchivo (B3'). Los 1-3 son rápidos; B2' es el trabajo de fondo.
