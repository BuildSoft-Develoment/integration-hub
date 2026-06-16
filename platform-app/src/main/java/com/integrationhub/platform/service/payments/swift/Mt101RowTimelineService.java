package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Reconstruye la linea de tiempo E2E de una fila del archivo desde las tablas
 * <b>operacionales</b> (staging / mt101_build_fragment / mt101_failed_record), de
 * forma <b>instantanea</b> y siempre actual — sin depender del store frio asincrono.
 * Complementa el visor de lineage (cold store) que lleva los timestamps por evento
 * pero puede ir con lag.
 */
@ApplicationScoped
public class Mt101RowTimelineService {

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101FailedRecordRepository failedRecordRepository;

    public Mt101RowTimelineService(DataSource defaultDataSource,
                                   ConnectionPoolManager connectionPoolManager,
                                   Mt101FragmentRepository fragmentRepository,
                                   Mt101FailedRecordRepository failedRecordRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.failedRecordRepository = failedRecordRepository;
    }

    public List<Milestone> rowTimeline(String connectionRef, String fragmentSetId, long recordNumber) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        if (recordNumber < 1) {
            throw new IllegalArgumentException("recordNumber must be positive");
        }
        var set = fragmentSetId.trim();
        var dataSource = resolveDataSource(connectionRef);
        try {
            var fragments = fragmentRepository.findBySourceRow(dataSource, recordNumber, null, null, null, set, 1);
            if (fragments.isEmpty()) {
                return List.of();
            }
            var fragment = fragments.get(0);
            var milestones = new ArrayList<Milestone>();

            // INGESTED: la fila origen entro a staging. id tecnico exacto = stagingIdFrom
            // + offset dentro del fragmento (filas contiguas por keyset).
            var stagingId = fragment.sourceRecordFrom() == null
                    ? fragment.stagingIdFrom()
                    : fragment.stagingIdFrom() + (recordNumber - fragment.sourceRecordFrom());
            milestones.add(new Milestone("RECORD_INGESTED", "INGESTED",
                    "fila " + recordNumber + " · staging id " + stagingId));

            // BUILT: la fila se fragmento en un MT101.
            milestones.add(new Milestone("RECORD_BUILT", "BUILT",
                    ":20: " + nullSafe(fragment.sendersReference())
                            + " · fragmento " + fragment.fragmentIndex() + "/" + fragment.fragmentTotal()));

            // VALIDATION_ISSUE: regla(s) que fallaron exactamente en esta fila.
            for (var failed : failedRecordRepository.findBySet(dataSource, set, null, 5000)) {
                if (failed.sourceRecordNumber() != null && failed.sourceRecordNumber() == recordNumber) {
                    milestones.add(new Milestone("RECORD_VALIDATION_ISSUE", "REJECTED",
                            nullSafe(failed.ruleCode())
                                    + (failed.message() == null || failed.message().isBlank() ? "" : ": " + failed.message())
                                    + (failed.transactionReference() == null ? "" : " · :21: " + failed.transactionReference())));
                }
            }

            // Estado actual del fragmento (terminal): VALIDATED/ARCHIVED/SENT/REJECTED/SUPERSEDED.
            if (fragment.status() != null && !"BUILT".equalsIgnoreCase(fragment.status())) {
                milestones.add(new Milestone("RECORD_" + fragment.status().toUpperCase(), fragment.status().toUpperCase(),
                        ":20: " + nullSafe(fragment.sendersReference())
                                + (fragment.errorMessage() == null || fragment.errorMessage().isBlank()
                                        ? "" : " · " + fragment.errorMessage())));
            }
            return milestones;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot build operational row timeline for set " + set, error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    private String nullSafe(String value) {
        return value == null ? "—" : value;
    }

    public record Milestone(String stage, String status, String detail) {
    }
}
