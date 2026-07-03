package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.service.execution.ProcessExecutionResumeService;
import com.integrationhub.platform.spi.task.TaskResult;

/**
 * Puerto de <b>completación async</b> (ADR-015 Etapa 4): aplica el resultado ya calculado por el
 * consumer a la tarea suspendida por despacho async y continúa el pipeline, sin re-invocar al
 * provider. Lo implementa {@link ProcessExecutionResumeService} (que ya posee la maquinaria de
 * continuación M-2); el {@link AsyncTaskConsumer} depende solo de este puerto, por lo que es
 * testeable con un fake sin arrancar el motor.
 */
public interface AsyncTaskCompletion {

    ProcessExecutionResumeService.ResumeOutcome completeFromExternalResult(
            Long processExecutionId, Long taskDefinitionId, TaskResult result);
}
