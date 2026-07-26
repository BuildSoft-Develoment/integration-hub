package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingRecordRepository.StagingPayload;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.payments.swift.Mt101CorrectionSheetService.SheetRow;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.io.InputStream;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

/**
 * ADR-020 (C2/C3): import de la PLANILLA DE CORRECCION. La planilla que exporto C1 se re-sube; cada fila se
 * matchea por {@code _stagingId} y se computa el merge-patch (solo campos cambiados) contra el payload actual.
 *
 * <p>El PARSEO del XLSX lo hace el dueno del formato ({@link Mt101CorrectionSheetService#parseSheet}); este
 * servicio solo CLASIFICA (SRP). <b>C2 (preview / dry-run):</b> READ-ONLY — clasifica cada fila en
 * TO_CORRECT / UNCHANGED / CONFLICT (motivo: NO_STAGING_ID / NOT_FOUND / ALREADY_SENT / STALE_VERSION) sin mutar
 * nada. El LOCK por rebuild activo y la validacion de pertenencia REJECTED se aplican de forma autoritativa en el
 * apply (C3).
 */
@ApplicationScoped
public class Mt101BulkCorrectionService {

    /** Estados de fragmento enviados/cerrados: no se corrigen (reusa el invariante de {@link Mt101ReprocessService}). */
    static final Set<String> NON_REPROCESSABLE = Set.of("SENT", "CONFIRMED", "RECONCILED", "SUPERSEDED");

    private static final int SAMPLE = 100;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101StagingRecordRepository stagingRepository;
    private final Mt101FragmentRepository fragmentRepository;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final Mt101CorrectionSheetService sheetService;

    @Inject
    public Mt101BulkCorrectionService(DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager,
                                      Mt101StagingRecordRepository stagingRepository,
                                      Mt101FragmentRepository fragmentRepository,
                                      JsonConfigurationMapper jsonConfigurationMapper,
                                      Mt101CorrectionSheetService sheetService) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.stagingRepository = stagingRepository;
        this.fragmentRepository = fragmentRepository;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.sheetService = sheetService;
    }

    public void validate(String fragmentSetId) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
    }

    /** C2: dry-run de la planilla — clasifica cada fila sin mutar nada. */
    public PreviewResult preview(String connectionRef, String fragmentSetId, InputStream xlsx) {
        validate(fragmentSetId);
        var set = fragmentSetId.trim();
        var sheetRows = sheetService.parseSheet(xlsx);
        var dataSource = resolveDataSource(connectionRef);

        // Batch: payloads actuales por stagingId + estados de fragmento por :20: (evita N idas a la BD).
        var stagingIds = new LinkedHashSet<Long>();
        var references = new LinkedHashSet<String>();
        var editableColumns = new LinkedHashSet<String>();
        for (var row : sheetRows) {
            var id = row.longValue(Mt101CorrectionSheetService.COL_STAGING_ID);
            if (id != null) {
                stagingIds.add(id);
            }
            var ref = row.stringValue(Mt101CorrectionSheetService.COL_SENDERS_REFERENCE);
            if (ref != null && !ref.isBlank()) {
                references.add(ref);
            }
            editableColumns.addAll(row.editableKeys());
        }

        Map<Long, StagingPayload> payloads;
        Map<String, String> fragmentStatuses;
        try {
            payloads = stagingRepository.withConnection(dataSource,
                    connection -> stagingRepository.findStagingPayloadsByIds(connection, stagingIds));
            fragmentStatuses = fragmentRepository.statusesByReferences(dataSource, set, references);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read current state for correction preview of set " + set, error);
        }

        var result = new PreviewResult(new ArrayList<>(editableColumns));
        for (var row : sheetRows) {
            result.add(classify(row, payloads, fragmentStatuses));
        }
        return result;
    }

    private PreviewRow classify(SheetRow row, Map<Long, StagingPayload> payloads, Map<String, String> statuses) {
        var stagingId = row.longValue(Mt101CorrectionSheetService.COL_STAGING_ID);
        var recordNumber = row.longValue(Mt101CorrectionSheetService.COL_RECORD_NUMBER);
        var reference = row.stringValue(Mt101CorrectionSheetService.COL_SENDERS_REFERENCE);
        if (stagingId == null) {
            return PreviewRow.conflict(null, recordNumber, reference, "NO_STAGING_ID", List.of());
        }
        var current = payloads.get(stagingId);
        if (current == null) {
            return PreviewRow.conflict(stagingId, recordNumber, reference, "NOT_FOUND", List.of());
        }
        var status = reference == null ? null : statuses.get(reference);
        if (status != null && NON_REPROCESSABLE.contains(status.toUpperCase())) {
            return PreviewRow.conflict(stagingId, recordNumber, reference, "ALREADY_SENT", List.of());
        }
        var expectedVersion = row.longValue(Mt101CorrectionSheetService.COL_VERSION);
        if (expectedVersion != null && current.version() != expectedVersion) {
            return PreviewRow.conflict(stagingId, recordNumber, reference, "STALE_VERSION", List.of());
        }
        var changed = changedFields(current.payloadJson(), row);
        if (changed.isEmpty()) {
            return PreviewRow.unchanged(stagingId, recordNumber, reference);
        }
        return PreviewRow.toCorrect(stagingId, recordNumber, reference, changed);
    }

    /** Campos editables cuyo valor de la planilla difiere del payload actual (merge-patch efectivo). */
    private List<String> changedFields(String currentPayloadJson, SheetRow row) {
        Map<String, Object> current = currentPayloadJson == null || currentPayloadJson.isBlank()
                ? Map.of()
                : jsonConfigurationMapper.toMap(currentPayloadJson);
        var changed = new ArrayList<String>();
        for (var key : row.editableKeys()) {
            var sheetValue = row.stringValue(key);
            var currentValue = current.get(key);
            var currentString = currentValue == null ? "" : String.valueOf(currentValue);
            if (!Objects.equals(sheetValue == null ? "" : sheetValue, currentString)) {
                changed.add(key);
            }
        }
        return changed;
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    // ------------------------------------------------------------------ tipos

    /** Resultado agregado del dry-run: conteos + muestra de las primeras {@value #SAMPLE} filas. */
    public static final class PreviewResult {
        private final List<String> editableColumns;
        private final List<PreviewRow> sample = new ArrayList<>();
        private int total;
        private int toCorrect;
        private int unchanged;
        private int conflicts;

        PreviewResult(List<String> editableColumns) {
            this.editableColumns = editableColumns;
        }

        void add(PreviewRow row) {
            total++;
            switch (row.outcome()) {
                case "TO_CORRECT" -> toCorrect++;
                case "UNCHANGED" -> unchanged++;
                default -> conflicts++;
            }
            if (sample.size() < SAMPLE) {
                sample.add(row);
            }
        }

        public List<String> editableColumns() {
            return editableColumns;
        }

        public List<PreviewRow> sample() {
            return sample;
        }

        public int total() {
            return total;
        }

        public int toCorrect() {
            return toCorrect;
        }

        public int unchanged() {
            return unchanged;
        }

        public int conflicts() {
            return conflicts;
        }
    }

    /** Clasificacion de una fila del dry-run. */
    public record PreviewRow(Long stagingId, Long recordNumber, String sendersReference, String outcome,
                             String reason, List<String> changedFields) {
        static PreviewRow toCorrect(Long stagingId, Long recordNumber, String ref, List<String> changed) {
            return new PreviewRow(stagingId, recordNumber, ref, "TO_CORRECT", null,
                    List.copyOf(new TreeSet<>(changed)));
        }

        static PreviewRow unchanged(Long stagingId, Long recordNumber, String ref) {
            return new PreviewRow(stagingId, recordNumber, ref, "UNCHANGED", null, List.of());
        }

        static PreviewRow conflict(Long stagingId, Long recordNumber, String ref, String reason, List<String> changed) {
            return new PreviewRow(stagingId, recordNumber, ref, "CONFLICT", reason, List.copyOf(changed));
        }
    }
}
