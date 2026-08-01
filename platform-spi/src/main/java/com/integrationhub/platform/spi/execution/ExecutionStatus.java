package com.integrationhub.platform.spi.execution;

public enum ExecutionStatus {
    PENDING,
    RUNNING,
    COMPLETED,
    COMPLETED_WITH_ERRORS,
    FAILED,
    /**
     * Estado intermedio M-2: tarea (o proceso) pausada esperando un evento
     * externo (callback bancario, scheduler periodico, approval). Persistido
     * con {@code resume_token} + {@code suspended_state}; sale del estado
     * cuando llega un POST {@code /api/process-executions/resume/{token}} o
     * un scheduler periodico re-invoca al provider.
     *
     * @trace spec 003-diseno-y-ejecucion-procesos T-017, ADR-009, spec 008-mensajeria-pagos RF-019
     */
    SUSPENDED,

    /**
     * v53-fix (#8): una ejecucion cuyo lease vencio (nodo caido) y que YA habia iniciado un efecto no-idempotente
     * (MT101_PAY) NO se re-ejecuta a ciegas al recuperarla: pasa a este estado terminal-para-el-motor. La resolucion
     * es manual/operativa via STATUS/RECONCILE (correctivo) o {@code resolve-uncertain-normal-pay} (v52), que NUNCA
     * reenvian. Una ejecucion huerfana que NO habia iniciado PAY se re-encola (PENDING), no llega aqui.
     */
    NEEDS_RECONCILIATION
}

