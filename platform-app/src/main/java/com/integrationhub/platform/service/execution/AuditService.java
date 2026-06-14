package com.integrationhub.platform.service.execution;

// @trace RF-005 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.entity.AuditSpool;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.repository.AuditSpoolRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.UUID;

/**
 * Auditoria asincrona desacoplada de la TX de negocio.
 *
 * <p>{@code record/emit} NO escriben {@code audit_event} ni llaman al broker en el
 * hot-path: persisten la trama en {@code audit_spool} en una mini-TX propia
 * ({@code REQUIRES_NEW}). Asi un fallo de auditoria nunca hace rollback del pago y
 * el commit del negocio no espera por la auditoria. El {@code OutboxRelay} drena el
 * spool al MQ y el {@code audit-consumer} registra el evento.</p>
 *
 * @trace spec auditoria-asincrona-mq
 */
@ApplicationScoped
public class AuditService implements RecordAuditEmitter {

    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final AuditSpoolRepository auditSpoolRepository;
    private final String topic;

    private final boolean recordLevelEnabled;

    @Inject
    public AuditService(JsonConfigurationMapper jsonConfigurationMapper,
                        AuditSpoolRepository auditSpoolRepository,
                        @ConfigProperty(name = "audit.topic", defaultValue = "audit-events") String topic,
                        @ConfigProperty(name = "audit.record-level.enabled", defaultValue = "true") boolean recordLevelEnabled) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.auditSpoolRepository = auditSpoolRepository;
        this.topic = topic;
        this.recordLevelEnabled = recordLevelEnabled;
    }

    public void record(ProcessExecution execution, ProcessTaskDefinition taskDefinition,
                       String eventType, String status, String message, Object payload) {
        Long executionId = execution == null ? null : execution.id;
        Long taskDefinitionId = taskDefinition == null ? null : taskDefinition.id;
        record(executionId, taskDefinitionId, eventType, status, message, payload);
    }

    public void record(Long processExecutionId, Long taskDefinitionId,
                       String eventType, String status, String message, Object payload) {
        emit(new AuditEnvelope(
                UUID.randomUUID().toString(),
                traceIdFor(processExecutionId),
                null,
                AuditLevel.PROCESS,
                eventType,
                status,
                processExecutionId,
                taskDefinitionId,
                message,
                payload == null ? null : jsonConfigurationMapper.toJson(payload),
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION));
    }

    /**
     * Persiste la trama en el spool durable, en su PROPIA transaccion. No participa
     * de la TX de negocio: si el caller hace rollback, la auditoria sobrevive; si la
     * auditoria fallara, no tumba el negocio.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void emit(AuditEnvelope envelope) {
        var row = new AuditSpool();
        row.eventId = envelope.eventId();
        row.traceId = envelope.traceId();
        row.topic = topic;
        row.partitionKey = envelope.traceId();
        row.payload = jsonConfigurationMapper.toJson(envelope);
        row.spoolStatus = AuditSpool.PENDING;
        auditSpoolRepository.persist(row);
    }

    /**
     * Emite auditoria a nivel de registro en lote (un solo JDBC batch al spool),
     * fuera de la TX de negocio. Pensado para el flujo masivo (1M+): el provider
     * acumula por pagina y delega aqui el insert batcheado.
     */
    @Override
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void emitRecords(Collection<AuditEnvelope> envelopes) {
        if (!recordLevelEnabled || envelopes == null || envelopes.isEmpty()) {
            return;
        }
        var rows = new ArrayList<AuditSpool>(envelopes.size());
        for (var envelope : envelopes) {
            var row = new AuditSpool();
            row.eventId = envelope.eventId();
            row.traceId = envelope.traceId();
            row.topic = topic;
            row.partitionKey = envelope.traceId();
            row.payload = jsonConfigurationMapper.toJson(envelope);
            row.spoolStatus = AuditSpool.PENDING;
            rows.add(row);
        }
        auditSpoolRepository.persistBatch(rows);
    }

    private String traceIdFor(Long processExecutionId) {
        return processExecutionId == null ? null : "exec-" + processExecutionId;
    }
}
