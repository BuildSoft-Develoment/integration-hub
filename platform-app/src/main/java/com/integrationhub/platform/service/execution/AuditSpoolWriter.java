package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.entity.AuditSpool;
import com.integrationhub.platform.repository.AuditSpoolRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;

/**
 * Writer transaccional real del outbox de auditoria. Vive separado de
 * {@link AuditService} para evitar self-invocation y asegurar que
 * {@code REQUIRES_NEW} pase por el proxy CDI.
 */
@ApplicationScoped
public class AuditSpoolWriter {

    private static final int MAX_PARTITION_KEY_LENGTH = 120;

    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final AuditSpoolRepository auditSpoolRepository;
    private final String topic;

    public AuditSpoolWriter(JsonConfigurationMapper jsonConfigurationMapper,
                            AuditSpoolRepository auditSpoolRepository,
                            @ConfigProperty(name = "audit.topic", defaultValue = "audit-events") String topic) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.auditSpoolRepository = auditSpoolRepository;
        this.topic = topic;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void write(AuditEnvelope envelope) {
        auditSpoolRepository.persist(row(envelope));
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void writeBatch(Collection<AuditEnvelope> envelopes) {
        if (envelopes == null || envelopes.isEmpty()) {
            return;
        }
        var rows = new ArrayList<AuditSpool>(envelopes.size());
        for (var envelope : envelopes) {
            rows.add(row(envelope));
        }
        auditSpoolRepository.persistBatch(rows);
    }

    /**
     * Atomicidad: escribe las tramas en el spool <b>dentro de una {@code Connection}/transacción existente</b> (no abre
     * tx propia, a diferencia de {@link #writeBatch(Collection)} que usa {@code REQUIRES_NEW}). El caller es dueño del
     * {@code commit}/{@code rollback}: la trama de auditoría y la mutación de negocio commitean juntas o no commitean —
     * usado por acciones gobernadas (p. ej. acknowledge de PAY conflicts) donde perder la trama sería un hueco de
     * auditoría. Reusa {@link #row(AuditEnvelope)} (misma serialización JSON, partition key y {@code spool_status}).
     */
    public void writeBatch(Connection connection, Collection<AuditEnvelope> envelopes) throws SQLException {
        if (envelopes == null || envelopes.isEmpty()) {
            return;
        }
        var sql = "insert into audit_spool (event_id, trace_id, topic, partition_key, payload, spool_status) "
                + "values (?, ?, ?, ?, ?, ?)";
        try (var statement = connection.prepareStatement(sql)) {
            for (var envelope : envelopes) {
                var row = row(envelope);
                statement.setString(1, row.eventId);
                statement.setString(2, row.traceId);
                statement.setString(3, row.topic);
                statement.setString(4, row.partitionKey);
                statement.setString(5, row.payload);
                statement.setString(6, row.spoolStatus);
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private AuditSpool row(AuditEnvelope envelope) {
        var row = new AuditSpool();
        row.eventId = envelope.eventId();
        row.traceId = envelope.traceId();
        row.topic = topic;
        row.partitionKey = partitionKey(envelope);
        row.payload = jsonConfigurationMapper.toJson(envelope);
        row.spoolStatus = AuditSpool.PENDING;
        return row;
    }

    private String partitionKey(AuditEnvelope envelope) {
        if (envelope.level() == AuditLevel.RECORD) {
            return bounded(firstNonBlank(
                    envelope.recordId(),
                    envelope.paymentReference(),
                    envelope.transactionReference(),
                    envelope.businessKeyHash(),
                    envelope.traceId(),
                    envelope.eventId()));
        }
        return bounded(firstNonBlank(envelope.traceId(), envelope.eventId()));
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (var value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String bounded(String value) {
        if (value == null || value.length() <= MAX_PARTITION_KEY_LENGTH) {
            return value;
        }
        return "sha256:" + sha256(value);
    }

    private String sha256(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is not available", error);
        }
    }
}
