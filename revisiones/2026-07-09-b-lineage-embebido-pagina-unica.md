# B — lineage E2E embebido en la búsqueda por línea física/hoja-fila (página única)

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** opcional app_htoh(64) — "vista única de lineage" (el deep-link E2E ya existía; faltaba verlo sin navegar).

## Qué había

`mt101-fragments` resolvía "archivo + línea física/hoja-fila" → lista de matches con un **deep-link** a
`/audit/record-lineage` (timeline E2E completo). El operador tenía que **navegar** a otra pantalla.

## Cambio (solo frontend, reusa endpoints existentes)

- En `Mt101FragmentLookupComponent`: botón **"Lineage aquí"** por match que **embebe** el timeline E2E en la misma
  pantalla (`showLineage`), llamando a `GET /api/query/record-lineage` (modo `sourceRow`:
  `sourceFileHash + recordNumber + processExecutionId`) — el mismo endpoint que la vista completa.
- Render de un **timeline compacto** (stage · status · timestamp · mensaje) reusando los helpers compartidos
  `timelineStatusKind`/`timelineStatusIcon` (los mismos de `record-lineage`), con panel cerrable.
- Se **conserva** el deep-link "Lineage ↗" a la vista completa de `record-lineage` (con sus 4 modos y pivoteo).
- i18n en/es (`viewLineageInline`, `lineagePanelTitle`, `lineageError`).

Sin backend nuevo: el endpoint `record-lineage` (modo `sourceRow`, con desambiguación por `processExecutionId`) ya
existía. El botón aplica igual a CSV/TXT (línea física) y Excel (hoja+fila), porque ambos reusan la misma tabla de
matches.

## Matiz honesto (documentado)

`record-lineage` lee el **cold store** de auditoría (asíncrono) → **eventualmente consistente**: una fila recién
procesada puede verse vacía hasta que se descarguen los eventos. La página única **no** quita ese caveat (es el mismo
dato que el deep-link ya mostraba); solo elimina la navegación.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| Frontend `web` vitest | **521/521** | incl. paridad i18n en/es de las 3 claves nuevas |
| `nx build web` | **OK, sin warnings** | typecheck del componente + timeline embebido |

**Validación visual pendiente:** el usuario, en `/audit/mt101-fragments`, resuelve una línea física/hoja-fila y hace
clic en "Lineage aquí" → ve el timeline E2E en la misma pantalla (requiere login; no hay navegador conectado para
verificarlo automáticamente).
