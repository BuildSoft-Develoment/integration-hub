package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskInbox;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;

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
        // §5: solo terminal cortocircuita; un CLAIMED vivo/estancado va al claim() (re-toma si venció).
        return repository.existsTerminalByIdempotencyKey(idempotencyKey);
    }

    @Override
    @Transactional
    public boolean claim(AsyncTaskEnvelope envelope, String owner, int leaseSeconds) {
        var now = LocalDateTime.now();
        var claimedUntil = now.plusSeconds(Math.max(leaseSeconds, 1));
        return repository.claim(
                envelope.idempotencyKey(), envelope.taskType(), envelope.processExecutionId(),
                envelope.taskDefinitionId(), envelope.transport(), owner,
                Timestamp.valueOf(claimedUntil), Timestamp.valueOf(now)) == 1;
    }

    @Override
    @Transactional
    public void recordProcessed(AsyncTaskEnvelope envelope, String outputsJson, String details) {
        finalizeOrInsert(envelope, TaskInbox.PROCESSED, outputsJson, details, null);
    }

    @Override
    @Transactional
    public void recordFailed(AsyncTaskEnvelope envelope, String details) {
        finalizeOrInsert(envelope, TaskInbox.FAILED, null, details, null);
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

    /**
     * §5: finaliza el claim de este work-item (CLAIMED → terminal). Si no había claim (0 filas) cae a
     * {@code insertIfAbsent}: preserva el registro idempotente para cualquier camino que no reclame (defensa).
     */
    private void finalizeOrInsert(AsyncTaskEnvelope envelope, String status,
                                  String outputsJson, String details, String error) {
        var finalized = repository.finalizeClaimed(
                envelope.idempotencyKey(), status, outputsJson, details, error);
        if (finalized == 0) {
            insertTerminal(envelope, status, outputsJson, details, error);
        }
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
