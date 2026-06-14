package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Read-model del store frio de auditoria a nivel de registro. Lo escribe el
 * audit-consumer; platform-app lo lee para el visor de trazabilidad E2E.
 */
@Entity
@Table(name = "audit_record_event")
public class AuditRecordEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "event_id", nullable = false, length = 64)
    public String eventId;

    @Column(name = "trace_id", length = 120)
    public String traceId;

    @Column(name = "record_id", length = 64)
    public String recordId;

    @Column(nullable = false, length = 80)
    public String stage;

    @Column(length = 30)
    public String status;

    @Column(name = "process_execution_id")
    public Long processExecutionId;

    @Column(name = "task_definition_id")
    public Long taskDefinitionId;

    @Column(columnDefinition = "text")
    public String message;

    @Column(name = "payload_json", columnDefinition = "text")
    public String payloadJson;

    @Column(name = "event_ts", nullable = false)
    public LocalDateTime eventTs;

    @Column(name = "ingested_at", nullable = false)
    public LocalDateTime ingestedAt;
}
