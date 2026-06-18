# Revisión 2: reproceso correctivo, hallazgos del análisis externo vs código real

Fecha: 2026-06-18
Alcance: contrastar el segundo análisis externo (sobre `app_htoh(11)`) contra el
código real, corregir lo que no aplica y **cerrar los bloqueantes**. SOLID +
patrón Repository (ADR-011): todo el SQL en `*Repository`, servicios orquestan.

---

## 0. Veredicto: el análisis externo es **mayormente correcto** y encontró bugs reales

A diferencia de matices menores, este análisis **acertó en los 2 bloqueantes P0**:
eran bugs reales que yo había introducido en el rebuild. También acertó en 2
correcciones P1 (staging_id por fórmula, cache por nombre) y una mejora (timestamps).
Todo eso lo **corregí**. Lo que queda son decisiones de diseño (multiarchivo,
edición de datos) que documento como recomendaciones.

| # | Hallazgo del análisis | Verificado contra código | Estado |
|---|---|---|---|
| P0-1 | Rebuild reconstruye solo filas fallidas → pierde transacciones válidas hermanas del fragmento | **CONFIRMADO** (bug real) | **CORREGIDO** |
| P0-2 | `MAX_QUARANTINE=5000` pero marca **todas** las QUARANTINED como REBUILT | **CONFIRMADO** (bug real) | **CORREGIDO** |
| P1-6 | `stagingId = stagingIdFrom + offset` asume ids contiguos | **CONFIRMADO** | **CORREGIDO** |
| P1-7 | cache de `sourceFileHash` por `name()` → colisión si dos archivos mismo nombre | **CONFIRMADO** | **CORREGIDO** |
| P1-tl | `row-timeline` sin timestamps | **CONFIRMADO** | **CORREGIDO** |
| P1-8 | multiarchivo no cerrado (recordNumber global, hash único por fragmento) | **CONFIRMADO** parcial | Recomendación (P2) |
| P1-9 | cold store no tiene `RECORD_BUILT` por fila no-primera del fragmento | **CONFIRMADO** | Mitigado por row-timeline operacional |
| P1-10 | falta endpoint para corregir el payload en staging | **CONFIRMADO** | Recomendación (P2) |

---

## 1. P0-1 (CORREGIDO) — el rebuild ahora reconstruye el fragmento completo

**Bug confirmado.** `Mt101RebuildService` tomaba solo los `source_record_number`
fallidos y reconstruía esas filas, marcando el fragmento original `SUPERSEDED`:

```java
// ANTES (perdía las transacciones válidas hermanas):
var recordNumbers = failed.stream().map(...sourceRecordNumber)...distinct().toList();
// source.recordIndexIn = [recordNumber-1 ...]  ← solo las fallidas
```

Un MT101 es atómico (no se envía media). Si el fragmento P170 cubría filas
8451-8500 y solo falló la 8472, el set correctivo contenía **solo** la 8472 y el
original quedaba superseded → las otras 49 transacciones **no se enviaban nunca**.

**Fix:** reconstruir **todas** las filas de los fragmentos afectados (resueltos por
`:20:`):

```java
// AHORA: union de source_record_from..to de cada fragmento afectado
var recordIndexIn = affectedRecordIndexes(dataSource, set, references); // todas las filas
```

Repositorio nuevo: `Mt101FragmentRepository.sourceRecordRangesByReferences(set, refs)`
→ rangos `source_record_from/to` por `:20:`. El servicio expande a `record_index`.
Cubierto por `Mt101RebuildServiceTest.rebuildsAllRowsOfAffectedFragmentNotJustFailed`
(fragmento de 50 filas, 1 falla → `rebuiltRows = 50`).

## 2. P0-2 (CORREGIDO) — guard contra rebuild parcial silencioso

**Bug confirmado.** `findBySet(..., QUARANTINED, MAX_QUARANTINE=5000)` topaba en
5000, pero `updateStatusBySet(set, QUARANTINED→REBUILT)` marcaba **todas**. Con
12.000 en cuarentena: reconstruía 5.000, marcaba 12.000 REBUILT → ocultaba 7.000.

**Fix:** fail-fast antes de reconstruir (`Mt101FailedRecordRepository.countByStatus`):

```java
if (quarantinedCount > MAX_QUARANTINE)
    throw "... reprocess in pages or raise the limit ...";
```

Con el guard, todas las QUARANTINED entran en el lote reconstruido, así que
marcarlas REBUILT ya no oculta nada.

## 3. P1-6 (CORREGIDO) — staging_id real por query, no por fórmula

**Confirmado.** `Mt101RowTimelineService` calculaba
`stagingIdFrom + (recordNumber - sourceRecordFrom)`, que asume ids contiguos.
**Fix:** `Mt101StagingRecordRepository.findStagingRow(execId, recordIndex)` resuelve
el `id` real (+ `created_at`); la fórmula queda solo como fallback si staging fue
purgado. Verificado en `Mt101RowTimelineServiceTest`.

## 4. P1-7 (CORREGIDO) — cache de hash por location+size+lastModified

**Confirmado.** `DbWriteTaskProvider` cacheaba por `sourcePayload.name()` →
`/bancoA/pagos.csv` y `/bancoB/pagos.csv` compartían hash. **Fix:** clave
`location + size + lastModified`.

## 5. P1-timestamps (CORREGIDO) — row-timeline con tiempo por hito

`Milestone` ahora lleva `eventTs`: INGESTED ← `staging.created_at`, BUILT ←
`fragment.created_at`, VALIDATION_ISSUE ← `failed_record.created_at`, terminal ←
`fragment.updated_at`. La UI lo muestra en una columna.

---

## 6. Recomendaciones pendientes (decisiones de diseño, P2)

- **Multiarchivo (P1-8):** el diseño cierra perfecto para *1 ejecución = 1 archivo*.
  Para multiarchivo, la opción robusta es que `source_records_json` guarde
  `:21: → { sourceFileHash, recordNumber, stagingId }` y que el build **nunca mezcle
  archivos en un fragmento** (agrupar por `source_file_hash`). Mientras tanto, la
  política operativa recomendada es **una ejecución por archivo**.
- **Corrección de datos (P1-10):** hoy el operador corrige staging por BD antes del
  rebuild. Para banca conviene un `PATCH /mt101-quarantine/{id}/payload` con
  auditoría `STAGING_ROW_CORRECTED` y, si aplica, maker/checker. Es un flujo nuevo
  (no un bug); lo dejo propuesto.

## 7. Prueba crítica de cierre (la que el análisis pide)

El test E2E negativo (`Mt101MillionFileProcessE2EIT.locatesAndReprocessesExactFailedRowInLargeBatch`)
debe extenderse para afirmar el punto P0-1: tras corregir la fila, el rebuild
reconstruye **todas** las filas del fragmento afectado y el set correctivo conserva
las transacciones válidas hermanas. (El unit test ya lo cubre; el E2E lo cerraría
de punta a punta.)

---

## Conclusión

El análisis externo fue **acertado y útil**: identificó 2 bugs P0 reales en el
reproceso correctivo que rompían la garantía de "no perder transacciones". **Ambos
corregidos**, más 3 mejoras P1. El reproceso quirúrgico ahora es seguro:

> Ante un fallo en un lote masivo, el operador ubica la fila exacta, ve la regla,
> y el rebuild correctivo reconstruye **el/los fragmentos afectados completos** —
> sin perder ninguna transacción válida — superseding los originales.

Queda como decisión de diseño la política multiarchivo.

---

## Doble check (2ª pasada) — regresión cazada + P0 #4 cerrado

El doble check encontró que **el propio fix P0-1 había roto una aserción del E2E
negativo**: el test seguía afirmando el comportamiento VIEJO y buggy
(`assertEquals(1, rebuiltRows, "se reconstruye solo la fila corregida")`). Tras el
fix, `rebuiltRows = 50` (fragmento completo). **Corregido**: el E2E ahora afirma que
el rebuild reconstruye todas las filas del fragmento afectado y que el set correctivo
las cubre todas (`sum(source_record_to - source_record_from + 1)`) — cerrando la
**prueba crítica #14**. Verificado verde (rebuiltRows=50).

**P0 #4 (corrección de datos) — antes recomendación, ahora implementado:**
`PATCH /api/query/mt101-quarantine/staging-row` (`Mt101StagingCorrectionService`)
corrige `staging_record.payload_json` por fila, audita `STAGING_ROW_CORRECTED`; la UI
de cuarentena tiene botón "Corregir" con editor inline. Cierra el "no tocar BD a mano".

### Estado final de los P0

| P0 del análisis | Estado |
|---|---|
| #1 rebuild de fragmentos afectados completos | **CERRADO** (unit + E2E) |
| #2 fail-fast (no marcar REBUILT lo no procesado) | **CERRADO** |
| #3 staging_id real por query | **CERRADO** |
| #4 corregir payload en staging vía API/UI | **CERRADO** |

### Multiarchivo (#8) — cerrado el núcleo de correctitud

El riesgo real de multiarchivo era que **un fragmento mezclara filas de dos archivos**
→ el `source_file_hash` único del fragmento quedaría mal para algunas filas, rompiendo
toda la trazabilidad. **Corregido:** `Mt101BuildFromTableTaskProvider.planByFile` parte
cada página en tramos del mismo `source_file_hash` antes de fragmentar → **un fragmento
= un archivo**, su hash es correcto para todas sus transacciones. Cubierto por
`Mt101BuildFromTableTaskProviderTest.neverMixesFilesInOneFragment` (2 archivos con
`maxTransactionsPerMessage=10` → 2 fragmentos, cada uno con su hash).

Con esto la cuarentena/lookup/timeline (que usan el hash del fragmento) son correctos
en multiarchivo. Queda como mejora de UX (no de correctitud) la **numeración de fila
por-archivo** (hoy `recordNumber` es global por ejecución, siempre emparejado con el
hash correcto, así que la fila queda identificada sin ambigüedad por `(hash, recordNumber)`).

**Todos los P0 y el multiarchivo cerrados.** Suite completa verde (430 tests).
