package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Fila del spool durable de auditoria. La escribe {@code AuditService.emit()} en
 * su propia mini-TX (no la del negocio) y la drena {@code OutboxRelay} al MQ.
 *
 * <p>Estados: {@code PENDING} -> {@code IN_FLIGHT} -> {@code SENT}; los eventos
 * imposibles de publicar pasan a {@code DEAD} para no bloquear el spool.</p>
 */
@Entity
@Table(name = "audit_spool")
public class AuditSpool {

    public static final String PENDING = "PENDING";
    public static final String IN_FLIGHT = "IN_FLIGHT";
    public static final String SENT = "SENT";
    public static final String DEAD = "DEAD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "event_id", nullable = false, length = 64)
    public String eventId;

    @Column(name = "trace_id", length = 120)
    public String traceId;

    @Column(nullable = false, length = 160)
    public String topic;

    @Column(name = "partition_key", length = 120)
    public String partitionKey;

    @Column(columnDefinition = "text", nullable = false)
    public String payload;

    @Column(name = "spool_status", nullable = false, length = 16)
    public String spoolStatus = PENDING;

    @Column(nullable = false)
    public int attempts = 0;

    @Column(name = "last_error", columnDefinition = "text")
    public String lastError;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "sent_at")
    public LocalDateTime sentAt;

    @Column(name = "locked_by", length = 120)
    public String lockedBy;

    @Column(name = "locked_at")
    public LocalDateTime lockedAt;

    @Column(name = "next_attempt_at")
    public LocalDateTime nextAttemptAt;

    @Column(name = "dead_at")
    public LocalDateTime deadAt;

    @Column(name = "dead_reason", columnDefinition = "text")
    public String deadReason;
}
