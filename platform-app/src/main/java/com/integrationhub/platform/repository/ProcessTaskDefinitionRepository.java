package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class ProcessTaskDefinitionRepository implements PanacheRepository<ProcessTaskDefinition> {

    public ProcessTaskDefinition findRequired(Long processTaskDefinitionId) {
        var taskDefinition = findById(processTaskDefinitionId);
        if (taskDefinition == null) {
            throw new IllegalArgumentException("Process task definition not found: " + processTaskDefinitionId);
        }
        return taskDefinition;
    }

    /**
     * B2': primera tarea activa de un tipo dado dentro del mismo proceso (p.ej.
     * MT101_VALIDATE / MT101_ARCHIVE / MT101_PAY), para reusar su config al orquestar
     * el ciclo del set correctivo. Null si el proceso no tiene esa tarea.
     */
    public ProcessTaskDefinition findActiveByProcessAndType(ProcessDefinition processDefinition, String taskType) {
        return find("processDefinition = ?1 and taskType = ?2 and active = true order by taskOrder asc",
                processDefinition, taskType).firstResult();
    }

    public List<ProcessTaskDefinition> listActiveByProcessAndType(ProcessDefinition processDefinition, String taskType) {
        return find("processDefinition = ?1 and taskType = ?2 and active = true order by taskOrder asc",
                processDefinition, taskType).list();
    }

    public long deactivateByProcessDefinition(ProcessDefinition processDefinition) {
        return update("active = false where processDefinition = ?1 and active = true", processDefinition);
    }

}
