package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskInbox;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * Adaptador JPA del puerto {@link TaskInboxStore} (ADR-015). Responsabilidad única: mapear el
 * dominio ({@link AsyncTaskEnvelope} + resultado) a filas del ledger y delimitar la transacción;
 * el acceso a datos vive en {@link TaskInboxRepository}. El {@link AsyncTaskConsumer} depende solo
 * del puerto (DIP).
 *
 * <p>El registro es <b>idempotente</b> ({@code ON CONFLICT DO NOTHING} en el repositorio, igual que
 * {@code AuditEventWriter}): la carrera de dos consumers sobre la misma clave se degrada a duplicado
 * sin excepción, sin depender de capturar violaciones de constraint tras el flush.</p>
 */
@ApplicationScoped
public class JpaTaskInboxStore implements TaskInboxStore {

    private final TaskInboxRepository repository;

    @Inject
    public JpaTaskInboxStore(TaskInboxRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public boolean isProcessed(String idempotencyKey) {
        return repository.existsByIdempotencyKey(idempotencyKey);
    }

    @Override
    @Transactional
    public void recordProcessed(AsyncTaskEnvelope envelope, String outputsJson, String details) {
        insertTerminal(envelope, TaskInbox.PROCESSED, outputsJson, details, null);
    }

    @Override
    @Transactional
    public void recordFailed(AsyncTaskEnvelope envelope, String details) {
        insertTerminal(envelope, TaskInbox.FAILED, null, details, null);
    }

    @Override
    @Transactional
    public void recordDead(AsyncTaskEnvelope envelope, String error) {
        insertTerminal(envelope, TaskInbox.DEAD, null, null, error);
    }

    @Override
    @Transactional
    public void recordPoison(String rawPayload, String brokerType, String topic, String error) {
        // Sin idempotencyKey → no entra al índice parcial → siempre se inserta (DLQ del consumer).
        repository.insertIfAbsent(null, null, null, null, TaskInbox.POISON,
                null, null, error, rawPayload, brokerType, topic);
    }

    private void insertTerminal(AsyncTaskEnvelope envelope, String status,
                                String outputsJson, String details, String error) {
        repository.insertIfAbsent(
                envelope.idempotencyKey(),
                envelope.taskType(),
                envelope.processExecutionId(),
                envelope.taskDefinitionId(),
                status,
                outputsJson,
                details,
                error,
                null,
                envelope.transport(),
                null);
    }
}
