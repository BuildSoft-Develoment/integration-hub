package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FailedRecordRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101RebuildRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101StagingCorrectionRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101StagingRecordRepository;
import com.integrationhub.platform.spi.engine.ConfigurationMapper;
import com.integrationhub.platform.spi.engine.JdbcConnectionResolver;
import com.integrationhub.platform.spi.engine.RecordAuditEmitter;
import com.integrationhub.platform.spi.staging.StagingCorrectionCommand;
import com.integrationhub.platform.spi.staging.StagingCorrectionOutcome;
import com.integrationhub.platform.spi.staging.StagingRowCorrectionService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

/**
 * Corrige una fila de staging en cuarentena antes del rebuild correctivo.
 *
 * <p>ADR-021 (decision 3): <b>este servicio ya no escribe {@code staging_record}</b>. El algoritmo
 * generico —transaccion, If-Match, merge-patch, bump de version, hashes de evidencia— se promovio a
 * {@link StagingRowCorrectionService}, en el motor. Aca queda lo que si es de SWIFT MT101: resolver
 * a que fragmento pertenece la fila y exigir que el fragmento este RECHAZADO, vetar la edicion si un
 * rebuild aprobado la congelo, y archivar la evidencia en la tabla del estandar.
 */
@ApplicationScoped
public class Mt101StagingCorrectionService {

    private static final String QUARANTINED = "QUARANTINED";
    private static final String REJECTED = "REJECTED";

    private final DataSource defaultDataSource;
    private final JdbcConnectionResolver connectionPoolManager;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101StagingRecordRepository stagingRepository;
    private final Mt101FailedRecordRepository failedRecordRepository;
    private final Mt101StagingCorrectionRepository correctionRepository;
    private final Mt101RebuildRepository rebuildRepository;
    private final ConfigurationMapper jsonConfigurationMapper;
    private final RecordAuditEmitter recordAuditEmitter;
    private final StagingRowCorrectionService stagingCorrectionService;

    @Inject
    public Mt101StagingCorrectionService(DataSource defaultDataSource,
                                         JdbcConnectionResolver connectionPoolManager,
                                          Mt101FragmentRepository fragmentRepository,
                                          Mt101StagingRecordRepository stagingRepository,
                                          Mt101FailedRecordRepository failedRecordRepository,
                                          Mt101StagingCorrectionRepository correctionRepository,
                                          Mt101RebuildRepository rebuildRepository,
                                          ConfigurationMapper jsonConfigurationMapper,
                                          RecordAuditEmitter recordAuditEmitter) {
        this.stagingCorrectionService = new StagingRowCorrectionService(jsonConfigurationMapper);
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.fragmentRepository = fragmentRepository;
        this.stagingRepository = stagingRepository;
        this.failedRecordRepository = failedRecordRepository;
        this.correctionRepository = correctionRepository;
        this.rebuildRepository = rebuildRepository;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    /**
     * Conveniencia: arma los repositorios (JDBC crudo, sin estado) y deja al llamante aportar el
     * mapper. La implementacion concreta del mapper vive en el motor y arrastra la resolucion de
     * secretos, asi que este constructor NO puede instanciarla: seria una dependencia del vertical
     * hacia el motor por la puerta de atras (ADR-021).
     */
    public Mt101StagingCorrectionService(DataSource defaultDataSource,
                                         JdbcConnectionResolver connectionPoolManager,
                                         Mt101FragmentRepository fragmentRepository,
                                          Mt101StagingRecordRepository stagingRepository,
                                          ConfigurationMapper jsonConfigurationMapper,
                                          RecordAuditEmitter recordAuditEmitter) {
        this(defaultDataSource, connectionPoolManager, fragmentRepository, stagingRepository,
                new Mt101FailedRecordRepository(), new Mt101StagingCorrectionRepository(),
                new Mt101RebuildRepository(), jsonConfigurationMapper, recordAuditEmitter);
    }

    public CorrectionResult correctRow(String connectionRef,
                                       String fragmentSetId,
                                       String sourceFileHash,
                                       long recordNumber,
                                       long stagingId,
                                       String patchJson, String correctedBy, Long expectedVersion,
                                       String correctionReason, String ticketRef) {
        var hash = validateInputs(fragmentSetId, sourceFileHash, recordNumber, stagingId);
        // El comando valida el patch, y se arma antes de resolver la fila para que un patch vacio
        // siga fallando sin haber tocado la BD.
        var command = new StagingCorrectionCommand(stagingId, patchJson, expectedVersion);
        var set = fragmentSetId.trim();
        var dataSource = resolveDataSource(connectionRef);
        var actor = normalizeActor(correctedBy);
        try {
            var row = resolve(dataSource, set, hash, recordNumber, stagingId);
            var outcome = stagingCorrectionService.correct(dataSource, command,
                    // B2: si la fila esta en un rebuild APPROVED/BUILDING, sus datos ya fueron
                    // congelados por el checker. No se admite corregirla hasta cerrar/invalidar
                    // ese run, para no romper la segregacion maker-checker.
                    connection -> {
                        if (rebuildRepository.isRowLockedByActiveRun(connection, set, row.sourceFileHash(),
                                recordNumber, row.stagingId())) {
                            throw new RowLockedForRebuildException(recordNumber, set);
                        }
                    },
                    (connection, evidence) -> correctionRepository.insert(connection,
                            new Mt101StagingCorrectionRepository.CorrectionAuditRow(
                                    set,
                                    row.processExecutionId(),
                                    row.sourceFileHash(),
                                    recordNumber,
                                    row.recordIndex(),
                                    row.stagingId(),
                                    evidence.oldPayloadHash(),
                                    evidence.newPayloadHash(),
                                    String.join(",", evidence.changedFields()),
                                    actor,
                                    blankToNull(correctionReason),
                                    blankToNull(ticketRef),
                                    evidence.oldVersion(),
                                    evidence.newVersion())));

            emit(set, row.processExecutionId(), row.sourceFileHash(), recordNumber, row.stagingId(),
                    row.sourceTaskDefinitionId(), row.sourceName(), outcome, actor);
            return new CorrectionResult(set, recordNumber, outcome.updated(), outcome.evidence().newVersion());
        } catch (com.integrationhub.platform.spi.staging.StaleStagingRowException conflict) {
            // El motor identifica la fila por stagingId; el operador corrige "la fila N del archivo".
            // Traducimos para que el 409 siga nombrando lo que el vio en pantalla.
            throw new StaleStagingRowException(recordNumber, conflict.expectedVersion(), conflict.actualVersion());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot correct staging row " + recordNumber + " for set " + set, error);
        }
    }

    /** Payload actual + version de una fila en cuarentena, para cargar antes de corregir (ETag/If-Match). */
    public StagingRowView readRow(String connectionRef, String fragmentSetId, String sourceFileHash, long recordNumber,
                                  long stagingId) {
        var hash = validateInputs(fragmentSetId, sourceFileHash, recordNumber, stagingId);
        var set = fragmentSetId.trim();
        var dataSource = resolveDataSource(connectionRef);
        try {
            var row = resolve(dataSource, set, hash, recordNumber, stagingId);
            var current = row.current();
            return new StagingRowView(set, hash, recordNumber, row.stagingId(), current.payloadJson(),
                    current.version(), current.physicalLine(), current.sheetName(), current.sheetRow());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read staging row " + recordNumber + " for set " + set, error);
        }
    }

    private String validateInputs(String fragmentSetId, String sourceFileHash, long recordNumber, long stagingId) {
        if (fragmentSetId == null || fragmentSetId.isBlank()) {
            throw new IllegalArgumentException("fragmentSetId is required");
        }
        if (sourceFileHash == null || sourceFileHash.isBlank()) {
            throw new IllegalArgumentException("sourceFileHash is required");
        }
        if (recordNumber < 1) {
            throw new IllegalArgumentException("recordNumber must be positive");
        }
        if (stagingId < 1) {
            throw new IllegalArgumentException("stagingId must be positive");
        }
        return sourceFileHash.trim();
    }

    /** Resuelve y valida que la fila pertenezca al set/fragmento REJECTED y exista en staging. */
    private ResolvedRow resolve(DataSource dataSource, String set, String sourceFileHash, long recordNumber,
                                long stagingId) throws SQLException {
        var failedRows = failedRecordRepository.findBySourceRow(dataSource, set, sourceFileHash, recordNumber,
                stagingId, QUARANTINED, 1);
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
        var fragment = fragmentRepository.findBySourceIdentity(
                dataSource, set, sourceFileHash, recordNumber, stagingId, failed.sendersReference());
        if (fragment == null) {
            throw new IllegalArgumentException("row " + recordNumber + " stagingId " + stagingId
                    + " does not belong to fragment " + failed.sendersReference() + " in set " + set);
        }
        if (fragment.processExecutionId() == null) {
            throw new IllegalArgumentException("cannot resolve execution for fragment set " + set);
        }
        try (var connection = dataSource.getConnection()) {
            var current = stagingRepository.findStagingPayloadById(connection, stagingId);
            if (current == null) {
                throw new IllegalArgumentException("no staging row " + stagingId
                        + " for set " + set + " and source file " + sourceFileHash);
            }
            return new ResolvedRow(fragment.processExecutionId(), sourceFileHash, recordNumber - 1, stagingId,
                    failed.sourceTaskDefinitionId(), failed.sourceName(), current);
        }
    }

    private record ResolvedRow(long processExecutionId, String sourceFileHash, long recordIndex, long stagingId,
                               Long sourceTaskDefinitionId, String sourceName,
                               Mt101StagingRecordRepository.StagingPayload current) {
    }

    private String normalizeActor(String actor) {
        return actor == null || actor.isBlank() ? "unknown" : actor.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * Auditoria del vertical, <b>despues</b> del commit (best-effort, igual que antes de ADR-021: si
     * el emisor falla no se deshace una correccion ya persistida — la evidencia durable es el journal,
     * que si va dentro de la transaccion).
     *
     * <p>Los hashes y los campos cambiados llegan calculados por el motor. Recalcularlos aca abriria
     * la posibilidad de que la traza diga algo distinto de lo que se archivo.</p>
     */
    private void emit(String fragmentSetId,
                      Long processExecutionId,
                      String sourceFileHash,
                      long recordNumber,
                      long stagingId,
                      Long sourceTaskDefinitionId,
                      String sourceName,
                      StagingCorrectionOutcome outcome,
                      String correctedBy) {
        if (recordAuditEmitter == null) {
            return;
        }
        var attrs = new LinkedHashMap<String, String>();
        attrs.put("correctionMode", "merge-patch");
        attrs.put("correctedBy", correctedBy);
        attrs.put("oldPayloadHash", outcome.evidence().oldPayloadHash());
        attrs.put("newPayloadHash", outcome.evidence().newPayloadHash());
        attrs.put("changedFields", String.join(",", outcome.evidence().changedFields()));
        attrs.put("stagingId", String.valueOf(stagingId));
        attrs.put("sourceRecordNumber", String.valueOf(recordNumber));
        if (sourceTaskDefinitionId != null) {
            attrs.put("sourceTaskDefinitionId", String.valueOf(sourceTaskDefinitionId));
        }
        if (sourceName != null && !sourceName.isBlank()) {
            attrs.put("sourceName", sourceName);
        }
        var envelope = new AuditEnvelope(
                UUID.randomUUID().toString(),
                processExecutionId == null ? null : "exec-" + processExecutionId,
                fragmentSetId + ":" + sourceFileHash + ":" + stagingId,
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

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    public record CorrectionResult(String fragmentSetId, long recordNumber, int updated, long version) {
    }

    public record StagingRowView(String fragmentSetId, String sourceFileHash, long recordNumber, long stagingId,
                                 String payloadJson, long version,
                                 Long physicalLine, String sheetName, Long sheetRow) {
    }

    /** Conflicto de locking optimista: la fila cambio desde que el operador la leyo. */
    public static class StaleStagingRowException extends RuntimeException {
        public StaleStagingRowException(long recordNumber, long expectedVersion, long actualVersion) {
            super("staging row " + recordNumber + " was modified concurrently (expected version "
                    + expectedVersion + " but is " + actualVersion + "); reload and retry");
        }
    }

    /**
     * B2: la fila esta en un rebuild APPROVED/BUILDING; sus datos fueron congelados por el
     * checker y no pueden corregirse hasta cerrar o invalidar ese run.
     */
    public static class RowLockedForRebuildException extends RuntimeException {
        public RowLockedForRebuildException(long recordNumber, String fragmentSetId) {
            super("staging row " + recordNumber + " in set " + fragmentSetId
                    + " is locked by an approved/building rebuild run; data was frozen for maker-checker."
                    + " Wait for the run to finish or invalidate it before correcting again");
        }
    }
}
