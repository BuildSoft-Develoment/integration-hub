package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.task.AsyncTaskEnvelope;

/**
 * Puerto de persistencia del ledger de idempotencia del consumer (ADR-015). El adaptador JPA
 * (tabla {@code task_inbox}) lo implementa; el {@link AsyncTaskConsumer} depende solo de este
 * puerto, por lo que su lógica de dedup/registro es testeable con un fake en memoria, sin DB.
 */
public interface TaskInboxStore {

    /** ¿Ya hay un registro terminal para esta clave? (descarta reentregas at-least-once). */
    boolean isProcessed(String idempotencyKey);

    /**
     * §5: claim ATÓMICO del work-item once antes de ejecutar el efecto. Devuelve {@code true} si este
     * consumer gana (o re-toma un claim propio/vencido) y debe ejecutar; {@code false} si otro lo tiene vivo
     * o ya es terminal → skip. Con owner+lease, dos entregas de la misma trama no ejecutan el efecto dos veces.
     */
    boolean claim(AsyncTaskEnvelope envelope, String owner, int leaseSeconds);

    /**
     * §5 (F3): renueva el lease de un claim propio y VIVO mientras se ejecuta un efecto largo. Owner-scoped:
     * devuelve {@code true} si renovó; {@code false} si el claim ya no es de {@code owner} (re-tomado) o dejó de
     * estar {@code CLAIMED} (finalizó) → el heartbeat debe dejar de renovar. Evita que una reentrega durante una
     * ejecución larga re-tome el claim y duplique el efecto (complementa el fencing del finalize).
     */
    boolean renewLease(AsyncTaskEnvelope envelope, String owner, int leaseSeconds);

    /** Registra una ejecución exitosa; el {@code outputsJson} lo consumirá la continuación (Etapa 4). */
    void recordProcessed(AsyncTaskEnvelope envelope, String outputsJson, String details);

    /** Registra un fallo de negocio determinista (no se reintenta). */
    void recordFailed(AsyncTaskEnvelope envelope, String details);

    /** Registra un work-item no ejecutable (tipo desconocido o configuración ilegible). */
    void recordDead(AsyncTaskEnvelope envelope, String error);

    /** Registra una trama indecodificable (sin envelope): DLQ del consumer. */
    void recordPoison(String rawPayload, String brokerType, String topic, String error);
}
