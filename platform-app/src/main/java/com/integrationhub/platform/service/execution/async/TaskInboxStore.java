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

    /** Registra una ejecución exitosa; el {@code outputsJson} lo consumirá la continuación (Etapa 4). */
    void recordProcessed(AsyncTaskEnvelope envelope, String outputsJson, String details);

    /** Registra un fallo de negocio determinista (no se reintenta). */
    void recordFailed(AsyncTaskEnvelope envelope, String details);

    /** Registra un work-item no ejecutable (tipo desconocido o configuración ilegible). */
    void recordDead(AsyncTaskEnvelope envelope, String error);

    /** Registra una trama indecodificable (sin envelope): DLQ del consumer. */
    void recordPoison(String rawPayload, String brokerType, String topic, String error);
}
