package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Ledger de idempotencia del consumer de tareas asíncronas (ADR-015). Espejo de entrada del
 * {@code task_dispatch_outbox}: como el broker es at-least-once, el consumer registra aquí cada
 * work-item terminal (por {@code idempotency_key}) para descartar reentregas duplicadas sin repetir
 * el efecto (crítico en DB_WRITE/REST/pagos).
 *
 * <p>Estados terminales: {@code PROCESSED} (ejecutado ok), {@code FAILED} (fallo de negocio
 * determinista — no se reintenta), {@code DEAD} (no ejecutable: tipo desconocido o config ilegible),
 * {@code POISON} (payload indecodificable: no lleva {@code idempotency_key}). Un fallo transitorio
 * de infraestructura NO se registra: propaga para que el broker reentregue (at-least-once).</p>
 */
@Entity
@Table(name = "task_inbox")
public class TaskInbox {

    public static final String PROCESSED = "PROCESSED";
    public static final String FAILED = "FAILED";
    public static final String DEAD = "DEAD";
    public static final String POISON = "POISON";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** Clave de dedup; {@code null} solo para POISON (payload sin envelope decodificable). */
    @Column(name = "idempotency_key", length = 200)
    public String idempotencyKey;

    @Column(name = "task_type", length = 80)
    public String taskType;

    @Column(name = "process_execution_id")
    public Long processExecutionId;

    @Column(name = "task_definition_id")
    public Long taskDefinitionId;

    @Column(nullable = false, length = 16)
    public String status;

    @Column(name = "outputs_json", columnDefinition = "text")
    public String outputsJson;

    @Column(columnDefinition = "text")
    public String details;

    @Column(columnDefinition = "text")
    public String error;

    /** Payload crudo, solo para POISON (trazabilidad de la trama indecodificable). */
    @Column(name = "raw_payload", columnDefinition = "text")
    public String rawPayload;

    @Column(name = "broker_type", length = 40)
    public String brokerType;

    @Column(length = 200)
    public String topic;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();
}
