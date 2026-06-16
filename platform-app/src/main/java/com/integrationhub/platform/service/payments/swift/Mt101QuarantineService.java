package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101ValidationIssueRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Construye la cuarentena por fila a partir de los issues de validacion ya
 * persistidos: para cada {@code :21:} fallido resuelve su <b>fila exacta</b> del
 * archivo via el mapeo {@code source_records_json} del fragmento, y la encola en
 * {@code mt101_failed_record}. Asi el operador corrige y reprocesa solo esas filas
 * sin regenerar el lote. Orquesta; el SQL vive en los repositorios (ADR-011).
 */
@ApplicationScoped
public class Mt101QuarantineService {

    private static final String DEFAULT_ISSUE_TABLE = "mt101_validation_issue";

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101ValidationIssueRepository issueRepository;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101FailedRecordRepository failedRecordRepository;
    private final ObjectMapper objectMapper;
    private final RecordAuditEmitter recordAuditEmitter;

    @Inject
    public Mt101QuarantineService(DataSource defaultDataSource,
                                  ConnectionPoolManager connectionPoolManager,
                                  Mt101ValidationIssueRepository issueRepository,
                                  Mt101FragmentRepository fragmentRepository,
                                  Mt101FailedRecordRepository failedRecordRepository,
                                  ObjectMapper objectMapper,
                                  RecordAuditEmitter recordAuditEmitter) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.issueRepository = issueRepository;
        this.fragmentRepository = fragmentRepository;
        this.failedRecordRepository = failedRecordRepository;
        this.objectMapper = objectMapper;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    /** Conveniencia para tests sin auditoria (la emision es un enriquecimiento opcional). */
    public Mt101QuarantineService(DataSource defaultDataSource,
                                  ConnectionPoolManager connectionPoolManager,
                                  Mt101ValidationIssueRepository issueRepository,
                                  Mt101FragmentRepository fragmentRepository,
                                  Mt101FailedRecordRepository failedRecordRepository,
                                  ObjectMapper objectMapper) {
        this(defaultDataSource, connectionPoolManager, issueRepository, fragmentRepository,
                failedRecordRepository, objectMapper, null);
    }

    /**
     * Encola en cuarentena las filas fallidas de un set resolviendo el {@code :21:}
     * a su fila exacta. Idempotente: re-ejecutar no duplica.
     *
     * @return cuantas filas nuevas se encolaron.
     */
    public int quarantineFromIssues(String connectionRef, String fragmentSetId, String issueTable) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        var set = fragmentSetId.trim();
        var table = issueTable == null || issueTable.isBlank() ? DEFAULT_ISSUE_TABLE : issueTable.trim();
        var dataSource = resolveDataSource(connectionRef);
        try {
            var issues = issueRepository.findBySet(dataSource, table, set);
            if (issues.isEmpty()) {
                return 0;
            }
            var lineageByReference = lineageByReference(dataSource, set);
            var metadata = fragmentRepository.findSetMetadata(dataSource, set);
            var processExecutionId = metadata == null ? null : metadata.processExecutionId();
            var rows = new ArrayList<Mt101FailedRecordRepository.FailedRecordRow>(issues.size());
            var events = new ArrayList<AuditEnvelope>(issues.size());
            for (var issue : issues) {
                var lineage = lineageByReference.get(issue.sendersReference());
                String sourceFileHash = lineage == null ? null : lineage.sourceFileHash();
                Long recordNumber = null;
                if (lineage != null && issue.transactionReference() != null) {
                    recordNumber = lineage.recordByTransaction().get(issue.transactionReference());
                }
                rows.add(new Mt101FailedRecordRepository.FailedRecordRow(
                        set,
                        issue.sendersReference(),
                        issue.transactionReference(),
                        sourceFileHash,
                        recordNumber,
                        issue.ruleCode(),
                        issue.ruleSet(),
                        issue.severity(),
                        issue.message()));
                events.add(issueEvent(set, processExecutionId, sourceFileHash, recordNumber, issue));
            }
            var inserted = failedRecordRepository.insertBatch(dataSource, rows);
            // RECORD_VALIDATION_ISSUE con clave de negocio (sourceFileHash + fila + :20: + :21:):
            // el visor de lineage por fila muestra la regla que fallo, no solo la timeline.
            // eventId determinista -> el cold store dedup re-ejecuciones de la cuarentena.
            emitRecords(events);
            return inserted;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot build MT101 quarantine for set " + set, error);
        }
    }

    public List<Mt101FailedRecordRepository.FailedRecord> list(String connectionRef,
                                                               String fragmentSetId,
                                                               String status,
                                                               int limit) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        try {
            return failedRecordRepository.findBySet(resolveDataSource(connectionRef), fragmentSetId.trim(),
                    status, Math.min(Math.max(limit, 1), 5000));
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot list MT101 quarantine for set " + fragmentSetId, error);
        }
    }

    private Map<String, Lineage> lineageByReference(DataSource dataSource, String fragmentSetId) throws SQLException {
        var lineage = new LinkedHashMap<String, Lineage>();
        for (var fragment : fragmentRepository.findSourceRecordsBySet(dataSource, fragmentSetId)) {
            lineage.put(fragment.sendersReference(),
                    new Lineage(fragment.sourceFileHash(), parseRecords(fragment.sourceRecordsJson())));
        }
        return lineage;
    }

    /**
     * Trama RECORD_VALIDATION_ISSUE con la clave de negocio completa. {@code eventId}
     * determinista por (set, :20:, :21:, regla) para que el cold store dedup las
     * re-ejecuciones de la cuarentena.
     */
    private AuditEnvelope issueEvent(String fragmentSetId,
                                     Long processExecutionId,
                                     String sourceFileHash,
                                     Long recordNumber,
                                     Mt101ValidationIssueRepository.IssueRecord issue) {
        var seed = fragmentSetId + "|" + nullSafe(issue.sendersReference())
                + "|" + nullSafe(issue.transactionReference()) + "|" + nullSafe(issue.ruleCode());
        var eventId = UUID.nameUUIDFromBytes(seed.getBytes(StandardCharsets.UTF_8)).toString();
        var message = nullSafe(issue.ruleCode())
                + (issue.message() == null || issue.message().isBlank() ? "" : ": " + issue.message());
        return new AuditEnvelope(
                eventId,
                processExecutionId == null ? null : "exec-" + processExecutionId,
                issue.sendersReference(),
                AuditLevel.RECORD,
                "RECORD_VALIDATION_ISSUE",
                "REJECTED",
                processExecutionId,
                null,
                message,
                null,
                Map.of(),
                "SWIFT",
                "MT101",
                null,
                sourceFileHash,
                recordNumber,
                null,
                null,
                issue.sendersReference(),
                issue.transactionReference(),
                null,
                null,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }

    private void emitRecords(List<AuditEnvelope> events) {
        if (recordAuditEmitter != null && !events.isEmpty()) {
            recordAuditEmitter.emitRecords(events);
        }
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private Map<String, Long> parseRecords(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Long>>() {});
        } catch (Exception error) {
            // Sin fallback: el mapeo lo escribe el build; si esta corrupto es un error
            // de integridad que debe surgir, no quedarse silenciado.
            throw new IllegalStateException("Corrupt source_records_json mapping in MT101 fragment lineage", error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private record Lineage(String sourceFileHash, Map<String, Long> recordByTransaction) {
    }
}
