package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskInbox;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

/**
 * Adaptador JPA del puerto {@link TaskInboxStore} (ADR-015). Responsabilidad única: mapear el
 * dominio ({@link AsyncTaskEnvelope} + resultado) a filas del ledger y delimitar la transacción;
 * el acceso a datos vive en {@link TaskInboxRepository}. El {@link AsyncTaskConsumer} depende solo
 * del puerto (DIP).
 */
@ApplicationScoped
public class JpaTaskInboxStore implements TaskInboxStore {

    private static final Logger LOG = Logger.getLogger(JpaTaskInboxStore.class);

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
        var row = terminal(envelope, TaskInbox.PROCESSED);
        row.outputsJson = outputsJson;
        row.details = details;
        persistDeduped(row, envelope.idempotencyKey());
    }

    @Override
    @Transactional
    public void recordFailed(AsyncTaskEnvelope envelope, String details) {
        var row = terminal(envelope, TaskInbox.FAILED);
        row.details = details;
        persistDeduped(row, envelope.idempotencyKey());
    }

    @Override
    @Transactional
    public void recordDead(AsyncTaskEnvelope envelope, String error) {
        var row = terminal(envelope, TaskInbox.DEAD);
        row.error = error;
        persistDeduped(row, envelope.idempotencyKey());
    }

    @Override
    @Transactional
    public void recordPoison(String rawPayload, String brokerType, String topic, String error) {
        var row = new TaskInbox();
        row.status = TaskInbox.POISON;
        row.rawPayload = rawPayload;
        row.brokerType = brokerType;
        row.topic = topic;
        row.error = error;
        repository.persist(row);
    }

    private TaskInbox terminal(AsyncTaskEnvelope envelope, String status) {
        var row = new TaskInbox();
        row.idempotencyKey = envelope.idempotencyKey();
        row.taskType = envelope.taskType();
        row.processExecutionId = envelope.processExecutionId();
        row.taskDefinitionId = envelope.taskDefinitionId();
        row.brokerType = envelope.transport();
        row.status = status;
        return row;
    }

    /**
     * Persiste forzando el flush para que la violación del índice único de idempotencia aflore
     * <b>aquí</b> (no en el commit): si otro consumer ya registró la misma clave (carrera), se trata
     * como duplicado y se descarta — el efecto ya quedó asentado una vez.
     */
    private void persistDeduped(TaskInbox row, String idempotencyKey) {
        try {
            repository.persist(row);
            repository.flush();
        } catch (PersistenceException raced) {
            LOG.debugf("task_inbox: idempotency_key %s ya registrada por otro consumer; descartado", idempotencyKey);
        }
    }
}
