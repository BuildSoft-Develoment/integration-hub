package com.integrationhub.platform.service;

import com.integrationhub.platform.entity.AuditEvent;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.repository.AuditEventRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

@ApplicationScoped
public class AuditService {

    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final AuditEventRepository auditEventRepository;

    public AuditService(JsonConfigurationMapper jsonConfigurationMapper, AuditEventRepository auditEventRepository) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.auditEventRepository = auditEventRepository;
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
}
