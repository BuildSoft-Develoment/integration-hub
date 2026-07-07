package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101BuildFromTableTaskProvider;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cierra el ciclo de "reprocesar solo lo necesario": re-construye un set correctivo
 * a partir UNICAMENTE de las filas en cuarentena (ya corregidas en staging),
 * reusando el config original del build, y marca los fragmentos originales
 * {@code SUPERSEDED}. No regenera el lote completo. Orquesta; el SQL vive en los
 * repositorios y el build en {@link Mt101BuildFromTableTaskProvider} (ADR-011).
 */
@ApplicationScoped
public class Mt101RebuildService {

    private static final Logger LOG = Logger.getLogger(Mt101RebuildService.class);

    private static final String REBUILDABLE_FRAGMENT_STATUS = "REJECTED";
    /** Limite de varchar(80) de fragment_set_id / corrective_set_id / rebuild_run_id. */
    private static final int MAX_FRAGMENT_SET_ID_LENGTH = 80;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101BuildFromTableTaskProvider buildProvider;
    private final Mt101BuildConfigSource buildConfigSource;
    private final Mt101FailedRecordRepository failedRecordRepository;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101RebuildRepository rebuildRepository;

    @Inject
    public Mt101RebuildService(DataSource defaultDataSource,
                               ConnectionPoolManager connectionPoolManager,
                               Mt101BuildFromTableTaskProvider buildProvider,
                               Mt101BuildConfigSource buildConfigSource,
                               Mt101FailedRecordRepository failedRecordRepository,
                               Mt101FragmentRepository fragmentRepository,
                               Mt101RebuildRepository rebuildRepository) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.buildProvider = buildProvider;
        this.buildConfigSource = buildConfigSource;
        this.failedRecordRepository = failedRecordRepository;
        this.fragmentRepository = fragmentRepository;
        this.rebuildRepository = rebuildRepository;
    }

    public Mt101RebuildService(DataSource defaultDataSource,
                               ConnectionPoolManager connectionPoolManager,
                               Mt101BuildFromTableTaskProvider buildProvider,
                               Mt101BuildConfigSource buildConfigSource,
                               Mt101FailedRecordRepository failedRecordRepository,
                               Mt101FragmentRepository fragmentRepository) {
        this(defaultDataSource, connectionPoolManager, buildProvider, buildConfigSource,
                failedRecordRepository, fragmentRepository, new Mt101RebuildRepository());
    }

    public RebuildRunSummary requestRebuildFromQuarantine(String connectionRef,
                                                          String fragmentSetId,
                                                          String requestedBy) {
        return requestRebuildFromQuarantine(connectionRef, fragmentSetId, requestedBy, null);
    }

    /**
     * B1: el {@code correctiveSetId} lo genera el servidor de forma irrepetible
     * ({@code <original>-FIX-<referenceCode>}). El cliente ya no lo provee, evitando que
     * un set existente sea reemplazado/borrado por el build correctivo ({@code replaceExisting}).
     */
    public RebuildRunSummary requestRebuildFromQuarantine(String connectionRef,
                                                          String fragmentSetId,
                                                          String requestedBy,
                                                          String requestReason) {
        var set = require(fragmentSetId, "fragmentSetId");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var quarantinedCount = failedRecordRepository.countByStatus(dataSource, set, "QUARANTINED");
            if (quarantinedCount == 0) {
                throw new IllegalArgumentException("no quarantined rows to rebuild in set " + set);
            }

            var references = failedRecordRepository.distinctSendersReferencesByStatus(dataSource, set, "QUARANTINED");
            if (references.isEmpty()) {
                throw new IllegalArgumentException("quarantined rows have no :20: to resolve affected fragments in set " + set);
            }

            var metadata = fragmentRepository.findSetMetadata(dataSource, set);
            if (metadata == null || metadata.taskDefinitionId() == null) {
                throw new IllegalArgumentException("cannot resolve build metadata for fragment set " + set);
            }
            assertRebuildableFragments(
                    fragmentRepository.statusesByReferences(dataSource, set, references), references, set);

            // B1: id determinista e irrepetible por secuencia; rechazar si ya existe como lote.
            var referenceCode = rebuildRepository.nextReferenceCode(dataSource);
            var corrective = set + "-FIX-" + referenceCode;
            // R-b: el id correctivo no puede exceder varchar(80) (run/corrective/fragment_set).
            // Sin fallback: si el set original es demasiado largo, se aborta ruidoso (no truncar).
            if (corrective.length() > MAX_FRAGMENT_SET_ID_LENGTH) {
                throw new IllegalArgumentException("corrective set id " + corrective + " exceeds "
                        + MAX_FRAGMENT_SET_ID_LENGTH + " chars; original fragmentSetId is too long to derive a corrective id");
            }
            if (corrective.equals(set) || rebuildRepository.fragmentSetExists(dataSource, corrective)) {
                throw new IllegalStateException("generated corrective set " + corrective
                        + " already exists; aborting to avoid overwriting an existing batch");
            }
            var runId = corrective;
            // R-a: crear run + seleccion + stats en UNA transaccion local. Un fallo intermedio
            // hace rollback completo: nunca queda un rebuild REQUESTED con seleccion incompleta.
            try (var connection = dataSource.getConnection()) {
                var previousAutoCommit = connection.getAutoCommit();
                connection.setAutoCommit(false);
                try {
                    rebuildRepository.createRun(connection, runId, set, corrective, requestedBy, blankToNull(requestReason), referenceCode, connectionRef);
                    rebuildRepository.insertSelectionFromFragmentRecords(connection, runId, set, references);
                    var selectedRows = rebuildRepository.countSelection(connection, runId);
                    if (selectedRows == 0) {
                        throw new IllegalArgumentException("cannot resolve selected rows for set " + set
                                + ". mt101_fragment_record is required; previous data is not corrected automatically.");
                    }
                    rebuildRepository.updateSelectionStats(connection, runId, selectedRows, references.size());
                    connection.commit();
                    return new RebuildRunSummary(runId, set, corrective, "REQUESTED", selectedRows, references.size(),
                            blankToNull(connectionRef), "NOT_REQUESTED", null, null);
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
            throw new IllegalStateException("Cannot request MT101 rebuild for set " + set, error);
        }
    }

    public RebuildRunSummary requestRebuildFromRejectedCorrective(String connectionRef,
                                                                  String parentRebuildRunId,
                                                                  String requestedBy,
                                                                  String requestReason) {
        var parentRunId = require(parentRebuildRunId, "parentRebuildRunId");
        var requester = require(requestedBy, "requestedBy");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var parent = rebuildRepository.findRun(dataSource, parentRunId);
            if (parent == null) {
                throw new IllegalArgumentException("parent rebuildRunId not found: " + parentRunId);
            }
            if (parent.connectionRef() != null && !parent.connectionRef().isBlank()) {
                var requestedConnection = connectionRef == null ? "" : connectionRef.trim();
                if (!parent.connectionRef().equals(requestedConnection)) {
                    throw new IllegalArgumentException("parent rebuild run " + parentRunId
                            + " belongs to connectionRef " + parent.connectionRef() + " but request used "
                            + (requestedConnection.isBlank() ? "<default>" : requestedConnection));
                }
            }
            if (!"PARTIALLY_SENT".equalsIgnoreCase(parent.payStatus())) {
                throw new IllegalArgumentException("parent rebuild run " + parentRunId
                        + " must have payStatus PARTIALLY_SENT to request a child corrective; current payStatus is "
                        + parent.payStatus());
            }
            var rejectedReferences = rebuildRepository.correctivePayRejectedReferences(dataSource, parentRunId);
            if (rejectedReferences.isEmpty()) {
                throw new IllegalArgumentException("parent rebuild run " + parentRunId
                        + " has no rejected corrective PAY fragments");
            }
            assertRebuildableFragments(fragmentRepository.statusesByReferences(
                    dataSource, parent.correctiveSetId(), rejectedReferences), rejectedReferences, parent.correctiveSetId());

            var metadata = fragmentRepository.findSetMetadata(dataSource, parent.correctiveSetId());
            if (metadata == null || metadata.taskDefinitionId() == null) {
                throw new IllegalArgumentException("cannot resolve build metadata for corrective set "
                        + parent.correctiveSetId());
            }

            var referenceCode = rebuildRepository.nextReferenceCode(dataSource);
            var corrective = parent.correctiveSetId() + "-FIX-" + referenceCode;
            if (corrective.length() > MAX_FRAGMENT_SET_ID_LENGTH) {
                throw new IllegalArgumentException("child corrective set id " + corrective + " exceeds "
                        + MAX_FRAGMENT_SET_ID_LENGTH + " chars; parent correctiveSetId is too long to derive a child corrective id");
            }
            if (rebuildRepository.fragmentSetExists(dataSource, corrective)) {
                throw new IllegalStateException("generated child corrective set " + corrective
                        + " already exists; aborting to avoid overwriting an existing batch");
            }
            var runId = corrective;
            var generation = rebuildRepository.nextChildGeneration(dataSource, parentRunId);
            try (var connection = dataSource.getConnection()) {
                var previousAutoCommit = connection.getAutoCommit();
                connection.setAutoCommit(false);
                try {
                    rebuildRepository.createChildRun(connection, runId, parent.correctiveSetId(), corrective,
                            requester, blankToNull(requestReason), referenceCode, connectionRef,
                            parentRunId, parent.correctiveSetId(), generation);
                    rebuildRepository.insertSelectionFromFragmentRecords(
                            connection, runId, parent.correctiveSetId(), rejectedReferences);
                    var selectedRows = rebuildRepository.countSelection(connection, runId);
                    if (selectedRows == 0) {
                        throw new IllegalArgumentException("cannot resolve selected rows for child corrective from set "
                                + parent.correctiveSetId() + "; mt101_fragment_record is required");
                    }
                    rebuildRepository.updateSelectionStats(connection, runId, selectedRows, rejectedReferences.size());
                    connection.commit();
                    return new RebuildRunSummary(runId, parent.correctiveSetId(), corrective, "REQUESTED",
                            selectedRows, rejectedReferences.size(), blankToNull(connectionRef),
                            "NOT_REQUESTED", null, null);
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
            throw new IllegalStateException("Cannot request child MT101 corrective for run " + parentRunId, error);
        }
    }

    /** Aprobacion gobernada: exige segregacion de funciones (approver != requester). */
    public RebuildRunSummary approveRebuildRun(String connectionRef, String rebuildRunId, String approvedBy) {
        return approveRebuildRun(connectionRef, rebuildRunId, approvedBy, null);
    }

    /** Aprobacion gobernada: exige segregacion de funciones (approver != requester). */
    public RebuildRunSummary approveRebuildRun(String connectionRef, String rebuildRunId, String approvedBy, String approvalReason) {
        var runId = require(rebuildRunId, "rebuildRunId");
        var approver = require(approvedBy, "approvedBy");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var run = rebuildRepository.findRun(dataSource, runId);
            if (run == null) {
                throw new IllegalArgumentException("rebuildRunId not found: " + runId);
            }
            if ("APPROVED".equals(run.status())) {
                return summary(run);
            }
            // Segregacion de funciones: quien solicita no puede aprobar su propio rebuild.
            if (approver.equals(run.requestedBy())) {
                throw new IllegalArgumentException("rebuild run " + runId
                        + " cannot be approved by its requester " + approver
                        + "; segregation of duties requires a different approver");
            }
            var updated = rebuildRepository.approveRun(dataSource, runId, approver, blankToNull(approvalReason));
            if (updated == 0) {
                throw new IllegalArgumentException("rebuild run " + runId
                        + " cannot be approved from status " + run.status());
            }
            return summary(rebuildRepository.findRun(dataSource, runId));
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot approve MT101 rebuild run " + runId, error);
        }
    }

    public RebuildResult executeApprovedRebuildRun(String connectionRef, String rebuildRunId, String executedBy) {
        var runId = require(rebuildRunId, "rebuildRunId");
        var executor = require(executedBy, "executedBy");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var run = rebuildRepository.findRun(dataSource, runId);
            if (run == null) {
                throw new IllegalArgumentException("rebuildRunId not found: " + runId);
            }
            if (!"APPROVED".equals(run.status())) {
                throw new IllegalArgumentException("rebuild run " + runId
                        + " must be APPROVED before execution; current status is " + run.status());
            }
            // B2: la aprobacion congela los datos. Si alguna fila cambio en staging despues
            // de aprobar, se revoca la aprobacion (vuelve a REQUESTED) y no se ejecuta con
            // datos no aprobados. Sin fallback: re-aprobacion obligatoria.
            var stale = rebuildRepository.countStaleSelections(dataSource, runId);
            if (stale > 0) {
                rebuildRepository.revertApprovalToRequested(dataSource, runId,
                        "approval invalidated: " + stale + " selected row(s) changed in staging after approval");
                throw new IllegalStateException("rebuild run " + runId + " has " + stale
                        + " selected row(s) modified in staging after approval; approval revoked, re-approval required");
            }
            var set = run.originalFragmentSetId();
            var corrective = run.correctiveSetId();
            var references = rebuildRepository.referencesFromSelection(dataSource, runId);
            if (references.isEmpty()) {
                throw new IllegalArgumentException("rebuild run " + runId + " has no selected fragments");
            }

            var metadata = fragmentRepository.findSetMetadata(dataSource, set);
            if (metadata == null || metadata.taskDefinitionId() == null) {
                throw new IllegalArgumentException("cannot resolve build metadata for fragment set " + set);
            }
            assertRebuildableFragments(
                    fragmentRepository.statusesByReferences(dataSource, set, references), references, set);

            // :20: correctivo unico por secuencia de BD (no CRC32). Sin fallback: si el run
            // no tiene reference_code, se aborta en vez de generar una referencia colisionable.
            var referenceCode = run.referenceCode();
            if (referenceCode == null || referenceCode.isBlank()) {
                throw new IllegalStateException("rebuild run " + runId
                        + " has no reference_code; cannot generate a unique corrective :20:");
            }
            // :20: = R + referenceCode + messageIndex (1..N). SWIFT limita :20: a 16 chars;
            // abortar antes de construir si el peor caso lo excede (sin truncado silencioso).
            // R-c: peor caso = una fila por fragmento (selectedRows), no el nº de fragmentos
            // originales: el correctivo puede fragmentar mas si cambian tamanos/reglas.
            var worstCaseMessages = Math.max(run.selectedRows(), references.size());
            var maxSendersReferenceLength = 1 + referenceCode.length() + String.valueOf(worstCaseMessages).length();
            if (maxSendersReferenceLength > 16) {
                throw new IllegalStateException("corrective :20: would exceed 16 chars for run " + runId
                        + " (R + " + referenceCode + " + messageIndex up to " + worstCaseMessages + ")");
            }

            // Reclamo atomico APPROVED -> BUILDING: solo un executor procede (evita doble
            // ejecucion concurrente del mismo run generando fragmentos correctivos duplicados).
            if (!rebuildRepository.claimForExecution(dataSource, runId, executor)) {
                throw new IllegalStateException("rebuild run " + runId
                        + " could not be claimed for execution (concurrent execute or status changed)");
            }
            try {
                var config = correctiveConfig(
                        buildConfigSource.buildConfig(metadata.taskDefinitionId()),
                        metadata, connectionRef, corrective, runId, referenceCode);

                var context = new TaskContext(metadata.processExecutionId(), metadata.taskDefinitionId());
                var result = buildProvider.execute(context, config);
                if (!result.success()) {
                    throw new IllegalStateException("corrective MT101 build failed for set " + corrective
                            + ": " + result.details());
                }
                var fragmentCount = result.outputs().get("fragmentCount") instanceof Number n ? n.intValue() : 0;
                var attached = rebuildRepository.attachCorrectiveRecords(dataSource, runId, corrective, set);
                if (attached != run.selectedRows()) {
                    throw new IllegalStateException("corrective MT101 build attached " + attached
                            + " source records but rebuild run " + runId + " selected " + run.selectedRows()
                            + "; corrective lineage is incomplete");
                }

                var superseded = fragmentRepository.markSupersededByReferences(
                        dataSource, set, references, corrective, REBUILDABLE_FRAGMENT_STATUS);
                if (superseded != references.size()) {
                    throw new IllegalStateException("corrective MT101 build finished but only " + superseded
                            + " of " + references.size() + " affected fragments were superseded in set " + set
                            + "; verify fragment statuses before resolving quarantine");
                }
                // El build correctivo NO resuelve el caso bancario. Deja la fila pendiente
                // de VALIDATE/ARCHIVE/PAY/STATUS/RECONCILE y el run en BUILT.
                var pending = failedRecordRepository.updateStatusByRun(
                        dataSource, set, runId, "QUARANTINED", "REBUILD_PENDING_VALIDATION");
                rebuildRepository.markStatus(dataSource, runId, "BUILT", null);
                return new RebuildResult(runId, corrective, fragmentCount, (int) run.selectedRows(), superseded, pending);
            } catch (RuntimeException | SQLException error) {
                // Cleanup de huerfanos: borra los fragmentos correctivos creados por este run
                // y revierte un supersede parcial, para que un run FAILED no deje fragmentos
                // correctivos colgando ni originales superseded a medias. Best-effort: el error
                // original se mantiene como causa (addSuppressed para no perder el del cleanup).
                var failure = error instanceof RuntimeException runtime
                        ? runtime
                        : new IllegalStateException("Cannot execute MT101 rebuild run " + runId, error);
                try {
                    fragmentRepository.revertSupersededBy(dataSource, set, corrective);
                    fragmentRepository.deleteByFragmentSet(dataSource, corrective);
                } catch (SQLException cleanupError) {
                    failure.addSuppressed(cleanupError);
                }
                try {
                    rebuildRepository.markStatus(dataSource, runId, "FAILED", error.getMessage());
                } catch (SQLException statusError) {
                    failure.addSuppressed(statusError);
                }
                throw failure;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot execute MT101 rebuild run " + runId, error);
        }
    }

    private Map<String, Object> correctiveConfig(Map<String, Object> original,
                                                 Mt101FragmentRepository.SetMetadata metadata,
                                                 String connectionRef,
                                                 String correctiveSetId,
                                                 String rebuildRunId,
                                                 String referenceCode) {
        // Copia integra del config original (envelope, reglas, format, limites...) y
        // overridea scoping + referencias correctivas para evitar colisiones :20/:21.
        var config = new LinkedHashMap<>(original);
        // Standalone (sin taskOutputs del motor): se resuelve por `source`, no por input.
        config.remove("input");
        // fragmentSetId literal (sin placeholders) -> el build lo usa tal cual.
        config.put("fragmentSetIdTemplate", correctiveSetId);
        config.put("replaceExisting", true);
        applyCorrectiveReferenceTemplates(config, referenceCode);

        var source = original.get("source") instanceof Map<?, ?> originalSource
                ? new LinkedHashMap<String, Object>(asStringKeyed(originalSource))
                : new LinkedHashMap<String, Object>();
        source.put("table", metadata.sourceTable());
        // Solo process_execution_id + rebuildRunId: las filas de staging llevan el
        // task_definition_id del DB_WRITE (no el del BUILD que guarda el fragmento), y
        // la tabla de seleccion pinpointea los record_index aprobados sin un IN masivo.
        source.put("processExecutionId", metadata.processExecutionId());
        source.remove("taskDefinitionId");
        if (connectionRef != null && !connectionRef.isBlank()) {
            source.put("connectionRef", connectionRef);
        }
        source.remove("recordIndexIn");
        source.put("rebuildRunId", rebuildRunId);
        config.put("source", source);
        return config;
    }

    private void assertRebuildableFragments(Map<String, String> statuses,
                                            List<String> references,
                                            String fragmentSetId) {
        var invalid = new ArrayList<String>();
        for (var reference : references) {
            var status = statuses.get(reference);
            if (!REBUILDABLE_FRAGMENT_STATUS.equals(status)) {
                invalid.add(reference + "=" + (status == null ? "<missing>" : status));
            }
        }
        if (!invalid.isEmpty()) {
            throw new IllegalArgumentException("cannot rebuild MT101 fragments in set " + fragmentSetId
                    + "; only " + REBUILDABLE_FRAGMENT_STATUS + " fragments can be superseded: " + invalid);
        }
    }

    private void applyCorrectiveReferenceTemplates(Map<String, Object> config, String referenceCode) {
        var sequenceA = config.get("sequenceA") instanceof Map<?, ?> rawSequenceA
                ? new LinkedHashMap<String, Object>(asStringKeyed(rawSequenceA))
                : new LinkedHashMap<String, Object>();
        sequenceA.remove("sendersReference");
        // :20: correctivo = R + codigo de secuencia del run + messageIndex (unico, no CRC32).
        sequenceA.put("sendersReferenceTemplate", "R" + referenceCode + "${messageIndex}");
        config.put("sequenceA", sequenceA);

        var mappings = config.get("transactionMappings") instanceof Map<?, ?> rawMappings
                ? new LinkedHashMap<String, Object>(asStringKeyed(rawMappings))
                : new LinkedHashMap<String, Object>();
        mappings.put("transactionReferenceTemplate", "C${_sourceRecordNumber}");
        config.put("transactionMappings", mappings);
    }

    private Map<String, Object> asStringKeyed(Map<?, ?> raw) {
        var result = new LinkedHashMap<String, Object>();
        raw.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private RebuildRunSummary summary(Mt101RebuildRepository.RebuildRun run) {
        return new RebuildRunSummary(
                run.rebuildRunId(),
                run.originalFragmentSetId(),
                run.correctiveSetId(),
                run.status(),
                run.selectedRows(),
                run.affectedFragments(),
                run.connectionRef(),
                run.payStatus(),
                run.payRequestedBy(),
                run.payApprovedBy());
    }

    public RebuildRunSummary getRebuildRun(String connectionRef, String rebuildRunId) {
        var runId = require(rebuildRunId, "rebuildRunId");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var run = rebuildRepository.findRun(dataSource, runId);
            if (run == null) {
                throw new IllegalArgumentException("rebuildRunId not found: " + runId);
            }
            return summary(run);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read MT101 rebuild run " + runId, error);
        }
    }

    public List<RebuildRunSummary> listRebuildRuns(String connectionRef, String fragmentSetId, int limit) {
        var set = require(fragmentSetId, "fragmentSetId");
        var dataSource = resolveDataSource(connectionRef);
        try {
            return rebuildRepository.listRunsByOriginalSet(dataSource, set, Math.min(Math.max(limit, 1), 100)).stream()
                    .map(this::summary)
                    .toList();
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot list MT101 rebuild runs for set " + set, error);
        }
    }

    public int synchronizeLifecycle(String connectionRef, String originalFragmentSetId) {
        var set = require(originalFragmentSetId, "fragmentSetId");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var updated = 0;
            for (var run : rebuildRepository.findRunsByOriginalSet(dataSource, set)) {
                var lifecycle = rebuildRepository.deriveLifecycleStatus(dataSource, run.correctiveSetId());
                // R6: registra el intento de sincronizacion aunque no haya avance.
                rebuildRepository.touchLifecycleSync(dataSource, run.rebuildRunId());
                rebuildRepository.syncSelectionStatusesFromCorrective(dataSource, run.rebuildRunId());
                if (lifecycle.status() == null || lifecycle.status().isBlank()) {
                    continue;
                }
                if (rebuildRepository.updateLifecycleIfAdvanced(dataSource, run, lifecycle.status())) {
                    updated++;
                }
                if ("PARTIALLY_FAILED".equalsIgnoreCase(lifecycle.status())
                        || "PARTIALLY_SENT".equalsIgnoreCase(lifecycle.status())) {
                    markPartialSelections(dataSource, set, run.rebuildRunId());
                    continue;
                }
                var quarantineStatus = quarantineStatus(lifecycle.status());
                if (quarantineStatus != null) {
                    rebuildRepository.markSelectionLifecycle(dataSource, run.rebuildRunId(), quarantineStatus);
                    failedRecordRepository.updateStatusByRun(
                            dataSource, set, run.rebuildRunId(), currentQuarantineStatus(run.status()), quarantineStatus);
                }
            }
            return updated;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot synchronize MT101 rebuild lifecycle for set " + set, error);
        }
    }

    /**
     * R6: sincroniza el lifecycle de TODOS los runs correctivos en curso, sin depender de
     * que alguien abra la pantalla de cuarentena. Lo invoca el scheduler.
     *
     * @return cuantos runs avanzaron de estado.
     */
    public int synchronizeActiveLifecycles() {
        int updated;
        try {
            updated = synchronizeActiveLifecycles(null, defaultDataSource);
        } catch (SQLException error) {
            // El datasource por defecto es critico (lo cubren los health checks): su fallo se propaga.
            throw new IllegalStateException("Cannot synchronize active MT101 rebuild lifecycles", error);
        }
        if (connectionPoolManager != null) {
            for (var connectionRef : connectionPoolManager.activeJdbcConnectionRefs()) {
                try {
                    updated += synchronizeActiveLifecycles(connectionRef,
                            connectionPoolManager.resolveJdbcDataSource(connectionRef));
                } catch (SQLException | RuntimeException error) {
                    // Una conexion JDBC externa mal configurada (p.ej. credenciales/host errados) NO
                    // debe abortar el sync de las demas ni repetirse en bucle cada tick del scheduler.
                    // Se registra fuerte y se continua: fail-loud por conexion, resiliente en el agregado.
                    LOG.errorf(error, "MT101 lifecycle sync skipped JDBC connection '%s': %s",
                            connectionRef, error.getMessage());
                }
            }
        }
        return updated;
    }

    private int synchronizeActiveLifecycles(String schedulerConnectionRef, DataSource schedulerDataSource) throws SQLException {
        var updated = rebuildRepository.markExpiredPayExecutionsUncertain(
                schedulerDataSource, java.time.LocalDateTime.now());
        for (var active : rebuildRepository.findActiveOriginalSets(schedulerDataSource)) {
            var effectiveConnectionRef = active.connectionRef() == null || active.connectionRef().isBlank()
                    ? schedulerConnectionRef
                    : active.connectionRef();
            updated += synchronizeLifecycle(effectiveConnectionRef, active.originalFragmentSetId());
        }
        return updated;
    }

    private String currentQuarantineStatus(String runStatus) {
        return switch (runStatus == null ? "" : runStatus.toUpperCase(java.util.Locale.ROOT)) {
            case "VALIDATED" -> "REBUILD_VALIDATED";
            case "ARCHIVED" -> "REBUILD_ARCHIVED";
            case "SENT", "PARTIALLY_SENT" -> "REBUILD_SENT";
            case "CONFIRMED" -> "REBUILD_CONFIRMED";
            case "RECONCILED", "RESOLVED" -> "RESOLVED";
            case "FAILED" -> "REBUILD_REJECTED";
            default -> "REBUILD_PENDING_VALIDATION";
        };
    }

    private void markPartialSelections(DataSource dataSource, String set, String rebuildRunId) throws SQLException {
        for (var from : List.of("REBUILD_PENDING_VALIDATION", "REBUILD_VALIDATED", "REBUILD_ARCHIVED")) {
            failedRecordRepository.updateStatusByRunSelectionStatus(
                    dataSource, set, rebuildRunId, from, "REBUILD_SENT", "REBUILD_SENT");
        }
        for (var from : List.of("REBUILD_PENDING_VALIDATION", "REBUILD_VALIDATED", "REBUILD_ARCHIVED", "REBUILD_SENT")) {
            failedRecordRepository.updateStatusByRunSelectionStatus(
                    dataSource, set, rebuildRunId, from, "REBUILD_REJECTED", "REBUILD_REJECTED");
        }
    }

    private String quarantineStatus(String lifecycleStatus) {
        return switch (lifecycleStatus == null ? "" : lifecycleStatus.toUpperCase(java.util.Locale.ROOT)) {
            case "BUILT" -> "REBUILD_PENDING_VALIDATION";
            case "VALIDATED" -> "REBUILD_VALIDATED";
            case "ARCHIVED" -> "REBUILD_ARCHIVED";
            case "SENT" -> "REBUILD_SENT";
            case "PARTIALLY_SENT" -> null;
            case "CONFIRMED" -> "REBUILD_CONFIRMED";
            case "RECONCILED", "RESOLVED" -> "RESOLVED";
            // B5: un correctivo con fragmentos REJECTED no se queda "pendiente de validar":
            // marca la fila como REBUILD_REJECTED para que la operacion sepa que debe
            // corregir de nuevo o abrir un run nuevo (no estado ambiguo).
            case "FAILED" -> "REBUILD_REJECTED";
            default -> null;
        };
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    public record RebuildResult(
            String rebuildRunId,
            String correctiveSetId,
            int fragmentCount,
            int rebuiltRows,
            int supersededFragments,
            int resolvedQuarantine
    ) {
    }

    public record RebuildRunSummary(
            String rebuildRunId,
            String originalFragmentSetId,
            String correctiveSetId,
            String status,
            long selectedRows,
            int affectedFragments,
            String connectionRef,
            String payStatus,
            String payRequestedBy,
            String payApprovedBy
    ) {
    }
}
