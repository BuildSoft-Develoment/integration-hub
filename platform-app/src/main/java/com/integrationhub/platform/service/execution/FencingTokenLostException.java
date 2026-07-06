package com.integrationhub.platform.service.execution;

/**
 * P2 (fencing token): un worker intentó una transición de estado sobre una ejecución que ya NO le pertenece — su
 * {@code execution_token} dejó de coincidir o la ejecución ya no está {@code RUNNING} (típicamente porque su lease
 * venció y otro nodo la recuperó). El worker debe **abortar** sin completar/fallar el proceso ni tocar el estado de
 * otro dueño. Convierte el lease en un fencing real, no solo en una marca de recuperación.
 *
 * <p>No es un fallo de negocio: no se traduce en {@code failProcess}/{@code failTask} (eso también estaría fenced y
 * sería engañoso). Se propaga hasta el runner, que la registra como aborto limpio del worker zombi.</p>
 */
public class FencingTokenLostException extends RuntimeException {

    public FencingTokenLostException(Long processExecutionId, String operation) {
        super("Fencing token lost for process execution " + processExecutionId + " during " + operation
                + ": the execution is no longer RUNNING under this worker's token (lease expired and recovered by "
                + "another node). Aborting without mutating state.");
    }
}
