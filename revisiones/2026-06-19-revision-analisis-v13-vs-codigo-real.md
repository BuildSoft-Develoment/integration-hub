# Revisión del análisis v13 (app_htoh(13)) contra el código real

Fecha: 2026-06-19
Alcance: verificar estáticamente cada P0/P1 del análisis v13 contra el código real
(servicios, repos, migraciones, consumer). SOLID + ADR-011.

## Veredicto general

El análisis v13 es **el más afinado hasta ahora**: identifica 3 riesgos reales que
**no estaban cubiertos** (P0.4, P0.6 y el camino por-filas de P0.1). Pero también
contiene **imprecisiones**: P0.1 es parcial, y P0.2/P0.3 están **acoplados y son
contradictorios entre sí**. Detalle:

| # | Hallazgo v13 | Veredicto contra código | Severidad real |
|---|---|---|---|
| P0.1 | Reproceso por rango retrocede SENT/CONFIRMED | **PARCIAL** | P0 solo el camino por-filas |
| P0.2 | recordNumber global, no por archivo | **CIERTO (hecho)** | P2 (identidad ya es `hash+fila`) |
| P0.3 | Correction/timeline ambiguos sin hash | **NO hoy** (acoplado a P0.2) | — |
| P0.4 | Rebuild marca toda la cuarentena del set | **CONFIRMADO** | **P0** |
| P0.5 | UI usa endpoint legacy (salta maker-checker) | **CONFIRMADO** | P1 (ya conocido) |
| P0.6 | Consumer se bloquea por evento no persistible | **CONFIRMADO** | **P0** |

---

## P0.1 — PARCIAL: el camino por-estado sí valida; el camino por-filas no

`Mt101ReprocessService` tiene **dos** caminos:

- `resetByStatus(from, to)` → **seguro**: `ALLOWED_TRANSITIONS` solo permite
  `REJECTED→{BUILT,ARCHIVED}`, `VALIDATED→{BUILT}`, `ARCHIVED→{BUILT,VALIDATED}`.
  `SENT`/`CONFIRMED`/`RECONCILED` no son claves → `validateTransition` lanza. El SQL
  además filtra por `where status = fromStatus`. **El análisis se equivoca aquí.**

- `reprocessSourceRows(range, toStatus)` → **gap real**: restringe `toStatus` a
  `{BUILT,VALIDATED,ARCHIVED}`, pero `findBySourceRowRange` trae los fragmentos que
  solapan el rango **sin filtrar su estado actual**, y `fragmentStore.markStatusBatch`
  los fuerza a `toStatus` **sin guard de transición**. Un fragmento `SENT` en ese
  rango puede ser arrastrado a `BUILT`. **Aquí el análisis acierta.**

**Fix:** en `reprocessSourceRows`, filtrar/abortar si algún fragmento del rango está
en `SENT/CONFIRMED/RECONCILED`, o pasar un `fromStatus` permitido a `markStatusBatch`.

## P0.2 / P0.3 — Acoplados y contradictorios

- **P0.2 (cierto como hecho):** `recordNumber` es **global por ejecución** (contador
  en `TaskContext`), no 1-based por archivo. Pero como la identidad operativa es
  `(sourceFileHash, sourceRecordNumber)` y el hash desambigua, **no es un bug de
  correctitud de identidad** — es de *display* (el operador ve "fila 1.000.001" para
  la 1ª fila del archivo B). Severidad real: **P2**, no P0.

- **P0.3 (no es bug hoy):** dice que `(fragmentSetId, recordNumber)` es ambiguo en
  multiarchivo. Pero **solo lo sería si recordNumber fuese por-archivo** (el fix de
  P0.2). Como hoy es **global**, `(fragmentSetId, recordNumber)` es **único** dentro
  de la ejecución → no hay ambigüedad. **P0.2 y P0.3 no pueden ser ciertos a la vez.**

**Conclusión:** decisión de diseño, no bug. Si se adopta numeración por-archivo,
entonces sí hay que exigir `sourceFileHash` en correction/timeline/lookup.

## P0.4 — CONFIRMADO (real)

`Mt101RebuildService` resuelve la cuarentena con:
```java
failedRecordRepository.updateStatusBySet(dataSource, set, "QUARANTINED", "REBUILT");
```
Es **por `fragment_set_id`**, no por `rebuild_run_id`/`mt101_rebuild_selection`. Hoy
el run cubre **todos** los `:20:` distintos de las filas QUARANTINED, así que en la
práctica coincide; pero es **arquitectónicamente inseguro**: una fila QUARANTINED
nueva insertada durante el run, o un run parcial/paginado futuro, quedaría marcada
REBUILT sin haberse reconstruido.

**Fix:** resolver por la selección del run (`update ... from mt101_rebuild_selection
where rebuild_run_id = ?`), no por set.

## P0.5 — CONFIRMADO (ya conocido)

El backend tiene el flujo gobernado (`request`→`approve`→`execute` con actor del
token), pero la UI llama el atajo legado `/rebuild` (los 3 pasos con un actor). Salta
maker-checker. Ya estaba listado como residuo (segregación de funciones futura).
**Fix:** UI usa los 3 endpoints; el legado solo rol de emergencia/admin.

## P0.6 — CONFIRMADO (real)

`AuditEventHandler.handleBatch`:
- JSON **no parseable** → `deadLetterWriter.write(...)` (bien, maneja poison).
- Pero luego `coldStore.writeBatch(recordEvents)` / `writer.insertProcessEvents(...)`
  sobre **todo el lote**. Un evento parseable-pero-no-persistible (constraint, valor
  largo) hace fallar el batch entero → el broker reentrega → **lag permanente**. No
  hay bisect ni DLQ por fallo de persistencia.

**Fix:** ante fallo de `writeBatch`, bisecar (dividir y reintentar), persistir los
válidos y DLQ-ear el evento problemático con su error de BD.

---

## P1 verificados

- **CRC32 en :20: correctivo:** cierto. `R<base36(crc32(setId))>${messageIndex}`.
  CRC32 (32 bits) puede colisionar entre sets distintos. Para banca, usar secuencia
  de BD + prefijo, no solo hash.
- **:21: `C<recordNumber>`:** estable dentro de un archivo; puede repetir entre
  archivos en multiarchivo (acoplado a P0.2). Mejor `C<shortFileCode><row>` o id de
  negocio.
- **`source_task_definition_id`:** `staging_record` lo tiene; conviene propagarlo a
  `mt101_fragment_record`/`mt101_rebuild_selection`/`mt101_failed_record` para
  desambiguar dos DB_WRITE en una misma ejecución (hoy se asume uno).
- **`mt101_fragment_record.status`:** se inserta `BUILT` y puede quedar
  desactualizado vs el fragmento padre. Decidir: sincronizar o tomar el estado del
  fragmento (no duplicar estado obsoleto).

---

## Resumen ejecutable (orden sugerido)

| Prioridad | Fix | Archivo |
|---|---|---|
| **P0** | Resolver cuarentena por `rebuild_run_id`, no por set | `Mt101RebuildService` + `Mt101FailedRecordRepository`/`Mt101RebuildRepository` |
| **P0** | Guard de estado en `reprocessSourceRows` (no tocar SENT/CONFIRMED/RECONCILED) | `Mt101ReprocessService` |
| **P0** | Bisect + DLQ por fallo de persistencia en el consumer | `AuditEventHandler` |
| P1 | UI usa flujo gobernado (maker-checker) | frontend + `Mt101QuarantineResource` |
| P1 | `:20:` correctivo con secuencia de BD (no CRC32) | `Mt101RebuildService` |
| P2 | Numeración 1-based por archivo (+ exigir hash) | `DbWriteTaskProvider` |

## Conclusión

El análisis v13 acierta en **3 riesgos reales no cubiertos** (P0.4, P0.6, P0.1-filas)
y aporta hardening válido (CRC32, task id, status duplicado). Pero **sobrevalora**
P0.2/P0.3 (acoplados, no bug hoy) y **se equivoca** en el camino por-estado de P0.1.
El núcleo "localizar la fila, ver traza, corregir y reconstruir lo afectado" sigue
**cerrado**; lo que estos P0 endurecen es **no retroceder pagos enviados**, **no
mismarcar cuarentena fuera del run**, y **no bloquear el consumer** — los tres
acotados y con fix claro.

---

## Fixes aplicados (2026-06-19) — los 3 P0 reales

| P0 | Fix | Evidencia | Test |
|---|---|---|---|
| **P0.4** | Resolver cuarentena por `rebuild_run_id`, no por set | `Mt101FailedRecordRepository.updateStatusByRun` (join a `mt101_rebuild_selection`); `Mt101RebuildService` lo usa en vez de `updateStatusBySet` | `Mt101RebuildServiceTest` (6) verde |
| **P0.1** | Guard de estado en `reprocessSourceRows`: aborta si algún fragmento del rango está `SENT/CONFIRMED/RECONCILED` | `Mt101ReprocessService` `SENT_OR_LATER` + chequeo previo a `markStatusBatch` | `Mt101ReprocessServiceTest.rejectsReprocessOfAlreadySentSourceRows` (8 verdes) |
| **P0.6** | Bisect + DLQ por fallo de persistencia en el consumer | `AuditEventHandler.persistWithBisect`: ante fallo, bisecta, persiste válidos (idempotente `ON CONFLICT`) y DLQ-ea el problemático | `AuditEventHandlerTest` (2) verde — nuevo |

Verificado: `mvn test` platform-app 20/20 + audit-consumer 2/2, BUILD SUCCESS.

### P1 adicional cerrado — `:20:` correctivo por secuencia de BD (no CRC32)

| P1 | Fix | Evidencia |
|---|---|---|
| `:20:` correctivo CRC32 (colisión 32-bit) | Secuencia de BD `mt101_rebuild_reference_seq`; cada run toma un `reference_code` (base36) único → `:20:` = `R<reference_code>${messageIndex}`. **Sin fallback**: si el run no tiene `reference_code`, el execute aborta. | `V35__mt101_rebuild_reference_sequence.sql`; `Mt101RebuildRepository.createRun` (nextval) + `RebuildRun.referenceCode`; `Mt101RebuildService` elimina CRC32. `Mt101RebuildServiceTest` (6) verde. |

Quedan P1/P2 (UI maker-checker, numeración 1-based por-archivo) como mejoras, no correctitud.
