package com.integrationhub.platform.service.payments.swift;

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
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Construye la cuarentena por fila a partir de los issues de validacion ya
 * persistidos: para cada {@code :21:} fallido resuelve su <b>fila exacta</b> del
 * archivo via {@code mt101_fragment_record}, y la encola en
 * {@code mt101_failed_record}. Asi el operador corrige y reprocesa solo esas filas
 * sin regenerar el lote. Orquesta; el SQL vive en los repositorios (ADR-011).
 */
@ApplicationScoped
public class Mt101QuarantineService {

    private static final String DEFAULT_ISSUE_TABLE = "mt101_validation_issue";
    private static final int ISSUE_PAGE_SIZE = 1000;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101ValidationIssueRepository issueRepository;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101FailedRecordRepository failedRecordRepository;
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
            var metadata = fragmentRepository.findSetMetadata(dataSource, set);
            var processExecutionId = metadata == null ? null : metadata.processExecutionId();
            var insertedTotal = 0;
            var afterId = 0L;
            while (true) {
                var issues = issueRepository.findBySetPage(dataSource, table, set, afterId, ISSUE_PAGE_SIZE);
                if (issues.isEmpty()) {
                    return insertedTotal;
                }
                var transactionKeys = transactionKeys(issues);
                var lineageByTransaction = fragmentRepository.fragmentRecordLineageByTransactions(
                        dataSource, set, transactionKeys);
                var rows = new ArrayList<Mt101FailedRecordRepository.FailedRecordRow>(issues.size());
                var events = new ArrayList<AuditEnvelope>(issues.size());
                for (var issue : issues) {
                    afterId = issue.id() == null ? afterId : issue.id();
                    var lineage = lineage(issue, lineageByTransaction);
                    if (lineage == null || lineage.sourceFileHash() == null || lineage.sourceFileHash().isBlank()
                            || lineage.sourceRecordNumber() == null) {
                        throw new IllegalArgumentException("cannot quarantine MT101 issue "
                                + (issue.id() == null ? "<unknown>" : issue.id())
                                + " in set " + set
                                + "; exact mt101_fragment_record lineage by :20:/:21: is required");
                    }
                    rows.add(new Mt101FailedRecordRepository.FailedRecordRow(
                            set,
                            issue.sendersReference(),
                            issue.transactionReference(),
                            lineage.sourceFileHash(),
                            lineage.sourceRecordNumber(),
                            issue.ruleCode(),
                            issue.ruleSet(),
                            issue.severity(),
                            issue.message()));
                    events.add(issueEvent(set, processExecutionId,
                            lineage.sourceFileHash(), lineage.sourceRecordNumber(), issue));
                }
                insertedTotal += failedRecordRepository.insertBatch(dataSource, rows);
                // RECORD_VALIDATION_ISSUE con clave de negocio (sourceFileHash + fila + :20: + :21:):
                // el visor de lineage por fila muestra la regla que fallo, no solo la timeline.
                // eventId determinista -> el cold store dedup re-ejecuciones de la cuarentena.
                emitRecords(events);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot build MT101 quarantine for set " + set, error);
        }
    }

    public List<Mt101FailedRecordRepository.FailedRecord> list(String connectionRef,
                                                               String fragmentSetId,
                                                               String status,
                                                               int limit) {
        return list(connectionRef, fragmentSetId, status, 0L, limit);
    }

    public List<Mt101FailedRecordRepository.FailedRecord> list(String connectionRef,
                                                               String fragmentSetId,
                                                               String status,
                                                               long afterId,
                                                               int limit) {
        return list(connectionRef, fragmentSetId, status, null, null, null, null, null, afterId, limit);
    }

    public List<Mt101FailedRecordRepository.FailedRecord> list(String connectionRef,
                                                               String fragmentSetId,
                                                               String status,
                                                               String sourceFileHash,
                                                               Long sourceRecordNumber,
                                                               String ruleCode,
                                                               String sendersReference,
                                                               String transactionReference,
                                                               long afterId,
                                                               int limit) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        try {
            return failedRecordRepository.findBySetPage(resolveDataSource(connectionRef), fragmentSetId.trim(),
                    blankToNull(status), blankToNull(sourceFileHash), sourceRecordNumber,
                    blankToNull(ruleCode), blankToNull(sendersReference), blankToNull(transactionReference),
                    Math.max(afterId, 0L), Math.min(Math.max(limit, 1), 5000));
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot list MT101 quarantine for set " + fragmentSetId, error);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private List<Mt101FragmentRepository.TransactionKey> transactionKeys(
            List<Mt101ValidationIssueRepository.IssueRecord> issues) {
        var keys = new ArrayList<Mt101FragmentRepository.TransactionKey>();
        for (var issue : issues) {
            if (issue.sendersReference() != null && !issue.sendersReference().isBlank()
                    && issue.transactionReference() != null && !issue.transactionReference().isBlank()) {
                keys.add(new Mt101FragmentRepository.TransactionKey(
                        issue.sendersReference(), issue.transactionReference()));
            }
        }
        return keys;
    }

    private Mt101FragmentRepository.FragmentRecordLineage lineage(
            Mt101ValidationIssueRepository.IssueRecord issue,
            Map<Mt101FragmentRepository.TransactionKey, Mt101FragmentRepository.FragmentRecordLineage> lineageByTransaction) {
        if (issue.transactionReference() == null || issue.transactionReference().isBlank()) {
            return null;
        }
        var key = new Mt101FragmentRepository.TransactionKey(issue.sendersReference(), issue.transactionReference());
        var lineage = lineageByTransaction.get(key);
        if (lineage == null) {
            throw new IllegalStateException("Cannot resolve MT101 fragment record lineage for set issue "
                    + issue.sendersReference() + "/" + issue.transactionReference()
                    + ". mt101_fragment_record is required; previous data is not corrected automatically.");
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

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }
}
