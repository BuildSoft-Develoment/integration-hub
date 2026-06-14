package com.integrationhub.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_event")
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    // Identidad de la trama de auditoria: lo escribe el audit-consumer y permite
    // deduplicar la entrega at-least-once del MQ.
    @Column(name = "event_id", length = 64)
    public String eventId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_execution_id")
    public ProcessExecution processExecution;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_definition_id")
    public ProcessTaskDefinition taskDefinition;

    @Column(name = "event_type", nullable = false, length = 80)
    public String eventType;

    @Column(nullable = false, length = 30)
    public String status;

    @Column(columnDefinition = "text")
    public String message;

    @Column(name = "payload_json", columnDefinition = "text")
    public String payloadJson;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;
}

