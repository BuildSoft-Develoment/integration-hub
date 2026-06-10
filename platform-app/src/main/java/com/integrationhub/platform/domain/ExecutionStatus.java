package com.integrationhub.platform.domain;

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
     * @trace spec 003 T-017, ADR-009, spec 008-mensajeria-pagos RF-019
     */
    SUSPENDED
}

