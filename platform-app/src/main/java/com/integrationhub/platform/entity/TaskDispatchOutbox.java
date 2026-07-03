package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Fila del outbox de despacho de tareas asíncronas (ADR-015). Espejo de {@code AuditSpool}:
 * la escribe el motor en su TX y la drena {@code TaskOutboxRelay} al broker.
 *
 * <p>Estados: {@code PENDING} → {@code IN_FLIGHT} → {@code SENT}; los imposibles de publicar
 * pasan a {@code DEAD} para no bloquear el outbox.</p>
 */
@Entity
@Table(name = "task_dispatch_outbox")
public class TaskDispatchOutbox {

    public static final String PENDING = "PENDING";
    public static final String IN_FLIGHT = "IN_FLIGHT";
    public static final String SENT = "SENT";
    public static final String DEAD = "DEAD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "idempotency_key", nullable = false, length = 200)
    public String idempotencyKey;

    @Column(nullable = false, length = 40)
    public String transport;

    @Column(name = "envelope_json", columnDefinition = "text", nullable = false)
    public String envelopeJson;

    @Column(nullable = false, length = 16)
    public String status = PENDING;

    @Column(nullable = false)
    public int attempts = 0;

    @Column(name = "next_attempt_at", nullable = false)
    public LocalDateTime nextAttemptAt = LocalDateTime.now();

    @Column(name = "locked_by", length = 80)
    public String lockedBy;

    @Column(name = "locked_at")
    public LocalDateTime lockedAt;

    @Column(name = "last_error", columnDefinition = "text")
    public String lastError;

    @Column(length = 200)
    public String reference;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "sent_at")
    public LocalDateTime sentAt;
}
