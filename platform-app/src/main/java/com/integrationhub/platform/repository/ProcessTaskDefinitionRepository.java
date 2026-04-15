package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProcessTaskDefinitionRepository implements PanacheRepository<ProcessTaskDefinition> {

    public long deactivateByProcessDefinition(ProcessDefinition processDefinition) {
        return update("active = false where processDefinition = ?1 and active = true", processDefinition);
    }
}
