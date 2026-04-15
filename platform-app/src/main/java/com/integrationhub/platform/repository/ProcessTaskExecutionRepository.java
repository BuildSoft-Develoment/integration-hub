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
}
