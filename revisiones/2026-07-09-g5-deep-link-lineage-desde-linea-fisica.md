# #5 — deep-link al lineage E2E completo desde la búsqueda por línea física

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis app_htoh(62) #5 ("vista completa de lineage por línea física"), re-validado + doble-check.

## Qué reveló el doble-check (corrige app_htoh 62)

El análisis daba #5 por "PARCIAL, falta crear la pantalla única". **Falso:** la pantalla ya existe y es completa.

- **Backend:** `GET /api/query/record-lineage` en modo `sourceRow` (`sourceFileHash + recordNumber`) →
  `AuditRecordEventRepository.timelineBySourceRow` = `find("sourceFileHash=?1 and recordNumber=?2 order by eventTs")`
  **sin filtro de tipo** → el trail E2E **completo** (INGESTED→BUILT→VALIDATED→SENT→STATUS→RECONCILE→correctivo).
- **Frontend:** `RecordLineageComponent` (ruta `/audit/record-lineage`) ya renderiza ese timeline con 4 modos
  (record `:20:`, trace, key, **sourceRow**) e íconos/duraciones/pivoteo. **Ya se enlaza** desde cuarentena
  (`{sourceFileHash, recordNumber}`) y ejecuciones (`traceId`).

**El único gap real:** la búsqueda por línea física (G-A, `mt101-fragment-lookup`) **no** enlazaba a esa vista →
soporte tenía que re-tipear `sourceFileHash + recordNumber` en record-lineage.

## Cambio (mínimo, sin camino paralelo)

- **Frontend**: en la tabla de matches de G-A, un enlace **"Lineage ↗"** por fila →
  `[routerLink]="['/audit/record-lineage']" [queryParams]="{ sourceFileHash: m.sourceFileHash, recordNumber: m.recordIndex + 1 }"`.
  `RecordLineageComponent` auto-busca en modo `sourceRow` con esos params. i18n en/es (`audit.lookup.viewLineage`).
- **Sin backend nuevo, sin vista nueva, sin duplicar** — reusa la vista de lineage existente (espejo del enlace que ya
  usa cuarentena).

Cierra #5: **línea física → registro + cuarentena (G-A) → un clic → lineage E2E completo**.

## Matiz documentado (cold-store)

`record-lineage` lee el **cold store** de auditoría (`AuditRecordEvent`, asíncrono) → **eventualmente consistente**: una
línea recién procesada puede verse vacía hasta que se descarguen los eventos. Es **el mismo comportamiento** del enlace
de cuarentena ya aceptado. La vista **instantánea** (`row-timeline`) necesita `fragmentSetId`, que un registro
**cuarentenado no tiene** → por eso `record-lineage` (solo `sourceFileHash + recordNumber`) es el target correcto para
el enlace desde la línea física, y es el que ya usa cuarentena.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| Frontend `web` (vitest) | **(ver corrida)** | paridad i18n en/es (clave `audit.lookup.viewLineage`) + build de la vista con el enlace |

Cambio de UI puro (deep-link + i18n); la lógica de lineage ya está cubierta por `record-lineage` y sus specs.
