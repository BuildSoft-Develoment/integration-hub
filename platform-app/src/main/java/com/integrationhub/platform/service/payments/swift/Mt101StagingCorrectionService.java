package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingRecordRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Corrige el payload de una fila de staging fallida desde la API/UI (sin tocar la
 * BD a mano), paso previo al rebuild correctivo. Resuelve la ejecucion por
 * {@code fragmentSetId} y audita la correccion ({@code STAGING_ROW_CORRECTED}).
 * Orquesta; el SQL vive en los repositorios (ADR-011).
 */
@ApplicationScoped
public class Mt101StagingCorrectionService {

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101StagingRecordRepository stagingRepository;
    private final RecordAuditEmitter recordAuditEmitter;

    @Inject
    public Mt101StagingCorrectionService(DataSource defaultDataSource,
                                         ConnectionPoolManager connectionPoolManager,
                                         Mt101FragmentRepository fragmentRepository,
                                         Mt101StagingRecordRepository stagingRepository,
                                         RecordAuditEmitter recordAuditEmitter) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.stagingRepository = stagingRepository;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    /** Conveniencia para tests sin auditoria. */
    public Mt101StagingCorrectionService(DataSource defaultDataSource,
                                         ConnectionPoolManager connectionPoolManager,
                                         Mt101FragmentRepository fragmentRepository,
                                         Mt101StagingRecordRepository stagingRepository) {
        this(defaultDataSource, connectionPoolManager, fragmentRepository, stagingRepository, null);
    }

    public CorrectionResult correctRow(String connectionRef, String fragmentSetId, long recordNumber, String payloadJson) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        if (recordNumber < 1) {
            throw new IllegalArgumentException("recordNumber must be positive");
        }
        if (payloadJson == null || payloadJson.isBlank()) {
            throw new IllegalArgumentException("payload is required");
        }
        var set = fragmentSetId.trim();
        var dataSource = resolveDataSource(connectionRef);
        try {
            var ref = fragmentRepository.loteRef(dataSource, set, null);
            if (ref == null || ref.processExecutionId() == null) {
                throw new IllegalArgumentException("cannot resolve execution for fragment set " + set);
            }
            var updated = stagingRepository.updatePayload(dataSource, ref.processExecutionId(), recordNumber - 1, payloadJson);
            if (updated == 0) {
                // Sin fallback: si la fila no existe, no se inventa una correccion.
                throw new IllegalArgumentException("no staging row at file row " + recordNumber + " for set " + set);
            }
            emit(set, ref.processExecutionId(), ref.sourceFileHash(), recordNumber);
            return new CorrectionResult(set, recordNumber, updated);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot correct staging row " + recordNumber + " for set " + set, error);
        }
    }

    private void emit(String fragmentSetId, Long processExecutionId, String sourceFileHash, long recordNumber) {
        if (recordAuditEmitter == null) {
            return;
        }
        var envelope = new AuditEnvelope(
                UUID.randomUUID().toString(),
                processExecutionId == null ? null : "exec-" + processExecutionId,
                fragmentSetId + ":" + recordNumber,
                AuditLevel.RECORD,
                "STAGING_ROW_CORRECTED",
                "CORRECTED",
                processExecutionId,
                null,
                "fila " + recordNumber + " corregida en staging para rebuild correctivo",
                null,
                Map.of(),
                "SWIFT",
                "MT101",
                null,
                sourceFileHash,
                recordNumber,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
        recordAuditEmitter.emitRecords(List.of(envelope));
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    public record CorrectionResult(String fragmentSetId, long recordNumber, int updated) {
    }
}
