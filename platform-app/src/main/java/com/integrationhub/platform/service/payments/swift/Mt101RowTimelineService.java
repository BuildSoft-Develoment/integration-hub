package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101ArchiveStatusRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingRecordRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Reconstruye la linea de tiempo E2E de una fila desde tablas operacionales. Es
 * instantanea y complementa el cold store asincrono de auditoria.
 */
@ApplicationScoped
public class Mt101RowTimelineService {

    private static final String DEFAULT_ARCHIVE_TABLE = "mt101_archive";
    private static final String DEFAULT_CONFIRMATION_TABLE = "mt101_confirmation";
    private static final String DEFAULT_RECONCILIATION_EXCEPTION_TABLE = "mt101_reconciliation_exception";

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101FailedRecordRepository failedRecordRepository;
    private final Mt101StagingRecordRepository stagingRepository;
    private final Mt101ArchiveStatusRepository archiveStatusRepository;

    @Inject
    public Mt101RowTimelineService(DataSource defaultDataSource,
                                   ConnectionPoolManager connectionPoolManager,
                                   Mt101FragmentRepository fragmentRepository,
                                   Mt101FailedRecordRepository failedRecordRepository,
                                   Mt101StagingRecordRepository stagingRepository,
                                   Mt101ArchiveStatusRepository archiveStatusRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.failedRecordRepository = failedRecordRepository;
        this.stagingRepository = stagingRepository;
        this.archiveStatusRepository = archiveStatusRepository;
    }

    public Mt101RowTimelineService(DataSource defaultDataSource,
                                   ConnectionPoolManager connectionPoolManager,
                                   Mt101FragmentRepository fragmentRepository,
                                   Mt101FailedRecordRepository failedRecordRepository,
                                   Mt101StagingRecordRepository stagingRepository) {
        this(defaultDataSource, connectionPoolManager, fragmentRepository, failedRecordRepository,
                stagingRepository, new Mt101ArchiveStatusRepository());
    }

    public List<Milestone> rowTimeline(String connectionRef, String fragmentSetId, String sourceFileHash, long recordNumber) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        if (sourceFileHash == null || sourceFileHash.isBlank()) {
            throw new IllegalArgumentException("sourceFileHash is required");
        }
        if (recordNumber < 1) {
            throw new IllegalArgumentException("recordNumber must be positive");
        }
        var set = fragmentSetId.trim();
        var hash = sourceFileHash.trim();
        var dataSource = resolveDataSource(connectionRef);
        try {
            var fragments = fragmentRepository.findBySourceRecord(dataSource, recordNumber, hash, null, null, set, 1);
            if (fragments.isEmpty()) {
                return List.of();
            }
            var fragment = fragments.get(0);
            var milestones = new ArrayList<Milestone>();

            var staging = fragment.processExecutionId() == null ? null
                    : stagingRepository.findStagingRow(dataSource, fragment.processExecutionId(), recordNumber - 1, hash);
            var stagingId = staging != null ? staging.id()
                    : (fragment.sourceRecordFrom() == null ? fragment.stagingIdFrom()
                            : fragment.stagingIdFrom() + (recordNumber - fragment.sourceRecordFrom()));
            milestones.add(new Milestone("RECORD_INGESTED", "INGESTED",
                    "fila " + recordNumber + " - staging id " + stagingId,
                    staging == null ? null : staging.createdAt()));

            milestones.add(new Milestone("RECORD_BUILT", "BUILT",
                    ":20: " + nullSafe(fragment.sendersReference())
                            + " - fragmento " + fragment.fragmentIndex() + "/" + fragment.fragmentTotal(),
                    fragment.createdAt()));

            // Lookup indexado por (set, fila exacta): no escanear las primeras 5000
            // cuarentenas (una fila mas alla del tope no mostraria su issue).
            for (var failed : failedRecordRepository.findBySourceRow(dataSource, set, hash, recordNumber, null, 50)) {
                milestones.add(new Milestone("RECORD_VALIDATION_ISSUE", "REJECTED",
                        nullSafe(failed.ruleCode())
                                + (failed.message() == null || failed.message().isBlank() ? "" : ": " + failed.message())
                                + (failed.transactionReference() == null ? "" : " - :21: " + failed.transactionReference()),
                        failed.createdAt()));
            }

            if (fragment.status() != null && !"BUILT".equalsIgnoreCase(fragment.status())) {
                milestones.add(new Milestone("RECORD_" + fragment.status().toUpperCase(),
                        fragment.status().toUpperCase(),
                        ":20: " + nullSafe(fragment.sendersReference())
                                + (fragment.errorMessage() == null || fragment.errorMessage().isBlank()
                                        ? "" : " - " + fragment.errorMessage()),
                        fragment.updatedAt()));
            }

            appendFinancialMilestones(dataSource, milestones, fragment);
            appendCorrectiveMilestones(dataSource, milestones, set, hash, recordNumber);
            return milestones;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot build operational row timeline for set " + set, error);
        }
    }

    private void appendCorrectiveMilestones(DataSource dataSource,
                                            List<Milestone> milestones,
                                            String originalSet,
                                            String sourceFileHash,
                                            long recordNumber) throws SQLException {
        var corrective = fragmentRepository.findCorrectiveByOriginalSourceRecord(
                dataSource, originalSet, sourceFileHash, recordNumber);
        if (corrective == null) {
            return;
        }
        addOnce(milestones, "CORRECTIVE_RECORD_BUILT", "BUILT",
                "correctivo " + corrective.fragmentSetId()
                        + " - :20: " + nullSafe(corrective.sendersReference())
                        + " - fragmento " + corrective.fragmentIndex() + "/" + corrective.fragmentTotal(),
                corrective.createdAt());
        if (corrective.status() != null && !"BUILT".equalsIgnoreCase(corrective.status())) {
            addOnce(milestones, "CORRECTIVE_RECORD_" + corrective.status().toUpperCase(),
                    corrective.status().toUpperCase(),
                    "correctivo " + corrective.fragmentSetId()
                            + " - :20: " + nullSafe(corrective.sendersReference())
                            + (corrective.errorMessage() == null || corrective.errorMessage().isBlank()
                                    ? "" : " - " + corrective.errorMessage()),
                    corrective.updatedAt());
        }
        appendFinancialMilestones(dataSource, milestones, corrective);
    }

    private void appendFinancialMilestones(DataSource dataSource,
                                           List<Milestone> milestones,
                                           Mt101FragmentRepository.FragmentLookupRow fragment) throws SQLException {
        var archive = archiveStatusRepository.findLatestBySendersReference(
                dataSource, DEFAULT_ARCHIVE_TABLE, fragment.sendersReference(), fragment.processExecutionId());
        if (archive == null) {
            return;
        }

        addOnce(milestones, "RECORD_ARCHIVED", "ARCHIVED",
                ":20: " + nullSafe(fragment.sendersReference()) + " - archive id " + archive.archiveId(),
                archive.createdAt());

        var confirmations = archiveStatusRepository.confirmationsByArchiveId(
                dataSource, DEFAULT_CONFIRMATION_TABLE, archive.archiveId(), 100);
        for (var confirmation : confirmations) {
            var stage = confirmationStage(confirmation.confirmedStatus());
            var status = "PAYMENT_STATUS_REJECTED".equals(stage) ? "REJECTED" : "CONFIRMED";
            milestones.add(new Milestone(stage, status,
                    nullSafe(confirmation.confirmationType())
                            + " " + nullSafe(confirmation.confirmedStatus())
                            + (confirmation.gatewayReference() == null || confirmation.gatewayReference().isBlank()
                                    ? "" : " - gateway " + confirmation.gatewayReference()),
                    confirmation.receivedAt()));
        }

        var archiveStatus = archive.status() == null ? "" : archive.status().toUpperCase();
        if ("SENT".equals(archiveStatus)) {
            addOnce(milestones, "RECORD_SENT", "SENT",
                    ":20: " + nullSafe(fragment.sendersReference()), archive.updatedAt());
        } else if (("CONFIRMED".equals(archiveStatus) || "REJECTED".equals(archiveStatus))
                && confirmations.isEmpty()) {
            addOnce(milestones, "PAYMENT_STATUS_" + archiveStatus, archiveStatus,
                    ":20: " + nullSafe(fragment.sendersReference()) + " - archive id " + archive.archiveId(),
                    archive.updatedAt());
        } else if ("RECONCILED".equals(archiveStatus)) {
            addOnce(milestones, "PAYMENT_RECONCILED", "RECONCILED",
                    ":20: " + nullSafe(fragment.sendersReference()) + " - archive id " + archive.archiveId(),
                    archive.updatedAt());
        } else if ("UNMATCHED".equals(archiveStatus)) {
            addOnce(milestones, "PAYMENT_UNMATCHED", "UNMATCHED",
                    ":20: " + nullSafe(fragment.sendersReference()) + " - archive id " + archive.archiveId(),
                    archive.updatedAt());
        }

        for (var exception : archiveStatusRepository.reconciliationExceptionsByArchiveId(
                dataSource, DEFAULT_RECONCILIATION_EXCEPTION_TABLE, archive.archiveId(), 100)) {
            milestones.add(new Milestone("PAYMENT_UNMATCHED", "UNMATCHED",
                    nullSafe(exception.exceptionType())
                            + (exception.details() == null || exception.details().isBlank()
                                    ? "" : " - " + exception.details()),
                    exception.asOfDate() == null ? exception.resolvedAt() : exception.asOfDate().atStartOfDay()));
        }
    }

    private String confirmationStage(String confirmedStatus) {
        var normalized = confirmedStatus == null ? "" : confirmedStatus.toUpperCase();
        return switch (normalized) {
            case "RJCT", "REJECTED", "ERROR", "FAILED" -> "PAYMENT_STATUS_REJECTED";
            default -> "PAYMENT_STATUS_CONFIRMED";
        };
    }

    private void addOnce(List<Milestone> milestones,
                         String stage,
                         String status,
                         String detail,
                         LocalDateTime eventTs) {
        for (var milestone : milestones) {
            if (stage.equals(milestone.stage()) && status.equals(milestone.status())) {
                return;
            }
        }
        milestones.add(new Milestone(stage, status, detail, eventTs));
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String nullSafe(String value) {
        return value == null ? "-" : value;
    }

    public record Milestone(String stage, String status, String detail, LocalDateTime eventTs) {
    }
}
