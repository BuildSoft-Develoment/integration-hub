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

    @Column(name = "record_id", length = 512)
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

    @Column(length = 20)
    public String standard;

    @Column(name = "message_type", length = 30)
    public String messageType;

    @Column(name = "source_file_name")
    public String sourceFileName;

    @Column(name = "source_file_hash", length = 64)
    public String sourceFileHash;

    @Column(name = "record_number")
    public Long recordNumber;

    @Column(name = "business_key", length = 120)
    public String businessKey;

    @Column(name = "business_key_hash", length = 64)
    public String businessKeyHash;

    @Column(name = "payment_reference", length = 40)
    public String paymentReference;

    @Column(name = "transaction_reference", length = 40)
    public String transactionReference;

    @Column(length = 36)
    public String uetr;

    @Column(name = "archive_id")
    public Long archiveId;

    @Column(name = "gateway_reference", length = 120)
    public String gatewayReference;

    @Column(name = "event_ts", nullable = false)
    public LocalDateTime eventTs;

    @Column(name = "ingested_at", nullable = false)
    public LocalDateTime ingestedAt;
}
