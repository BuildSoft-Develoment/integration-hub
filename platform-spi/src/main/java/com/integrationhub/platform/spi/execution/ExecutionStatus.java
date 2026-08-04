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
    NEEDS_RECONCILIATION,

    /**
     * Estado de TAREA (no de ejecucion): la tarea estaba corriendo cuando el nodo perdio el lease y
     * la ejecucion se recupero. No se sabe si llego a terminar su trabajo, pero desde luego ya no
     * lo esta haciendo.
     *
     * <p>Existe porque antes esas filas se quedaban en {@code RUNNING} indefinidamente dentro de
     * ejecuciones ya cerradas. Marcarlas {@code FAILED} habria sido mas barato y falso: no fallaron,
     * se quedaron sin nodo, y esa diferencia es la que permite distinguir un proceso que va mal de
     * una infraestructura que va mal.</p>
     *
     * <p>Nunca se aplica a una tarea con {@code movesMoney}: esa es la evidencia que enruta la
     * ejecucion a {@link #NEEDS_RECONCILIATION} y no se puede disfrazar de tarea cerrada.</p>
     */
    ABORTED
}

