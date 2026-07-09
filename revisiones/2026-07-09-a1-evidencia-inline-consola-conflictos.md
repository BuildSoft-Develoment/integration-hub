# A1 — evidencia inline en la consola de PAY Conflicts (+ deep-link A2 a acción gobernada)

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** opcional app_htoh(64) — "resolver inline" en la consola. Se implementó la parte **read-only** (A1) + el
**deep-link (A2)** a las acciones gobernadas existentes; NO se inventó una mutación fragmento-nivel nueva.

## A1 — evidencia inline (gatewayReference / último STATUS + export)

**Backend (solo lectura):**
- Repo `payConflictConfirmations(dataSource, sendersReference, limit)`: une `mt101_confirmation → mt101_archive` por
  `senders_reference` (el `:20:`) → devuelve las confirmaciones del banco (`confirmationType`, `gatewayReference`,
  `confirmedStatus`, `receivedAt`), más recientes primero. Es la **evidencia** de por qué el fragmento quedó en
  conflicto (terminal del ledger vs. respuesta del banco).
- Service `payConflictConfirmations(connectionRef, sendersReference)` (400 si falta `sendersReference`).
- Endpoint `GET /api/query/mt101-fragments/pay-conflicts/confirmations` (mismo gating de 5 roles que la consola).

**Frontend:**
- Botón **"Evidencia"** por fila que expande una sección con las confirmaciones del banco (estado · gatewayReference ·
  tipo · fecha).
- Botón **"Exportar evidencia"**: descarga la lista visible de conflictos como JSON (snapshot para auditoría).
- i18n en/es.

## A2 — deep-link a la acción gobernada (sin mutación nueva)

Por la decisión de diseño validada (no inventar una mutación fragmento-nivel de "cerrar conflicto"), la consola
**deep-linkea** a la resolución gobernada que ya existe: **"Conciliar en el set" → `/audit/mt101-quarantine?fragmentSetId=…`**
(donde vive `resolve-uncertain-normal-pay` v52 + el rebuild-run maker-checker) y el lineage E2E. La resolución de dinero
sigue en su flujo gobernado; la consola solo enruta.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101OpenPayConflictsConsoleIT` (@QuarkusTest+Postgres) | **6/6** | + `listsBankConfirmationsAsEvidenceForAConflict`: seed archive+confirmation → endpoint devuelve gatewayReference/estado; sin `sendersReference` → 400 |
| Frontend `web` vitest | **521/521** | incl. paridad i18n en/es de las 5 claves nuevas |
| `nx build web` | **OK, sin warnings** | — |
| `mvn compile` (JDK 25) | **rc=0** | — |

**Bug encontrado en el camino:** la query inicial referenciaba `mt101_archive.corrective_senders_reference`, que en
realidad vive en `mt101_rebuild_selection` (no en `mt101_archive`) → 500. Corregido a `senders_reference` (el `:20:` es
la identidad y basta para normal y correctivo).
