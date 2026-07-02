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
     * Suspensiones vencidas para el auto-despertar del scheduler M-2 (modo poll).
     * Soportado por el indice parcial {@code ix_process_task_execution_suspend_expires_at}
     * (V13).
     *
     * @trace spec 003 T-017, ADR-009
     */
    public java.util.List<ProcessTaskExecution> findExpiredSuspensions(java.time.LocalDateTime now, int limit) {
        return find("status = ?1 and resumedAt is null and suspendExpiresAt is not null and suspendExpiresAt <= ?2",
                com.integrationhub.platform.domain.ExecutionStatus.SUSPENDED, now)
                .page(0, Math.max(limit, 1))
                .list();
    }
}
