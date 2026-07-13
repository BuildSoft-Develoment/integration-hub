# #1 evidencia de escala del PAY normal (resolveNormalPay/NEEDS_RECONCILIATION) + #2 acknowledge gobernado

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** opcionales app_htoh(64). Autorizados con single-actor + normal/correctivo.

## #1 — evidencia de escala del path `resolveNormalPay` / `NEEDS_RECONCILIATION`

### Hallazgo honesto
El resolutor (`Mt101PayUncertainResolutionService.resolveUncertainNormalPay`) hace **1 llamada al gateway por
fragmento**. Un **1M literal por HTTP** es impráctico (1M round-trips secuenciales). Lo que importa —y lo que el
análisis pedía— es el **contrato de memoria acotada** (paginado) y que el residual cierre en `NEEDS_RECONCILIATION`.

### Qué se hizo
- Test de escala `resolvesLargeUncertainSetInBoundedMemoryLeavingResidualForReconciliation` (en
  `Mt101PayUncertainResolutionServiceTest`, Testcontainers + WireMock): siembra N fragmentos `UNCERTAIN` (mitad
  `ACCEPTED`, mitad `PENDING` en el gateway), corre el resolutor y asevera: los aceptados → `SENT` **a través de
  múltiples páginas** (PAGE_SIZE=500), los pendientes quedan como **residual** (`stillPending>0`), y `resolvedRejected/
  gatewayErrors/conflicts = 0`. `stillPending>0` es lo que dispara `NEEDS_RECONCILIATION` (G1 `needsReconciliation`).
- **N por defecto 1500** (3 páginas, CI verde); **opt-in** `-Dresolve.rows=N` para stress.

### Evidencia capturada
| Escala | Heap | Resultado |
|---|---|---|
| 1500 (3 páginas) | default | **verde** (~20s, suite 8/8) |
| **20 000 (40 páginas)** | **`-Xmx512m`** | **verde, 31s, sin OOM** → memoria acotada confirmada a escala |

Un 1M sería ~50x más llamadas HTTP (~25 min) sin agregar información al contrato de memoria (40 páginas ya ejercitan el
loop; 512m prueba que no acumula). El path **BUILD/PAY** a 1M ya está cubierto por `Mt101MillionFileProcessE2EIT`.

## #2 — acknowledge gobernado ("resolver conflicto con motivo")

### Semántica segura para el dinero
"Resolver" = **reconocer**: limpiar `pay_conflict` + registrar el motivo, **SIN** tocar el terminal real
(`status`/`pay_status`). Nunca se sobrescribe el estado a mano. Single-actor gobernado por rol (no maker-checker,
porque **no cambia el pago**).

### Qué se hizo
- **Repo** `acknowledgeNormalPayConflict` / `acknowledgeCorrectivePayConflict` (`UPDATE ... RETURNING`, atómico e
  idempotente: solo afecta filas en conflicto). Reciben la `Connection` del caller y devuelven las filas para auditar.
- **Trama append-only** `PAY_CONFLICT_RESOLVED` (espejo de `Mt101PayConflictAudit`): actor + motivo + terminal
  conservado → queda en el timeline/lineage.
- **Servicio** `Mt101PayConflictAcknowledgeService` (mutación + emisión de audit). **Endpoint**
  `POST /pay-conflicts/acknowledge` gobernado (`PLATFORM_ADMIN`/`INTEGRATION_ADMIN`/`PAYMENTS_OPERATOR`; **no** AUDITOR),
  actor del `SecurityContext`, `reason` obligatorio (400 si falta).
- **Atomicidad auditoría↔mutación (opción "atómico"):** el servicio abre la `Connection`, hace el `UPDATE` (limpia el
  flag) **y** escribe la trama al spool vía `AuditSpoolWriter.writeBatch(Connection, …)` en **una sola transacción**, y
  hace `commit`. Si el spool falla → `rollback`: **nunca queda un conflicto "resuelto" sin su trama de auditoría**
  (a diferencia del emisor async del hot-path, que es best-effort y fuera de la tx de negocio, para throughput a 1M+).
- **Frontend** (consola): botón **"Resolver"** por fila → form inline con **motivo** obligatorio + confirmar/cancelar →
  reconoce y recarga (el conflicto sale del inbox). i18n en/es.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PayUncertainResolutionServiceTest` (Testcontainers+WireMock) | **8/8** | + escala 1500 (3 páginas) + evidencia 20k/512m sin OOM |
| `Mt101OpenPayConflictsConsoleIT` (@QuarkusTest+Postgres) | **8/8** | + acknowledge normal (limpia flag, status intacto, sin motivo→400, **trama en el spool en la misma tx**) + correctivo |
| `Mt101PayConflictAcknowledgeAtomicityIT` (@QuarkusTest+Postgres+`@InjectMock`) | **1/1** | **atomicidad**: si el spool falla, `rollback` → el flag sigue en conflicto (status intacto) |
| Frontend `web` vitest | **521/521** | paridad i18n en/es (6 claves de resolución) |
| `nx build web` | **OK, sin warnings** | — |
| `mvn compile` (JDK 25) | **rc=0** | — |
