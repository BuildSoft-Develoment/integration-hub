package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingCorrectionRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingRecordRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeSet;
import java.util.UUID;

/**
 * Corrige una fila de staging en cuarentena antes del rebuild correctivo. La
 * correccion usa semantica JSON Merge Patch sobre el payload actual y valida que
 * la fila pertenezca al set/fragmento rechazado.
 */
@ApplicationScoped
public class Mt101StagingCorrectionService {

    private static final String QUARANTINED = "QUARANTINED";
    private static final String REJECTED = "REJECTED";

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101StagingRecordRepository stagingRepository;
    private final Mt101FailedRecordRepository failedRecordRepository;
    private final Mt101StagingCorrectionRepository correctionRepository;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final RecordAuditEmitter recordAuditEmitter;

    @Inject
    public Mt101StagingCorrectionService(DataSource defaultDataSource,
                                         ConnectionPoolManager connectionPoolManager,
                                          Mt101FragmentRepository fragmentRepository,
                                          Mt101StagingRecordRepository stagingRepository,
                                          Mt101FailedRecordRepository failedRecordRepository,
                                          Mt101StagingCorrectionRepository correctionRepository,
                                          JsonConfigurationMapper jsonConfigurationMapper,
                                          RecordAuditEmitter recordAuditEmitter) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.stagingRepository = stagingRepository;
        this.failedRecordRepository = failedRecordRepository;
        this.correctionRepository = correctionRepository;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    public Mt101StagingCorrectionService(DataSource defaultDataSource,
                                         ConnectionPoolManager connectionPoolManager,
                                         Mt101FragmentRepository fragmentRepository,
                                          Mt101StagingRecordRepository stagingRepository,
                                          RecordAuditEmitter recordAuditEmitter) {
        this(defaultDataSource, connectionPoolManager, fragmentRepository, stagingRepository,
                new Mt101FailedRecordRepository(), new Mt101StagingCorrectionRepository(),
                new JsonConfigurationMapper(), recordAuditEmitter);
    }

    /** Conveniencia para tests sin auditoria. */
    public Mt101StagingCorrectionService(DataSource defaultDataSource,
                                         ConnectionPoolManager connectionPoolManager,
                                         Mt101FragmentRepository fragmentRepository,
                                         Mt101StagingRecordRepository stagingRepository) {
        this(defaultDataSource, connectionPoolManager, fragmentRepository, stagingRepository, null);
    }

    public CorrectionResult correctRow(String connectionRef,
                                       String fragmentSetId,
                                       String sourceFileHash,
                                       long recordNumber,
                                       String patchJson) {
        return correctRow(connectionRef, fragmentSetId, sourceFileHash, recordNumber, patchJson, null, null);
    }

    public CorrectionResult correctRow(String connectionRef, String fragmentSetId, String sourceFileHash, long recordNumber,
                                       String patchJson, String correctedBy) {
        return correctRow(connectionRef, fragmentSetId, sourceFileHash, recordNumber, patchJson, correctedBy, null);
    }

    public CorrectionResult correctRow(String connectionRef, String fragmentSetId, String sourceFileHash, long recordNumber,
                                       String patchJson, String correctedBy, Long expectedVersion) {
        return correctRow(connectionRef, fragmentSetId, sourceFileHash, recordNumber, patchJson,
                correctedBy, expectedVersion, null, null);
    }

    public CorrectionResult correctRow(String connectionRef, String fragmentSetId, String sourceFileHash, long recordNumber,
                                       String patchJson, String correctedBy, Long expectedVersion,
                                       String correctionReason, String ticketRef) {
        var hash = validateInputs(fragmentSetId, sourceFileHash, recordNumber);
        if (patchJson == null || patchJson.isBlank()) {
            throw new IllegalArgumentException("payload patch is required");
        }
        var set = fragmentSetId.trim();
        var dataSource = resolveDataSource(connectionRef);
        try {
            var row = resolve(dataSource, set, hash, recordNumber);
            try (var connection = dataSource.getConnection()) {
                var previousAutoCommit = connection.getAutoCommit();
                connection.setAutoCommit(false);
                try {
                    var current = stagingRepository.findStagingPayload(
                            connection, row.processExecutionId(), row.recordIndex(), row.sourceFileHash());
                    if (current == null) {
                        throw new IllegalArgumentException("no staging row at file row " + recordNumber
                                + " for set " + set + " and source file " + sourceFileHash);
                    }
                    // Locking optimista: si el cliente trae la version que leyo (If-Match) y ya
                    // cambio, abortamos sin pisar la correccion de otro operador.
                    if (expectedVersion != null && current.version() != expectedVersion) {
                        throw new StaleStagingRowException(recordNumber, expectedVersion, current.version());
                    }
                    var checkVersion = expectedVersion != null ? expectedVersion : current.version();

                    var before = jsonConfigurationMapper.toMap(current.payloadJson());
                    var patch = jsonConfigurationMapper.toMap(patchJson);
                    var after = mergePatch(before, patch);
                    var newPayload = jsonConfigurationMapper.toJson(after);
                    var changedFields = changedFields(before, after);
                    var updated = stagingRepository.updatePayload(
                            connection, row.processExecutionId(), row.recordIndex(), row.sourceFileHash(), newPayload, checkVersion);
                    if (updated == 0) {
                        throw new StaleStagingRowException(recordNumber, checkVersion, current.version());
                    }
                    correctionRepository.insert(connection, new Mt101StagingCorrectionRepository.CorrectionAuditRow(
                            set,
                            row.processExecutionId(),
                            row.sourceFileHash(),
                            recordNumber,
                            row.recordIndex(),
                            current.id(),
                            sha256Hex(current.payloadJson() == null ? "" : current.payloadJson()),
                            sha256Hex(newPayload == null ? "" : newPayload),
                            String.join(",", changedFields),
                            normalizeActor(correctedBy),
                            blankToNull(correctionReason),
                            blankToNull(ticketRef),
                            checkVersion,
                            checkVersion + 1));
                    connection.commit();
                    emit(set, row.processExecutionId(), row.sourceFileHash(), recordNumber,
                            before, after, current.payloadJson(), newPayload, normalizeActor(correctedBy));
                    return new CorrectionResult(set, recordNumber, updated, checkVersion + 1);
                } catch (SQLException | RuntimeException error) {
                    try {
                        connection.rollback();
                    } catch (SQLException rollbackError) {
                        error.addSuppressed(rollbackError);
                    }
                    throw error;
                } finally {
                    connection.setAutoCommit(previousAutoCommit);
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot correct staging row " + recordNumber + " for set " + set, error);
        }
    }

    /** Payload actual + version de una fila en cuarentena, para cargar antes de corregir (ETag/If-Match). */
    public StagingRowView readRow(String connectionRef, String fragmentSetId, String sourceFileHash, long recordNumber) {
        var hash = validateInputs(fragmentSetId, sourceFileHash, recordNumber);
        var set = fragmentSetId.trim();
        var dataSource = resolveDataSource(connectionRef);
        try {
            var row = resolve(dataSource, set, hash, recordNumber);
            return new StagingRowView(set, hash, recordNumber, row.current().payloadJson(), row.current().version());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read staging row " + recordNumber + " for set " + set, error);
        }
    }

    private String validateInputs(String fragmentSetId, String sourceFileHash, long recordNumber) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        if (sourceFileHash == null || sourceFileHash.isBlank()) {
            throw new IllegalArgumentException("sourceFileHash is required");
        }
        if (recordNumber < 1) {
            throw new IllegalArgumentException("recordNumber must be positive");
        }
        return sourceFileHash.trim();
    }

    /** Resuelve y valida que la fila pertenezca al set/fragmento REJECTED y exista en staging. */
    private ResolvedRow resolve(DataSource dataSource, String set, String sourceFileHash, long recordNumber) throws SQLException {
        var failedRows = failedRecordRepository.findBySourceRow(dataSource, set, sourceFileHash, recordNumber, QUARANTINED, 1);
        if (failedRows.isEmpty()) {
            throw new IllegalArgumentException("no quarantined row at source file " + sourceFileHash
                    + " row " + recordNumber + " for set " + set);
        }
        var failed = failedRows.get(0);
        if (failed.sendersReference() == null || failed.sendersReference().isBlank()) {
            throw new IllegalArgumentException("quarantined row " + recordNumber
                    + " has no :20: to validate fragment ownership");
        }
        var statuses = fragmentRepository.statusesByReferences(dataSource, set, List.of(failed.sendersReference()));
        var status = statuses.get(failed.sendersReference());
        if (!REJECTED.equals(status)) {
            throw new IllegalArgumentException("cannot correct row " + recordNumber + " in set " + set
                    + "; affected fragment " + failed.sendersReference()
                    + " must be REJECTED but is " + (status == null ? "<missing>" : status));
        }
        var fragments = fragmentRepository.findBySourceRecord(
                dataSource, recordNumber, sourceFileHash, null, null, set, 10);
        var fragment = fragments.stream()
                .filter(row -> failed.sendersReference().equals(row.sendersReference()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("row " + recordNumber
                        + " does not belong to fragment " + failed.sendersReference() + " in set " + set));
        if (fragment.processExecutionId() == null) {
            throw new IllegalArgumentException("cannot resolve execution for fragment set " + set);
        }
        var recordIndex = recordNumber - 1;
        var current = stagingRepository.findStagingPayload(
                dataSource, fragment.processExecutionId(), recordIndex, sourceFileHash);
        if (current == null) {
            throw new IllegalArgumentException("no staging row at file row " + recordNumber
                    + " for set " + set + " and source file " + sourceFileHash);
        }
        return new ResolvedRow(fragment.processExecutionId(), sourceFileHash, recordIndex, current);
    }

    private record ResolvedRow(long processExecutionId, String sourceFileHash, long recordIndex,
                               Mt101StagingRecordRepository.StagingPayload current) {
    }

    private Map<String, Object> mergePatch(Map<String, Object> original, Map<String, Object> patch) {
        var result = new LinkedHashMap<String, Object>(original);
        for (var entry : patch.entrySet()) {
            var key = entry.getKey();
            var patchValue = entry.getValue();
            if (patchValue == null) {
                result.remove(key);
                continue;
            }
            var currentValue = result.get(key);
            if (currentValue instanceof Map<?, ?> currentMap && patchValue instanceof Map<?, ?> patchMap) {
                result.put(key, mergePatch(asStringKeyed(currentMap), asStringKeyed(patchMap)));
            } else {
                result.put(key, patchValue);
            }
        }
        return result;
    }

    private Map<String, Object> asStringKeyed(Map<?, ?> raw) {
        var result = new LinkedHashMap<String, Object>();
        raw.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private String normalizeActor(String actor) {
        return actor == null || actor.isBlank() ? "unknown" : actor.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void emit(String fragmentSetId,
                      Long processExecutionId,
                      String sourceFileHash,
                      long recordNumber,
                      Map<String, Object> before,
                      Map<String, Object> after,
                      String rawBefore,
                      String rawAfter,
                      String correctedBy) {
        if (recordAuditEmitter == null) {
            return;
        }
        var attrs = new LinkedHashMap<String, String>();
        attrs.put("correctionMode", "merge-patch");
        attrs.put("correctedBy", correctedBy);
        attrs.put("oldPayloadHash", sha256Hex(rawBefore == null ? "" : rawBefore));
        attrs.put("newPayloadHash", sha256Hex(rawAfter == null ? "" : rawAfter));
        attrs.put("changedFields", String.join(",", changedFields(before, after)));
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
                attrs,
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

    private List<String> changedFields(Map<String, Object> before, Map<String, Object> after) {
        var keys = new TreeSet<String>();
        keys.addAll(before.keySet());
        keys.addAll(after.keySet());
        var changed = new ArrayList<String>();
        for (var key : keys) {
            if (!Objects.equals(before.get(key), after.get(key))) {
                changed.add(key);
            }
        }
        return changed;
    }

    private String sha256Hex(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    public record CorrectionResult(String fragmentSetId, long recordNumber, int updated, long version) {
    }

    public record StagingRowView(String fragmentSetId, String sourceFileHash, long recordNumber, String payloadJson, long version) {
    }

    /** Conflicto de locking optimista: la fila cambio desde que el operador la leyo. */
    public static class StaleStagingRowException extends RuntimeException {
        public StaleStagingRowException(long recordNumber, long expectedVersion, long actualVersion) {
            super("staging row " + recordNumber + " was modified concurrently (expected version "
                    + expectedVersion + " but is " + actualVersion + "); reload and retry");
        }
    }
}
