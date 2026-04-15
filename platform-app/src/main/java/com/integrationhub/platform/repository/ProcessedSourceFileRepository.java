package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.ProcessedSourceFile;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProcessedSourceFileRepository implements PanacheRepository<ProcessedSourceFile> {

    public long countByStatus(String status) {
        return count("status", status);
    }

    public void deleteByExecutionAndTask(Long processExecutionId, Long taskDefinitionId) {
        delete("processExecution.id = ?1 and taskDefinition.id = ?2", processExecutionId, taskDefinitionId);
    }

    public PanacheQuery<ProcessedSourceFile> findByExecutionAndTask(Long processExecutionId, Long taskDefinitionId) {
        return find("from ProcessedSourceFile f where f.processExecution.id = ?1 and f.taskDefinition.id = ?2 order by f.id asc", processExecutionId, taskDefinitionId);
    }
}
