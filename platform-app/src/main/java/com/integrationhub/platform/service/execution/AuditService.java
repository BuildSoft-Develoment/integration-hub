package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.entity.AuditEvent;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.repository.AuditEventRepository;
import com.integrationhub.platform.repository.ProcessExecutionRepository;
import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

@ApplicationScoped
public class AuditService {

    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final AuditEventRepository auditEventRepository;
    private final ProcessExecutionRepository processExecutionRepository;
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository;

    public AuditService(JsonConfigurationMapper jsonConfigurationMapper,
                        AuditEventRepository auditEventRepository,
                        ProcessExecutionRepository processExecutionRepository,
                        ProcessTaskDefinitionRepository processTaskDefinitionRepository) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.auditEventRepository = auditEventRepository;
        this.processExecutionRepository = processExecutionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
    }

    @Transactional
    public void record(ProcessExecution execution, ProcessTaskDefinition taskDefinition, String eventType, String status, String message, Object payload) {
        var event = new AuditEvent();
        event.processExecution = execution;
        event.taskDefinition = taskDefinition;
        event.eventType = eventType;
        event.status = status;
        event.message = message;
        event.payloadJson = payload == null ? null : jsonConfigurationMapper.toJson(payload);
        event.createdAt = LocalDateTime.now();
        auditEventRepository.persist(event);
    }

    @Transactional
    public void record(Long processExecutionId, Long taskDefinitionId, String eventType, String status, String message, Object payload) {
        record(resolveExecution(processExecutionId), resolveTaskDefinition(taskDefinitionId), eventType, status, message, payload);
    }

    private ProcessExecution resolveExecution(Long processExecutionId) {
        if (processExecutionId == null) {
            return null;
        }
        return processExecutionRepository.findRequired(processExecutionId);
    }

    private ProcessTaskDefinition resolveTaskDefinition(Long taskDefinitionId) {
        if (taskDefinitionId == null) {
            return null;
        }
        return processTaskDefinitionRepository.findRequired(taskDefinitionId);
    }
}
