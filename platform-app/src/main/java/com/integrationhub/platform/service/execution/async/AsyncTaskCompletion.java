package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.service.execution.ProcessExecutionResumeService;
import com.integrationhub.platform.spi.task.TaskResult;

import java.util.Map;

/**
 * Puerto de <b>completación async</b> (ADR-015 Etapa 4): aplica el resultado ya calculado por el
 * consumer a la tarea suspendida por despacho async y continúa el pipeline, sin re-invocar al
 * provider. Lo implementa {@link ProcessExecutionResumeService} (que ya posee la maquinaria de
 * continuación M-2); el {@link AsyncTaskConsumer} depende solo de este puerto, por lo que es
 * testeable con un fake sin arrancar el motor.
 */
public interface AsyncTaskCompletion {

    /**
     * Aplica el resultado externo a la tarea suspendida por despacho async. Si el resultado es
     * {@code suspended} (Nivel 3: un {@code SuspendableTaskProvider} que ejecutó su primer intento en el
     * consumer y necesita esperar un evento externo), <b>re-suspende</b> la tarea con un token/estado/
     * expiry nuevos (en vez de DEAD), para que el callback/scheduler la reanude normalmente.
     */
    ProcessExecutionResumeService.ResumeOutcome completeFromExternalResult(
            Long processExecutionId, Long taskDefinitionId, TaskResult result);

    /**
     * Contexto serializable ({@code taskOutputs}/{@code executionVariables}) capturado al suspender la
     * tarea por despacho async (Nivel 3, camino once): permite al consumer rehidratar el
     * {@code TaskContext} del provider —p.ej. {@code MT101_STATUS} necesita {@code taskOutputs} para
     * saber qué pagos consultar— sin cambiar el wire del envelope. Vacío si no hay suspensión activa.
     */
    SuspendedContext loadSuspendedContext(Long processExecutionId, Long taskDefinitionId);

    /** Contexto serializable rehidratable de una tarea suspendida por despacho async. */
    record SuspendedContext(Map<String, Object> taskOutputs, Map<String, String> executionVariables) {
        public static SuspendedContext empty() {
            return new SuspendedContext(Map.of(), Map.of());
        }
    }
}
