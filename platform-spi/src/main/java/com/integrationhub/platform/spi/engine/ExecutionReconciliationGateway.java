package com.integrationhub.platform.spi.engine;

import com.integrationhub.platform.spi.execution.ExecutionStatus;

/**
 * ADR-021: cierre de una ejecucion que quedo en {@link ExecutionStatus#NEEDS_RECONCILIATION}.
 *
 * <p>Ese estado lo produce el motor (un lease vencido sobre un efecto no-idempotente ya iniciado),
 * pero SOLO el vertical sabe si la conciliacion cerro de verdad: el motor no puede mirar los
 * fragmentos de un MT101 ni las filas de un envio SBS. De ahi el puerto — el vertical decide, el
 * motor ejecuta la transicion de estado.</p>
 *
 * <p>El cierre es condicional a proposito: si entre la lectura y el cierre otro nodo movio la
 * ejecucion, {@link #closeReconciled} devuelve {@code false} en vez de pisar el cambio. Cerrar a
 * ciegas una ejecucion del money-path es exactamente lo que este estado existe para evitar.</p>
 */
public interface ExecutionReconciliationGateway {

    /**
     * @return el estado actual de la ejecucion, o {@code null} si no existe
     */
    ExecutionStatus statusOf(Long processExecutionId);

    /**
     * Cierra la ejecucion como conciliada.
     *
     * @param withErrors true si la conciliacion encontro rechazos (queda COMPLETED_WITH_ERRORS)
     * @param details motivo auditable del cierre
     * @return true si se cerro; false si la ejecucion ya NO estaba en
     *         {@link ExecutionStatus#NEEDS_RECONCILIATION} (cambio concurrente): no se toco nada
     */
    boolean closeReconciled(Long processExecutionId, boolean withErrors, String details);
}
