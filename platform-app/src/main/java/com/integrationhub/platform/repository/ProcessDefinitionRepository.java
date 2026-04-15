package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.ProcessDefinition;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class ProcessDefinitionRepository implements PanacheRepository<ProcessDefinition> {

    public ProcessDefinition findRequired(Long processDefinitionId) {
        var definition = findById(processDefinitionId);
        if (definition == null) {
            throw new IllegalArgumentException("Process definition not found: " + processDefinitionId);
        }
        return definition;
    }

    public List<ProcessDefinition> listAllOrdered() {
        return list("order by name");
    }

    public List<ProcessDefinition> listScheduled() {
        return list("scheduled = true order by name");
    }

    public List<ProcessDefinition> listDueScheduled(LocalDateTime now) {
        return list(
                "active = true and scheduled = true and scheduleEvery is not null and (nextRunAt is null or nextRunAt <= ?1)",
                now
        );
    }

    public long countActiveScheduled() {
        return count("scheduled = true and active = true");
    }
}
