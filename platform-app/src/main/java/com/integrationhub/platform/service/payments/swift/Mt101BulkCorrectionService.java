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
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
 * servicio CLASIFICA (preview) y ORQUESTA el apply, pero la mutacion money-safe por fila la delega en
 * {@link Mt101StagingCorrectionService#correctRow} (SRP). <b>C2 (preview / dry-run):</b> READ-ONLY — clasifica
 * cada fila en TO_CORRECT / UNCHANGED / CONFLICT (motivo: NO_STAGING_ID / NOT_FOUND / ALREADY_SENT /
 * STALE_VERSION) sin mutar nada.
 *
 * <p><b>C3 (apply):</b> aplica el merge-patch de las filas TO_CORRECT reusando {@code correctRow} — que es el
 * UNICO camino money-safe: re-resuelve la pertenencia REJECTED, re-chequea el lock por rebuild activo
 * (maker-checker), aplica locking optimista por {@code _version} y AUDITA cada fila. La clasificacion en batch es
 * solo un pre-filtro; {@code correctRow} vuelve a validar de forma autoritativa (sin ventana TOCTOU sobre el
 * dinero). Es per-fila transaccional: una fila que falla se REPORTA como omitida/fallida y no aborta el lote. La
 * correccion es preparacion de datos (no mueve dinero); el gate maker-checker del dinero es el REBUILD posterior.
 */
@ApplicationScoped
public class Mt101BulkCorrectionService {

    /** Estados de fragmento enviados/cerrados: no se corrigen (reusa el invariante de {@link Mt101ReprocessService}). */
    static final Set<String> NON_REPROCESSABLE = Set.of("SENT", "CONFIRMED", "RECONCILED", "SUPERSEDED");

    private static final int SAMPLE = 100;

    /** Tope de filas problematicas (omitidas + fallidas) que se devuelven en detalle; el resto se cuenta, no se lista. */
    private static final int MAX_ISSUES = 500;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101StagingRecordRepository stagingRepository;
    private final Mt101FragmentRepository fragmentRepository;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final Mt101CorrectionSheetService sheetService;
    private final Mt101StagingCorrectionService correctionService;

    @Inject
    public Mt101BulkCorrectionService(DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager,
                                      Mt101StagingRecordRepository stagingRepository,
                                      Mt101FragmentRepository fragmentRepository,
                                      JsonConfigurationMapper jsonConfigurationMapper,
                                      Mt101CorrectionSheetService sheetService,
                                      Mt101StagingCorrectionService correctionService) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.stagingRepository = stagingRepository;
        this.fragmentRepository = fragmentRepository;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.sheetService = sheetService;
        this.correctionService = correctionService;
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

    /**
     * C3: aplica la planilla. Clasifica igual que el preview (batch, pre-filtro) y para cada fila TO_CORRECT delega
     * en {@code correctRow} (money-safe: re-valida REJECTED + lock + version y audita). Per-fila transaccional: una
     * fila fallida se reporta, no aborta el lote. {@code reason} es obligatorio (gobernanza de una mutacion masiva).
     */
    public ApplyResult apply(String connectionRef, String fragmentSetId, InputStream xlsx,
                             String correctedBy, String reason, String ticketRef) {
        validate(fragmentSetId);
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("reason is required for a bulk correction");
        }
        var set = fragmentSetId.trim();
        var sheetRows = sheetService.parseSheet(xlsx);
        var dataSource = resolveDataSource(connectionRef);

        var stagingIds = new LinkedHashSet<Long>();
        var references = new LinkedHashSet<String>();
        for (var row : sheetRows) {
            var id = row.longValue(Mt101CorrectionSheetService.COL_STAGING_ID);
            if (id != null) {
                stagingIds.add(id);
            }
            var ref = row.stringValue(Mt101CorrectionSheetService.COL_SENDERS_REFERENCE);
            if (ref != null && !ref.isBlank()) {
                references.add(ref);
            }
        }

        Map<Long, StagingPayload> payloads;
        Map<String, String> fragmentStatuses;
        try {
            payloads = stagingRepository.withConnection(dataSource,
                    connection -> stagingRepository.findStagingPayloadsByIds(connection, stagingIds));
            fragmentStatuses = fragmentRepository.statusesByReferences(dataSource, set, references);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read current state for correction apply of set " + set, error);
        }

        var result = new ApplyResult();
        for (var row : sheetRows) {
            var classified = classify(row, payloads, fragmentStatuses);
            switch (classified.outcome()) {
                case "UNCHANGED" -> result.addUnchanged(classified);
                case "CONFLICT" -> result.addSkipped(classified.stagingId(), classified.recordNumber(),
                        classified.sendersReference(), classified.reason());
                default -> applyOne(connectionRef, set, reason, ticketRef, correctedBy, row, classified,
                        payloads.get(classified.stagingId()), result);
            }
        }
        return result;
    }

    /** Aplica una fila TO_CORRECT via correctRow y traduce cada excepcion a un outcome (sin abortar el lote). */
    private void applyOne(String connectionRef, String set, String reason, String ticketRef, String correctedBy,
                          SheetRow row, PreviewRow classified, StagingPayload current, ApplyResult result) {
        var patchJson = jsonConfigurationMapper.toJson(computePatch(current.payloadJson(), row));
        try {
            correctionService.correctRow(connectionRef, set,
                    row.stringValue(Mt101CorrectionSheetService.COL_SOURCE_FILE_HASH),
                    classified.recordNumber() == null ? -1L : classified.recordNumber(),
                    classified.stagingId(), patchJson, correctedBy,
                    row.longValue(Mt101CorrectionSheetService.COL_VERSION), reason, ticketRef);
            result.addCorrected(classified.stagingId(), classified.recordNumber(), classified.sendersReference(),
                    classified.changedFields());
        } catch (Mt101StagingCorrectionService.StaleStagingRowException conflict) {
            result.addSkipped(classified.stagingId(), classified.recordNumber(), classified.sendersReference(),
                    "STALE_VERSION");
        } catch (Mt101StagingCorrectionService.RowLockedForRebuildException locked) {
            result.addSkipped(classified.stagingId(), classified.recordNumber(), classified.sendersReference(),
                    "LOCKED_BY_REBUILD");
        } catch (IllegalArgumentException | IllegalStateException error) {
            result.addFailed(classified.stagingId(), classified.recordNumber(), classified.sendersReference(),
                    error.getMessage());
        }
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

    /** Los campos cambiados (claves del merge-patch efectivo), en orden estable. */
    private List<String> changedFields(String currentPayloadJson, SheetRow row) {
        return new ArrayList<>(computePatch(currentPayloadJson, row).keySet());
    }

    /**
     * Merge-patch EFECTIVO: solo los campos editables cuyo valor de la planilla difiere del payload actual, con el
     * valor COERCIDO al tipo del valor actual (money-safety: {@code monto} vuelve a numero/BigDecimal, no queda como
     * texto y no le cambia la forma al payload que consume el BUILD). La deteccion de cambio es por texto porque el
     * export y el parse usan ambos {@code String.valueOf} (round-trip string-exacto).
     *
     * <p>Package-private para poder testear la coercion money-safe de forma directa (es la logica critica).
     */
    LinkedHashMap<String, Object> computePatch(String currentPayloadJson, SheetRow row) {
        Map<String, Object> current = currentPayloadJson == null || currentPayloadJson.isBlank()
                ? Map.of()
                : jsonConfigurationMapper.toMap(currentPayloadJson);
        var patch = new LinkedHashMap<String, Object>();
        for (var key : row.editableKeys()) {
            var sheetValue = row.stringValue(key);
            var currentValue = current.get(key);
            var currentString = currentValue == null ? "" : String.valueOf(currentValue);
            if (!Objects.equals(sheetValue == null ? "" : sheetValue, currentString)) {
                patch.put(key, coerceToCurrentType(sheetValue, currentValue));
            }
        }
        return patch;
    }

    /**
     * Devuelve el valor de la planilla (texto) en el tipo del valor actual del payload, para preservar la forma:
     * numero -> BigDecimal (exacto, money-safe; si no parsea se deja el texto y lo rechaza MT101_VALIDATE),
     * booleano -> boolean, resto -> texto. Una celda vacia = el operador limpio el campo -> {@code ""} (no lo quita:
     * fail-loud aguas abajo, no un remove silencioso que rompa la forma).
     */
    private Object coerceToCurrentType(String sheetValue, Object currentValue) {
        if (sheetValue == null) {
            return "";
        }
        if (currentValue instanceof Number) {
            try {
                return new BigDecimal(sheetValue.trim());
            } catch (NumberFormatException ignored) {
                return sheetValue;
            }
        }
        if (currentValue instanceof Boolean) {
            var lower = sheetValue.trim().toLowerCase();
            if (lower.equals("true") || lower.equals("false")) {
                return Boolean.parseBoolean(lower);
            }
            return sheetValue;
        }
        return sheetValue;
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

    /**
     * Resultado del apply: conteos por outcome + muestra de corregidas + la lista de FILAS PROBLEMATICAS
     * (omitidas + fallidas) capada a {@value #MAX_ISSUES}. Si se excede, {@code issuesTruncated} avisa (el conteo
     * sigue siendo autoritativo: nada se pierde en silencio; el rastro completo esta en la auditoria por fila).
     */
    public static final class ApplyResult {
        private final List<ApplyRow> correctedSample = new ArrayList<>();
        private final List<ApplyRow> issues = new ArrayList<>();
        private int total;
        private int corrected;
        private int unchanged;
        private int skipped;
        private int failed;
        private boolean issuesTruncated;

        void addCorrected(Long stagingId, Long recordNumber, String ref, List<String> changed) {
            total++;
            corrected++;
            if (correctedSample.size() < SAMPLE) {
                correctedSample.add(new ApplyRow(stagingId, recordNumber, ref, "CORRECTED", null, List.copyOf(changed)));
            }
        }

        void addUnchanged(PreviewRow row) {
            total++;
            unchanged++;
        }

        void addSkipped(Long stagingId, Long recordNumber, String ref, String reason) {
            total++;
            skipped++;
            recordIssue(new ApplyRow(stagingId, recordNumber, ref, "SKIPPED", reason, List.of()));
        }

        void addFailed(Long stagingId, Long recordNumber, String ref, String message) {
            total++;
            failed++;
            recordIssue(new ApplyRow(stagingId, recordNumber, ref, "FAILED", message, List.of()));
        }

        private void recordIssue(ApplyRow row) {
            if (issues.size() < MAX_ISSUES) {
                issues.add(row);
            } else {
                issuesTruncated = true;
            }
        }

        public int total() {
            return total;
        }

        public int corrected() {
            return corrected;
        }

        public int unchanged() {
            return unchanged;
        }

        public int skipped() {
            return skipped;
        }

        public int failed() {
            return failed;
        }

        public boolean issuesTruncated() {
            return issuesTruncated;
        }

        public List<ApplyRow> correctedSample() {
            return correctedSample;
        }

        public List<ApplyRow> issues() {
            return issues;
        }
    }

    /** Una fila del resultado del apply: outcome CORRECTED / UNCHANGED / SKIPPED / FAILED (+ motivo si aplica). */
    public record ApplyRow(Long stagingId, Long recordNumber, String sendersReference, String outcome,
                           String reason, List<String> changedFields) {
    }
}
