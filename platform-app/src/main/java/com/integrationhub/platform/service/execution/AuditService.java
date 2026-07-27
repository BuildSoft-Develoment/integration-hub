package com.integrationhub.platform.service.execution;

// @trace RF-005 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.spi.engine.RecordAuditEmitter;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
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

    private static final Logger LOG = Logger.getLogger(AuditService.class);

    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final AuditSpoolWriter auditSpoolWriter;
    private final boolean recordLevelEnabled;
    private final boolean failBusinessOnError;

    @Inject
    public AuditService(JsonConfigurationMapper jsonConfigurationMapper,
                        AuditSpoolWriter auditSpoolWriter,
                        @ConfigProperty(name = "audit.record-level.enabled", defaultValue = "true") boolean recordLevelEnabled,
                        @ConfigProperty(name = "audit.fail-business-on-error", defaultValue = "false") boolean failBusinessOnError) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.auditSpoolWriter = auditSpoolWriter;
        this.recordLevelEnabled = recordLevelEnabled;
        this.failBusinessOnError = failBusinessOnError;
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

    public void emit(AuditEnvelope envelope) {
        try {
            auditSpoolWriter.write(envelope);
        } catch (RuntimeException error) {
            handleAuditFailure("single event " + envelope.eventId(), error);
        }
    }

    /**
     * Emite auditoria a nivel de registro en lote (un solo JDBC batch al spool),
     * fuera de la TX de negocio. Pensado para el flujo masivo (1M+): el provider
     * acumula por pagina y delega aqui el insert batcheado.
     */
    @Override
    public void emitRecords(Collection<AuditEnvelope> envelopes) {
        if (!recordLevelEnabled || envelopes == null || envelopes.isEmpty()) {
            return;
        }
        try {
            auditSpoolWriter.writeBatch(envelopes);
        } catch (RuntimeException error) {
            handleAuditFailure(envelopes.size() + " record events", error);
        }
    }

    private String traceIdFor(Long processExecutionId) {
        return processExecutionId == null ? null : "exec-" + processExecutionId;
    }

    private void handleAuditFailure(String scope, RuntimeException error) {
        if (failBusinessOnError) {
            throw error;
        }
        LOG.warnf(error, "Audit emission failed for %s; business flow continues", scope);
    }
}
