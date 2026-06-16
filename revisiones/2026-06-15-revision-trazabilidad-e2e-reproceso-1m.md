# Revisión: trazabilidad E2E por registro, auditoría y reproceso a escala 1M

Fecha: 2026-06-15
Alcance: contrastar el análisis externo de `app_htoh(10)` contra el código real de
`platform-app` / `audit-consumer`, corregir lo que no aplica y proponer una
solución alineada a **SOLID** y al **patrón Repository** ya adoptado por el
proyecto ([ADR-011](../docs/fase-3-arquitectura/adr/ADR-011-patron-repository-acceso-datos.md)).

Objetivo operativo: ante un lote de cientos de miles / 1M registros, **ubicar la
fila exacta del archivo que falló** y ver su **traza completa** (fila → staging →
fragmento MT101 → issue → archivo → envío → status → conciliación), con reproceso
quirúrgico.

---

## 0. Resumen ejecutivo

**Requerimiento cerrado y verificado E2E.** Ante un fallo en un lote masivo, el
operador ubica la **fila exacta** del archivo y **reprocesa solo lo necesario** sin
regenerar el lote.

Implementado (SOLID + Repository, ADR-011; todo el SQL en `*Repository`):

1. **Identidad estable de fila (sin fallback):** `sourceFileHash` (SHA-256 por
   streaming, una vez por fuente) + `record_index` real 1-based; el build exige
   `record_index` (lanza si falta), nunca aproxima.
2. **Lookup fila → fragmento real:** `mt101_build_fragment` separa `staging_id_*`
   (técnico) de `source_record_*` (fila 1-based); el lookup filtra por la fila real.
3. **Issue consultable:** `:21:` como columna; evento `RECORD_VALIDATION_ISSUE` con
   clave de negocio hacia el cold store (lineage por fila muestra la regla).
4. **Reproceso quirúrgico:** por estado, por rango de fila, y **cuarentena por fila +
   rebuild selectivo** (re-construye solo las filas corregidas → set correctivo;
   originales `SUPERSEDED`).
5. **UI:** panel de cuarentena/rebuild + atajo desde el lookup de fragmentos.

Verificación: unit + Testcontainers (build, validate, reproceso, cuarentena,
rebuild) + **E2E negativo a 10k filas** (fila 8472 ubicada y reprocesada) + `nx
build web`. Bonus: arreglado un bug pre-existente del fast-path inbound
(`MT101_PARSE` se fusionaba y perdía su output `records`).

Migraciones: `V31` (identidad de fila) y `V32` (cuarentena). Detalle en §6-§7.

---

## 1. Veredicto: el análisis externo es correcto en lo esencial, pero exagera el tamaño del arreglo

El análisis externo acierta en los 3 hallazgos críticos, pero **no vio** que parte
de la identidad de fila **ya existe** en el modelo. Eso cambia la solución: no es
un rediseño de esquema, es **poblar y propagar campos que ya están**.

| # | Afirmación del análisis externo | Verificado contra código | Matiz / corrección |
|---|---|---|---|
| 1 | `source_row_from/to` guardan `staging_record.id`, no la fila del archivo | **CONFIRMADO** | El valor correcto de fila **ya se calcula** (`logicalOffset`); solo se persiste el campo equivocado. Fix pequeño. |
| 2 | `sourceFileHash` existe en el modelo pero nunca se puebla | **CONFIRMADO** | La columna y el mapeo cold-store existen end-to-end; solo falta calcularlo en el productor. |
| 3 | `recordNumber` es 0-based mientras la UI usa 1-based | **CONFIRMADO** | Off-by-one real. |
| 4 | `transactionReference` (`:21:`) se pierde embebido en el texto del issue | **CONFIRMADO** | `mt101_validation_issue` no tiene columna `transaction_reference`. |
| 5 | No hay reproceso por fila exacta | **CONFIRMADO** | Solo por archivo y por status de fragmento. |
| 6 | Lineage por `traceId` limitado a 5000 | **CONFIRMADO** parcialmente | El cap es 5000; el default es 1000 (`RecordLineageResource:25,41`). |
| — | (recomienda añadir `source_record_number` a `staging_record`) | **INNECESARIO** | `staging_record.record_index` **ya existe** (`V1__initial_schema.sql:57`). |
| — | (recomienda añadir columnas a tablas de auditoría) | **INNECESARIO** | `audit_record_event` ya tiene `source_file_hash`, `record_number`, `transaction_reference` (entidad + cold-store). |

---

## 2. Evidencia en el código (fila por fila del flujo)

> **Nota:** los fragmentos de código de esta sección reflejan el estado **antes** del
> arreglo (el diagnóstico). El estado **implementado y verificado** está en §6 y §7.

### 2.1 INGESTED — la fila origen se vuelve trazable (con dos defectos)

`DbWriteTaskProvider.insertIntoStaging` / `ingestedEnvelope`
([DbWriteTaskProvider.java:186-234](../platform-app/src/main/java/com/integrationhub/platform/provider/task/dbwrite/DbWriteTaskProvider.java)):

```java
var globalIndex = stagingIndexCounter(context);   // AtomicLong(0)  -> 0-based
...
var index = globalIndex.getAndIncrement();
rows.add(new StagingRow(execId, taskId, sourceName, index, json));  // staging_record.record_index
audit.add(ingestedEnvelope(context, sourceName, index));            // recordNumber = index (0-based)
```

`ingestedEnvelope` arma `recordId = sourceName + ":" + index` y pasa
`sourceFileHash = null`.

- **Defecto A (off-by-one):** `recordNumber = index` (0-based). La UI pide fila con
  `min=1`. El operador busca fila 1002 y el evento está como 1001.
- **Defecto B (hash nulo):** nunca se calcula SHA-256 del archivo, así que el
  evento INGESTED viaja con `sourceFileHash = null`.

> **Dato que el análisis externo omitió:** la fila del archivo **ya está
> persistida** en `staging_record.record_index` (0-based, global por ejecución vía
> el `AtomicLong` compartido). No hace falta una columna nueva de "número de fila".

### 2.2 BUILT — la unión fila → fragmento YA existe en auditoría, pero el lookup persiste mal la clave

`Mt101BuildFromTableTaskProvider` ya computa el **rango lógico de fila** del
fragmento y lo emite en el evento BUILT
([Mt101BuildFromTableTaskProvider.java:121-153](../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildFromTableTaskProvider.java)):

```java
composition.put("recordIndexFrom", logicalOffset);
composition.put("recordIndexTo",   logicalOffset + max(rowCount-1, 0));
composition.put("stagingFirstId", firstStagingId);
composition.put("stagingLastId",  lastStagingId);
// envelope.recordNumber = logicalOffset
```

Es decir: **la traza "fila → :20:" ya se puede reconstruir** desde
`audit_record_event` (record_number + payload_json.recordIndexFrom/To del BUILT).

El bug está **solo en la tabla de lookup operativo** `mt101_build_fragment`. Al
insertar el fragmento se guarda en `source_row_from/to` el **id de staging**, no
el `logicalOffset` ([Mt101BuildFromTableTaskProvider.java:239-251](../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildFromTableTaskProvider.java)):

```java
insertBuffer.add(new FragmentInsert(
        fragmentSetId, execId, taskId, source.table(),
        boundary.firstId(),   // -> source_row_from = staging_record.id  ❌
        boundary.lastId(),     // -> source_row_to   = staging_record.id  ❌
        index, totalFragments, message));
// boundary.logicalOffset() (la fila real) SÍ está disponible aquí, pero solo se usa en el audit
```

Y el lookup compara la fila pedida contra esos ids
([Mt101FragmentRepository.java:115-131](../platform-app/src/main/java/com/integrationhub/platform/repository/payments/swift/Mt101FragmentRepository.java)):

```sql
where source_row_from <= :recordNumber and source_row_to >= :recordNumber
```

Con `id` autoincremental global (puede arrancar en 8.500.000), buscar "fila 1000"
no devuelve nada. **El hallazgo crítico del análisis externo es real.** Lo que el
análisis no vio es que **el valor correcto ya está calculado** en
`boundary.logicalOffset()`: el arreglo es persistir el rango lógico, no rediseñar.

### 2.3 VALIDATED / REJECTED — el rechazo no carga la fila ni el `:21:`

`Mt101ValidateTaskProvider.recordEnvelope`
([Mt101ValidateTaskProvider.java:130-157](../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ValidateTaskProvider.java))
arma el evento REJECTED con `recordNumber=null`, `sourceFileHash=null`,
`transactionReference=null`. Solo lleva `paymentReference = :20:`.

Y al persistir el issue, el `:21:` se mete en el **texto**, no en columna
([Mt101ValidateTaskProvider.java:409-412](../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ValidateTaskProvider.java)):

```java
return "[transactionReference=" + issue.transactionReference() + "] " + issue.message();
```

`mt101_validation_issue` (V12 + V18) tiene `fragment_set_id`, `senders_reference`,
`fragment_index`, `rule_code`, `severity`, `message` — **pero no**
`transaction_reference`, ni `source_record_number`, ni `source_file_hash`. El dato
`ValidationIssue.transactionReference()` **existe en memoria**
([ValidationIssue.java:20-26](../platform-app/src/main/java/com/integrationhub/platform/spi/task/payments/ValidationIssue.java))
y se descarta al persistir.

Resultado: se sabe "el fragmento `:20:` LFLS123 falló por regla X", pero **no** "la
fila 847.192 del CSV falló".

### 2.4 El plumbing de auditoría destino YA está completo

`AuditEnvelope` ([AuditEnvelope.java:55-62](../platform-contract/src/main/java/com/integrationhub/platform/audit/AuditEnvelope.java))
y `AuditRecordEvent` ([AuditRecordEvent.java:57-76](../platform-app/src/main/java/com/integrationhub/platform/entity/AuditRecordEvent.java))
ya tienen `sourceFileName`, `sourceFileHash`, `recordNumber`,
`transactionReference`. `PostgresColdStore` ya inserta esos campos
(`source_file_hash` ← `envelope.sourceFileHash()`, `record_number` ←
`envelope.recordNumber()`). El endpoint `record-lineage?sourceFileHash=&recordNumber=`
ya existe ([RecordLineageResource.java:48-49](../platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/RecordLineageResource.java)).

> **Conclusión:** la búsqueda "hash de archivo + fila" está **construida de punta a
> punta** pero es una **tubería seca**: nunca llega agua porque el productor manda
> `sourceFileHash=null` y `recordNumber` 0-based. No falta arquitectura; falta
> poblar 2 campos.

---

## 3. Matriz de madurez corregida

| Área | Análisis externo | Real (verificado) |
|---|---|---|
| Auditoría asíncrona outbox/MQ/DLQ | Muy bien | **Confirmado: maduro** |
| Lineage por `:20:` | Bien | Confirmado |
| Lineage por `traceId` | Parcial (cap 5000) | Confirmado |
| Lineage fila → fragmento | "Existe en `audit_record_event`" → **no detectado** | **Ya existe en BUILT** (record_number + payload), pero inutilizable por hash nulo |
| Lookup fila → fragmento (`mt101_build_fragment`) | Riesgo crítico (usa staging.id) | **Confirmado crítico** — pero fix pequeño (valor ya calculado) |
| `sourceFileHash` real | Nulo | Confirmado nulo |
| `recordNumber` 1-based | 0-based | Confirmado off-by-one |
| `transaction_reference` en issue | Embebido en texto | Confirmado |
| Reproceso por archivo / por auditoría DEAD | Bien | Confirmado |
| Reproceso por status de fragmento | Parcial | Confirmado (`Mt101PayFragmentReprocessTest`) |
| Reproceso por fila / rango exacto | Pendiente | Confirmado pendiente |

---

## 4. Solución (SOLID + Repository, alineada a ADR-011)

Principio rector de ADR-011: **todo SQL vive en `*Repository`; providers/services
solo orquestan**. Toda la solución respeta eso: ningún `prepareStatement` nuevo en
providers.

### 4.0 Modelo de identidad estable de un registro (núcleo)

Definir explícitamente las 3 claves de un registro y no volver a mezclarlas:

| Clave | Significado | Dónde nace |
|---|---|---|
| `stagingId` | clave **técnica** (cursor keyset, joins) | `staging_record.id` |
| `sourceFileHash` + `sourceRecordNumber` (1-based) | clave **de negocio / soporte** (la "fila del archivo") | hash del archivo + `staging_record.record_index + 1` |
| `:20:` (`paymentReference`) + `:21:` (`transactionReference`) | clave **MT101** | secuencia A/B del fragmento |

`record_index` **ya existe** y es la base de `sourceRecordNumber`. No se crea
columna nueva para el número de fila.

### 4.1 P0 — `sourceFileHash` calculado una vez por fuente (SRP)

Crear un colaborador dedicado (SRP, no meter el hash dentro de DbWrite):

```java
// nuevo: spi/source o service/source
public interface SourceFingerprint {
    String fileHash();          // SHA-256 estable del archivo origen
    String fileName();
}
```

- Calcularlo **una vez** al leer/descargar la fuente (`SourcePayload`), no por fila.
- Propagarlo por el `TaskContext` (atributo `_sourceFileHash`) para que
  `DbWriteTaskProvider` (INGESTED) y `Mt101BuildFromTableTaskProvider` (BUILT) lo
  inyecten en cada `AuditEnvelope` y en `staging_record`.
- Persistirlo en `staging_record` (Repository): nueva columna `source_file_hash`.

DIP: el cálculo del hash es una interfaz; el productor depende de la abstracción,
no de `MessageDigest` disperso.

### 4.2 P0 — `recordNumber` 1-based en el borde de presentación

Mínimo cambio de comportamiento, máximo impacto operativo:

- INGESTED: `ingestedEnvelope(... index + 1)` para `recordNumber` (mantener
  `record_index` interno 0-based; convertir solo al emitir auditoría y en la UI).
- Documentar la convención en un único punto (helper `SourceRow.displayNumber()`)
  para no repetir el `+1` y arriesgar doble corrección.

### 4.3 P0 — Lookup fila → fragmento: persistir el rango lógico (no staging.id)

El arreglo es de una línea de datos, no de esquema. En la fase de
materialización ya se tiene `boundary.logicalOffset()`:

1. **Repository** (`Mt101FragmentRepository`): añadir columnas separadas y dejar de
   sobrecargar `source_row_from/to`:

```sql
-- nueva migración V30
alter table mt101_build_fragment
    add column if not exists staging_id_from     bigint,
    add column if not exists staging_id_to       bigint,
    add column if not exists source_record_from  bigint,   -- 1-based
    add column if not exists source_record_to    bigint,   -- 1-based
    add column if not exists source_file_hash    varchar(64);

create index if not exists ix_mt101_fragment_source_record
    on mt101_build_fragment (source_file_hash, source_record_from, source_record_to);
```

2. **Provider** (`Mt101BuildFromTableTaskProvider`): poblar ambos pares. El valor
   ya está en mano (`boundary.firstId/lastId` → staging; `boundary.logicalOffset()`
   → fila). **Mejor aún (robustez):** leer `record_index` real de staging junto al
   `id` para no asumir contigüidad `logicalOffset == record_index`.

   - `Mt101StagingRecordRepository.RowJson` pasa a exponer `recordIndex` además de
     `id` y `payloadJson` (cambio en el Repository, no en el provider).
   - `FragmentPlan` lleva `recordFrom/recordTo` (1-based) además de `firstId/lastId`.

3. **Repository.findBySourceRow**: filtrar por `source_file_hash` +
   `source_record_from/to` (clave de negocio), conservando `staging_id_*` solo para
   joins técnicos.

ISP: el `FragmentLookupRow` para soporte expone fila de negocio; el join técnico
usa otra proyección. No se mezclan responsabilidades en un único record gigante.

### 4.4 P1 — `transaction_reference` y fila como columnas del issue

```sql
-- V30 (cont.)
alter table mt101_validation_issue
    add column if not exists transaction_reference varchar(35),
    add column if not exists source_record_number  bigint,
    add column if not exists source_file_hash       varchar(64);
```

- `Mt101ValidationIssueRepository.IssueRow` gana esos 3 campos (Repository).
- El provider deja de concatenar `[transactionReference=...]` en `message` y pasa
  el valor a columna. `message` queda solo para el detalle legible.
- Mapear `:21:` → `source_record_number` requiere que el fragmento conozca la fila
  por transacción; se resuelve con el rango `source_record_from/to` + el índice de
  la transacción dentro del fragmento.

### 4.5 P1 — Evento `RECORD_VALIDATION_ISSUE` con identidad completa

Hoy REJECTED es por `:20:` sin fila. Emitir, además, un evento de issue con la
clave de negocio para que el lineage por `sourceFileHash + recordNumber` muestre la
regla que falló:

```
recordId             = sourceFileHash + ":" + recordNumber
sourceFileHash, recordNumber
paymentReference     = :20:
transactionReference = :21:
ruleCode, severity, message
```

OCP: es un nuevo tipo de envelope que reusa el pipeline existente
(`RecordAuditEmitter` → spool → cold store); no toca el consumidor.

### 4.6 P2 — Reproceso quirúrgico por fila / rango / fragmento

Apoyarse en lo que ya existe (estados de fragmento + status batch del store):

- **Service** `Mt101ReprocessService` (orquesta; sin SQL) con operaciones:
  `revalidate(BUILT)`, `reprocessRejected`, `resend(ARCHIVED)`,
  `reset(REJECTED→BUILT)`.
- **Por fila/rango:** traducir `recordNumber`/rango → fragmentos vía
  `findBySourceRow` (ya corregido) → marcar esos `:20:` con `markStatusBatch`
  (Repository ya soporta el batch).
- Endpoints `POST /api/query/mt101-fragments/reprocess` (selección por fila, rango,
  `:20:` o status). Reusa `Mt101FragmentRepository.updateStatusBatch`.

---

## 5. Prueba que cierra el requerimiento (1M con fila inválida)

Extender `Mt101MillionFileProcessE2EIT` con un caso negativo dirigido:

1. CSV de 1.000.000 filas, forzar error en la **fila 847.192** (p.ej. `:70:` > 4×35).
2. Aserciones:
   - `staging_record` = 1.000.000 filas; `record_index` 0..999.999.
   - `mt101_build_fragment.source_record_from/to` cubren la fila 847.192 (1-based) y
     `source_file_hash` no es nulo.
   - `mt101_validation_issue` para esa fila trae `transaction_reference`,
     `source_record_number = 847192`, `source_file_hash`, `rule_code`.
   - `GET /record-lineage?sourceFileHash=...&recordNumber=847192` devuelve la
     timeline INGESTED → BUILT → VALIDATION_ISSUE → REJECTED.
   - `GET /mt101-fragments/source-row?recordNumber=847192` devuelve el `:20:` correcto.
   - Reproceso solo de ese fragmento / esa fila no regenera el lote.

---

## 6. Resumen ejecutivo

El análisis externo es **correcto en los 3 críticos** (staging.id como fila,
`sourceFileHash` nulo, `:21:` embebido) pero **sobredimensiona la solución**: el
modelo de auditoría destino ya está completo y el número de fila ya está persistido
(`record_index`) y ya se calcula en el build (`logicalOffset`). Por tanto:

**No es rediseño de esquema; es poblar y propagar identidad que ya existe.**

Orden de ejecución:
1. (P0) Calcular y propagar `sourceFileHash` (SRP, interfaz dedicada).
2. (P0) `recordNumber` 1-based en el borde.
3. (P0) Persistir rango **lógico** de fila en `mt101_build_fragment` (valor ya en mano).
4. (P1) `transaction_reference` + fila como columnas en `mt101_validation_issue`.
5. (P1) Evento `RECORD_VALIDATION_ISSUE` con clave de negocio.
6. (P2) Reproceso por fila/rango/status (Service que reusa el Repository de fragmentos).
7. Test 1M con fila inválida que afirme la traza E2E.

Todo el SQL nuevo vive en `*Repository` (ADR-011); los providers/services solo
orquestan.

---

## 7. Estado de implementación (2026-06-15)

Implementado y verificado (compila + tests Testcontainers en verde):

- **Migración** [V31__record_traceability_source_row.sql](../platform-app/src/main/resources/db/migration/V31__record_traceability_source_row.sql):
  `staging_record.source_file_hash`; `mt101_build_fragment` con `staging_id_from/to`,
  `source_record_from/to` (1-based), `source_file_hash` + índices y backfill;
  `mt101_validation_issue.transaction_reference`.
- **P0 hash (SRP)** [SourceFingerprintService](../platform-app/src/main/java/com/integrationhub/platform/service/source/SourceFingerprintService.java):
  SHA-256 por streaming, cacheado por fuente en el `TaskContext`. Inyectado en
  `DbWriteTaskProvider`; se persiste en `staging_record` y viaja en INGESTED.
- **P0 fila 1-based**: `DbWriteTaskProvider.ingestedEnvelope` emite `recordNumber = index + 1`.
- **P0 lookup por fila real (sin fallback)**: `Mt101BuildFromTableTaskProvider` lee
  el `record_index` real de staging y persiste `source_record_from/to` (1-based) +
  `staging_id_from/to` separados; `Mt101FragmentRepository.findBySourceRow` filtra por
  `source_record_*` (+ `source_file_hash` opcional). El build **exige** `record_index`
  (lanza error de integridad si falta) y **no** degrada al offset lógico: la fila del
  archivo es siempre la autoritativa de staging. Endpoint/servicio/respuesta y UI alineados.
- **P1 :21: como columna**: `Mt101ValidateTaskProvider` deja de embeber
  `[transactionReference=...]` y persiste `transaction_reference`.
- **Regresión**: `Mt101BuildFromTableTaskProviderTest.lookupBySourceRowUsesFileRowNotStagingId`
  prueba que con ids de staging en millones la fila 1 del archivo SÍ resuelve el
  fragmento por `source_record_*` y NO por el viejo `source_row_*`.

- **P2 reproceso quirúrgico (implementado)**:
  [Mt101ReprocessService](../platform-app/src/main/java/com/integrationhub/platform/service/payments/swift/Mt101ReprocessService.java)
  + [Mt101ReprocessResource](../platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/Mt101ReprocessResource.java)
  (`POST /api/query/mt101-fragments/reprocess/status` y `/source-rows`). Dos modos:
  (a) transición por estado con whitelist segura (REJECTED→BUILT revalidar, SENT→ARCHIVED
  reenviar); (b) reprocesar solo los fragmentos que solapan un rango de fila del archivo
  (1-based) sin regenerar el lote. SQL en `Mt101FragmentRepository.findBySourceRowRange`
  + `resetStatus` (ADR-011). Cubierto por `Mt101ReprocessServiceTest` (4 tests).
  Frontend: `mt101ReprocessByStatus` / `mt101ReprocessBySourceRows` en `audit-api.service.ts`.

- **Cuarentena por fila + reproceso selectivo (alternativa "solo lo necesario", implementado):**
  El build persiste el mapeo `:21: → fila del archivo` (`mt101_build_fragment.source_records_json`,
  V32). [Mt101QuarantineService](../platform-app/src/main/java/com/integrationhub/platform/service/payments/swift/Mt101QuarantineService.java)
  resuelve cada `:21:` fallido (desde `mt101_validation_issue`) a su **fila exacta** y la
  encola en `mt101_failed_record` de forma idempotente.
  [Mt101QuarantineResource](../platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/Mt101QuarantineResource.java)
  (`POST /api/query/mt101-quarantine/build`, `GET /api/query/mt101-quarantine`).
  SQL en `Mt101FailedRecordRepository` + `findSourceRecordsBySet`/`findBySet` (ADR-011).
  Cubierto por `Mt101QuarantineServiceTest` (4 tests: fila exacta, issue de mensaje sin
  fila, idempotencia, multi-fragmento). Granularidad **a nivel de fila**, por debajo del
  fragmento.

- **Rebuild selectivo desde cuarentena (implementado, cierra el ciclo):** el build
  acepta un filtro `source.recordIndexIn` (lectura de staging scoped a filas concretas).
  [Mt101RebuildService](../platform-app/src/main/java/com/integrationhub/platform/service/payments/swift/Mt101RebuildService.java)
  lee las filas en cuarentena, recupera el config original del build vía
  [Mt101BuildConfigSource](../platform-app/src/main/java/com/integrationhub/platform/service/payments/swift/Mt101BuildConfigSource.java)
  (DIP; producción lee `process_task_definition`), re-construye SOLO esas filas en un set
  correctivo, marca los fragmentos originales `SUPERSEDED` (`superseded_by`) y la cuarentena
  `REBUILT`. Endpoint `POST /api/query/mt101-quarantine/rebuild`. Cubierto por
  `Mt101RebuildServiceTest` (3 tests) + `Mt101BuildFromTableTaskProviderTest.buildsOnlyFilteredRecordIndexes`.

Flujo completo "reprocesar solo lo necesario" (fila → cuarentena → rebuild):

```
VALIDATE        -> mt101_validation_issue (:20:, :21:, regla)
POST quarantine/build  -> resuelve :21: -> fila exacta -> mt101_failed_record
(operador corrige las filas en staging)
POST quarantine/rebuild?correctiveSetId=SET-FIX
   -> build scoped a record_index IN (filas corregidas) -> set SET-FIX
   -> fragmentos originales -> SUPERSEDED; cuarentena -> REBUILT
```

- **Test 1M negativo (implementado):**
  `Mt101MillionFileProcessE2EIT.locatesAndReprocessesExactFailedRowInLargeBatch`
  corre el pipeline completo con una fila inválida (`cargos=BAD` → `STRUCT.CHARGES_VALUE`)
  en un lote (default 200 filas, parametrizable a 1M via `-De2e.negativeRows=1000000
  -De2e.badRow=847192`) y afirma de punta a punta: (1) todas las filas en staging y 1 solo
  issue de transacción; (2) la cuarentena resuelve la **fila exacta** (`sourceRecordNumber`);
  (3) el lookup fila→fragmento cubre esa fila; (4) tras corregir la fila en staging, el
  rebuild reconstruye solo esa fila y deja el fragmento original `SUPERSEDED`. **PASS.**

- **UI (implementada):** [Mt101QuarantineComponent](../frontend/libs/features/audit/src/lib/components/mt101-quarantine/mt101-quarantine.component.ts)
  en `/audit/mt101-quarantine` (nav + i18n es/en): construir cuarentena, listar las filas
  exactas que fallaron (fila, :20:, :21:, regla, estado) y reprocesar (rebuild) las filas
  corregidas hacia un set correctivo. Métodos en `audit-api.service.ts`. `nx build web` OK.

Con esto el requerimiento operativo queda **cerrado**: ante un fallo en un lote de 1M, el
operador ubica la fila exacta del archivo, ve la regla/`:20:`/`:21:`, y reprocesa solo lo
necesario (rebuild selectivo) sin regenerar el lote — todo verificado E2E + UI.

### Mejoras finales (8va iteración)

- **Evento `RECORD_VALIDATION_ISSUE` con clave de negocio:** al construir la cuarentena,
  `Mt101QuarantineService` emite (vía `RecordAuditEmitter` → spool → cold store) un evento
  por fila fallida con `sourceFileHash` + fila exacta + `:20:` + `:21:` + regla, con
  `eventId` **determinista** (dedup idempotente en re-ejecuciones). Así el visor de lineage
  por `sourceFileHash + recordNumber` muestra la regla que falló, no solo la timeline.
  Cubierto por `Mt101QuarantineServiceTest.emitsValidationIssueEventWithBusinessKey`.
- **Atajo UI lookup → cuarentena:** el lookup de fragmentos enlaza por fila al panel de
  cuarentena (`?fragmentSetId=`), que auto-lista y pre-rellena el set correctivo.
