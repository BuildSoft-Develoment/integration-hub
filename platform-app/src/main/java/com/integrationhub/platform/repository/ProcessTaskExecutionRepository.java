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
}
