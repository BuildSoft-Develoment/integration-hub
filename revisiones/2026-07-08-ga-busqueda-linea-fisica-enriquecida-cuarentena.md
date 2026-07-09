# G-A — búsqueda por línea física ENRIQUECIDA (lista + cuarentena)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis "búsqueda directa por línea física" (validado + doble-check contra código real).

## Qué cerró el doble-check

El análisis era ~70% ya implementado (v61 A/B: `physical_line`, endpoint `by-physical-line`, readers, índices). El
doble-check encontró **dos gaps reales** que mi primer análisis subestimó:

1. **Reprocesos invisibles.** `findByPhysicalLine` devolvía UN solo match (`order by id desc limit 1`): un reproceso
   del mismo archivo (mismo hash + línea, otra ejecución) quedaba oculto — el operador solo veía el último.
2. **Motivo de cuarentena inalcanzable desde la línea física.** Un registro cuarentenado **no tiene fragmento**, así
   que el lookup por `recordNumber` (2-pasos) devuelve vacío y el operador **no ve por qué falló**. El `rule_code` vive
   solo en `mt101_failed_record`. Justo el caso estrella del análisis ("línea 847193 → error `STRUCT.CHARGES_VALUE`, no
   enviada") **no era alcanzable**.

Corrección de esquema (contra el análisis): `mt101_transaction_lineage` y `mt101_quarantine` **no existen**; la
cuarentena real es **`mt101_failed_record`** (con `source_file_hash`, `source_record_number` 1-based, `rule_code`,
`message`, `:20:`/`:21:`, e índice `(source_file_hash, source_record_number)`).

## Cambio (SOLID, un solo camino, sin legacy)

- **Repo** `findLineageByPhysicalLine(...)` → `List<PhysicalLineLineage>` (reemplaza al single `findByPhysicalLine`):
  todos los registros de la línea (uno por ejecución), cada uno con LEFT JOIN LATERAL a `mt101_failed_record` por
  `(source_file_hash, source_record_number = record_index + 1)` → `rule_code`, `message`, `status`, `:20:`, `:21:`.
  Usa el índice V90 `(source_file_hash, physical_line)` + el índice de cuarentena.
- **Servicio/endpoint** `GET /api/query/mt101-fragments/by-physical-line` ahora devuelve **lista** (200 con `[]` si no
  hay match — antes 204). Auth-gated 5 roles. Se eliminó el método/record single (sin camino paralelo).
- **Frontend**: la vista de lookup resuelve la línea a una **tabla** de matches (registro lógico, ejecución, staging,
  cuarentena `rule_code`+motivo, `:20:`) con acción "Usar" que auto-llena `recordNumber` (y `processExecutionId`) para
  seguir al fragment-lookup. Si hay 1 se auto-llena directo; si hay varios (reproceso), el operador elige. i18n en/es.

Descartado (coherente con "sin camino paralelo"): endpoint de lineage "todo-en-uno" de N joins (el detalle PAY del caso
enviado ya lo da el fragment-lookup por `recordNumber`; solo faltaba el caso cuarentena, ya resuelto aquí); masking de
campos (el response no expone cuentas/payload); tablas nuevas (se usa `mt101_failed_record`).

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PhysicalLineLookupIT` | **(ver corrida)** | E2E REST: línea física → **lista**; enriquecido con cuarentena (`rule_code`/`message`/`:20:`/`:21:` desde `mt101_failed_record`); **reproceso** (mismo hash+línea, 2 ejecuciones) → 2 matches; acotar por `processExecutionId` → 1; línea sin registro → 200 `[]` |
| Frontend `web` (vitest) | **(ver corrida)** | paridad i18n en/es (claves `physicalLine*`, `col.record/quarantine`, `usePhysicalLineMatch`) + build de la vista con la tabla de matches |

## Notas de alcance

- **G-B (Excel `by-sheet-row`)**: no incluido en esta entrega (opcional); las columnas `sheet_name`/`sheet_row` ya se
  llenan (item B) y viajan en el lineage, pero no hay endpoint dedicado de búsqueda por hoja+fila todavía.
- El detalle PAY/STATUS del caso "enviado" sigue en el fragment-lookup existente (2-pasos), sin duplicar.
- **Imprecisión aceptada (doble-check):** `mt101_failed_record` no tiene `process_execution_id`, así que el resumen de
  cuarentena se correlaciona por `(source_file_hash, source_record_number)` y toma la más reciente. En un reproceso
  donde la línea se cuarentenó en una ejecución pero salió limpia en otra, ambos matches mostrarían esa (última)
  cuarentena. **Sin impacto de correctitud/money-safety** (el registro de cada ejecución es exacto; solo el resumen de
  cuarentena adjunto no está acotado por ejecución, porque la tabla no comparte esa clave). Es la mejor correlación
  disponible y es exacta para el caso principal ("¿por qué falló la línea X?").
