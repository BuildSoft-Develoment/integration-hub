package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.ProcessTaskExecution;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProcessTaskExecutionRepository implements PanacheRepository<ProcessTaskExecution> {

    public PanacheQuery<ProcessTaskExecution> findByProcessExecutionId(Long processExecutionId) {
        return find("from ProcessTaskExecution e where e.processExecution.id = ?1 order by e.id asc", processExecutionId);
    }

    /**
     * Lookup por {@code resume_token} para el endpoint de callback de M-2.
     * Devuelve {@code null} si no existe o ya fue reanudado.
     *
     * @trace spec 003 T-017, ADR-009
     */
    public ProcessTaskExecution findActiveByResumeToken(String resumeToken) {
        if (resumeToken == null || resumeToken.isBlank()) {
            return null;
        }
        return find("resumeToken = ?1 and resumedAt is null", resumeToken).firstResult();
    }

    /**
     * Token activo mas reciente de una ejecucion (para reportar el nuevo token
     * cuando una tarea downstream se suspende durante la continuacion M-2.1).
     */
    public String findActiveResumeToken(Long processExecutionId) {
        if (processExecutionId == null) {
            return null;
        }
        var taskExecution = find(
                "processExecution.id = ?1 and resumedAt is null and resumeToken is not null order by id desc",
                processExecutionId).firstResult();
        return taskExecution == null ? null : taskExecution.resumeToken;
    }

    /**
     * Lookup de la suspensión activa por ejecución + definición de tarea (ADR-015 Etapa 4). El
     * consumer async conoce estos ids desde el {@code AsyncTaskEnvelope} y con ellos correlaciona la
     * tarea suspendida por despacho async para completarla con el resultado ya calculado. Devuelve
     * {@code null} si no hay ninguna suspendida activa (p.ej. ya reanudada) → la completación es
     * idempotente.
     */
    public ProcessTaskExecution findActiveSuspendedByExecutionAndTask(Long processExecutionId, Long taskDefinitionId) {
        if (processExecutionId == null || taskDefinitionId == null) {
            return null;
        }
        return find("processExecution.id = ?1 and taskDefinition.id = ?2 and resumedAt is null and status = ?3 "
                        + "order by id desc",
                processExecutionId, taskDefinitionId,
                com.integrationhub.platform.spi.execution.ExecutionStatus.SUSPENDED).firstResult();
    }

    /**
     * Suspensiones vencidas para el auto-despertar del scheduler M-2 (modo poll).
     * Soportado por el indice parcial {@code ix_process_task_execution_suspend_expires_at}
     * (V13).
     *
     * @trace spec 003 T-017, ADR-009
     */
    public java.util.List<ProcessTaskExecution> findExpiredSuspensions(java.time.LocalDateTime now, int limit) {
        return find("status = ?1 and resumedAt is null and suspendExpiresAt is not null and suspendExpiresAt <= ?2",
                com.integrationhub.platform.spi.execution.ExecutionStatus.SUSPENDED, now)
                .page(0, Math.max(limit, 1))
                .list();
    }
}
