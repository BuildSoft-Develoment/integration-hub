# Consola de PAY Conflicts — inbox transversal de conflictos de pago abiertos

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** opcional app_htoh. Analizado como gap de descubribilidad (no correctness) y aprobado.

## Qué cerraba el gap

La visibilidad de conflictos de pago (`pay_conflict`) ya existía pero **scoped a un `fragmentSetId` que había que
conocer de antemano** (`GET /pay-conflicts?fragmentSetId=X` + la vista `mt101-quarantine`). Un operador sin el set-id
no tenía landing. El dato ya se captura, es durable y auditable (tramas `PAY_CONFLICT`); faltaba **el punto de entrada
global**.

## Cambio (aditivo, solo lectura, sin lógica de dominio nueva)

**Backend**
- **V94** — índice parcial `ix_build_fragment_pay_conflict_open on mt101_build_fragment (updated_at desc, id desc)
  where pay_conflict = true`. Los conflictos son excepcionales → la query global es O(conflictos), sin scan.
- **Repo** `openPayConflicts(dataSource, limit)` → `OpenPayConflictRow(fragmentSetId, processExecutionId,
  sendersReference, status, reason, updatedAt)`, más recientes primero. (Paginación keyset queda como extensión futura;
  el índice ya la soporta.)
- **Service** `openPayConflicts(connectionRef, limit, cursor)` con cota default 200 / máx 1000.
- **Endpoint** `GET /api/query/mt101-fragments/pay-conflicts/open` (mismo gating de 5 roles que `/pay-conflicts`),
  respuesta `{ items, nextCursor }`.

### Paginación keyset compuesta (lossless)

El inbox une DOS tablas y el `id` es por-tabla (colisiona entre ledgers), así que un cursor `(updated_at, id)` único no
puede reanudar ambas ramas sin saltarse filas en el borde de página. Solución: **cursor compuesto** que lleva la última
posición devuelta de CADA rama (`nTs,nId,cTs,cId`), codificado opaco (base64). Cada rama se reanuda desde su parte
(`(updated_at, id) < (cursorTs, cursorId)`, índices V94/V95), se mezcla + recorta a `limit`, y el `nextCursor` avanza a
la última fila **devuelta** de cada rama (si una rama no aportó, conserva su parte → sus filas fetchadas-pero-recortadas
se re-piden). `null` cuando no quedan más. Frontend: botón "Cargar más" que apila la siguiente página.

**Frontend**
- Componente + ruta `/audit/mt101-pay-conflicts`: tabla (set · ejecución · `:20:` · estado · motivo · actualizado) con
  **deep-link por fila** a la vista por-set (`/audit/mt101-quarantine?fragmentSetId=X`, donde se concilia) y al lineage
  E2E (`record-lineage`, modo `key`=`paymentReference`).
- Item en el workspace nav de auditoría (manifest) + modelo `Mt101OpenPayConflict` + `mt101OpenPayConflicts()` en la
  API. i18n en/es.

**Alcance:** inbox **unificado** de ambos ledgers (ver sección siguiente). **Cero riesgo de correctness:** solo lee dato
ya capturado.

## Extensión — rama correctiva (inbox unificado)

Los conflictos **correctivos** (`mt101_corrective_pay_fragment`, ledger maker-checker) tampoco tenían read-path (solo
tramas `PAY_CONFLICT` del timeline): mismo gap. Se unifican en la misma consola con un discriminador `source`:

- **V95** — índice parcial espejo `ix_corrective_pay_fragment_conflict_open where pay_conflict = true`.
- **Repo** `openCorrectivePayConflicts`: query sobre el ledger correctivo con **join a `mt101_rebuild_run`** para
  exponer `original_fragment_set_id` como `fragmentSetId` → **mismo deep-link a quarantine**. Mapea `pay_status`→status,
  `corrective_senders_reference`→sendersReference, `source='CORRECTIVE'`, `processExecutionId=null` (es maker-checker),
  `rebuildRunId` de contexto.
- **`OpenPayConflictRow`** gana `source` (`NORMAL`/`CORRECTIVE`) y `rebuildRunId`.
- **Service** mezcla ambas ramas por `updatedAt` desc comparando el **instante** parseado (NO el string: ISO-8601 tiene
  fracciones de longitud variable → lexicográfico ≠ cronológico; comparar strings duplicaba/perdía filas al paginar) y
  recorta a `limit`.
- **UI** muestra una columna/badge `source`; el deep-link a quarantine `?fragmentSetId=` **no cambia** (para correctivo
  usa el set original). i18n en/es.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101OpenPayConflictsConsoleIT` (@QuarkusTest+Postgres) | **5/5** | normal cross-set + no-conflicto excluido + `source=NORMAL`; correctivo `source=CORRECTIVE`/set original/`rebuildRunId`/exec null; **paginación keyset compuesta** (5 conflictos mezclados de a 2 → todos 1 vez, sin saltos/dupes); **orden por instante** (precisión fraccional distinta en el mismo segundo → sin duplicado); cursor manipulado → 400 |
| `Mt101FragmentConflictLookupIT` (por-set, sin regresión) | **1/1** | `/pay-conflicts` y `/summary` intactos |
| Frontend `web` (vitest) | **520/520** | paridad i18n en/es de las claves nuevas |
| `nx build web` | **OK** | typecheck de componente/rutas/manifest nuevos |
| `mvn compile` (JDK 25) | **rc=0** | backend (V94/repo/service/endpoint) |
