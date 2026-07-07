# Implementación — cierre del ciclo de vida de `NEEDS_RECONCILIATION` (v54-fix, follow-up de v53)

Fecha: 2026-07-05
Alcance: implementa el diseño del [análisis](2026-07-05-analisis-cierre-needs-reconciliation.md) con el **guard
corregido en el doble-check**. Cierra una ejecución en `NEEDS_RECONCILIATION` a `COMPLETED`/`COMPLETED_WITH_ERRORS`
tras reconciliar sus fragmentos. Sin migración, sin reenvío, sin rutas legacy.

## Cambios

### Guard de terminalidad (repositorio de fragmentos)
`Mt101FragmentRepository.reconciliationSummary(dataSource, processExecutionId)` → `ReconciliationSummary(total,
nonTerminal, rejected)` con un `count(*) filter (...)` de Postgres:
`nonTerminal` = fragmentos NO en `('SENT','CONFIRMED','RECONCILED','REJECTED','SUPERSEDED')`. Incluye ARCHIVED sin
enviar, UNCERTAIN/DISPATCHING sin resolver → **cualquiera bloquea el cierre** (evita el falso-completado que descubrió
el doble-check: "PAY inició" ≠ "PAY envió").

### Cierre atómico (motor de ejecución)
`ProcessExecutionRepository.closeFromNeedsReconciliation` = `UPDATE ... SET status, details, finished_at WHERE id=?
AND status='NEEDS_RECONCILIATION'` (1 fila = cerró; 0 = ya no estaba en ese estado → sin doble cierre).
`ProcessExecutionStateService.closeReconciled(id, withErrors, details)` lo envuelve + audita
(`PROCESS_RECONCILED_CLOSED`).

### Servicio MT101 de cierre
`Mt101ReconciliationCloseService.closeReconciledExecution(connectionRef, processExecutionId, executedBy, reason)`:
1. exige `status == NEEDS_RECONCILIATION`;
2. `reconciliationSummary`: si `nonTerminal > 0` → **RECHAZA** con el detalle (cuántos de cuántos no-terminales);
3. si todos terminales → cierra `COMPLETED` (o `COMPLETED_WITH_ERRORS` si `rejected > 0`), auditado;
4. **nunca** re-ejecuta ni reenvía.

### Endpoint
`POST /api/query/mt101-quarantine/process-executions/close-reconciled?connectionRef&processExecutionId&reason`
(roles `PLATFORM_ADMIN/INTEGRATION_ADMIN/OPERATOR/PAYMENTS_OPERATOR`).

## Pruebas (evidenciadas)

- `Mt101ReconciliationCloseServiceTest` (mocks, 4): **el guard corregido** —
  `blocksCloseWhenAnyFragmentIsNonTerminal` (ARCHIVED sin enviar → rechaza, no cierra), `closesCompleted...` (todos
  terminales, sin rejected → `COMPLETED`), `closesCompletedWithErrors...` (rejected>0 → `COMPLETED_WITH_ERRORS`),
  rechazo si no está en `NEEDS_RECONCILIATION`.
- `Mt101ReconciliationSummaryTest` (Testcontainers): valida el `FILTER` SQL — ARCHIVED+UNCERTAIN cuentan como
  no-terminales; SENT/CONFIRMED/RECONCILED/SUPERSEDED/REJECTED no; no contamina entre ejecuciones.
- `ProcessExecutionStateServiceTest` (14, +2): `closeReconciled` cierra atómico desde `NEEDS_RECONCILIATION` + audita;
  devuelve false (sin auditar) si ya no estaba en ese estado.
- **Suite Mt101 + motor de ejecución: 323 tests, 0 fallos** (BUILD SUCCESS). Los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT`, `Mt101MillionFileProcessE2EIT`, `Mt101OutboundEndToEndIT`) validan el arranque CDI del
  nuevo servicio + el constructor ampliado del recurso.

## Conclusión

Cerrado el ciclo de vida abierto por v53: una ejecución en `NEEDS_RECONCILIATION` ya tiene salida operativa segura.
El guard (corregido en el doble-check) garantiza que **nunca** se cierra como completada una ejecución con pagos
pendientes (ARCHIVED sin enviar u UNCERTAIN/DISPATCHING sin resolver). Sin reenvío, sin re-ejecución.
