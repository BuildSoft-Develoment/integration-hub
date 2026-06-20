package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101BuildFromTableTaskProvider;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

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

    private static final String REBUILDABLE_FRAGMENT_STATUS = "REJECTED";

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
                                                          String correctiveSetId,
                                                          String requestedBy) {
        return requestRebuildFromQuarantine(connectionRef, fragmentSetId, correctiveSetId, requestedBy, null);
    }

    public RebuildRunSummary requestRebuildFromQuarantine(String connectionRef,
                                                          String fragmentSetId,
                                                          String correctiveSetId,
                                                          String requestedBy,
                                                          String requestReason) {
        var set = require(fragmentSetId, "fragmentSetId");
        var corrective = require(correctiveSetId, "correctiveSetId");
        if (corrective.equals(set)) {
            throw new IllegalArgumentException("correctiveSetId must differ from the original fragmentSetId");
        }
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

            var runId = corrective;
            rebuildRepository.createRun(dataSource, runId, set, corrective, requestedBy, blankToNull(requestReason));
            rebuildRepository.insertSelectionFromFragmentRecords(dataSource, runId, set, references);
            var selectedRows = rebuildRepository.countSelection(dataSource, runId);
            if (selectedRows == 0) {
                throw new IllegalArgumentException("cannot resolve selected rows for set " + set
                        + ". mt101_fragment_record is required; previous data is not corrected automatically.");
            }
            rebuildRepository.updateSelectionStats(dataSource, runId, selectedRows, references.size());
            return new RebuildRunSummary(runId, set, corrective, "REQUESTED", selectedRows, references.size());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot request MT101 rebuild for set " + set, error);
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
            var maxSendersReferenceLength = 1 + referenceCode.length() + String.valueOf(references.size()).length();
            if (maxSendersReferenceLength > 16) {
                throw new IllegalStateException("corrective :20: would exceed 16 chars for run " + runId
                        + " (R + " + referenceCode + " + messageIndex up to " + references.size() + ")");
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
                run.affectedFragments());
    }

    public int synchronizeLifecycle(String connectionRef, String originalFragmentSetId) {
        var set = require(originalFragmentSetId, "fragmentSetId");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var updated = 0;
            for (var run : rebuildRepository.findRunsByOriginalSet(dataSource, set)) {
                var lifecycle = rebuildRepository.deriveLifecycleStatus(dataSource, run.correctiveSetId());
                if (lifecycle.status() == null || lifecycle.status().isBlank()) {
                    continue;
                }
                if (rebuildRepository.updateLifecycleIfAdvanced(dataSource, run, lifecycle.status())) {
                    updated++;
                }
                var quarantineStatus = quarantineStatus(lifecycle.status());
                if (quarantineStatus != null) {
                    failedRecordRepository.updateStatusByRun(
                            dataSource, set, run.rebuildRunId(), currentQuarantineStatus(run.status()), quarantineStatus);
                }
            }
            return updated;
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot synchronize MT101 rebuild lifecycle for set " + set, error);
        }
    }

    private String currentQuarantineStatus(String runStatus) {
        return switch (runStatus == null ? "" : runStatus.toUpperCase(java.util.Locale.ROOT)) {
            case "VALIDATED" -> "REBUILD_VALIDATED";
            case "ARCHIVED" -> "REBUILD_ARCHIVED";
            case "SENT" -> "REBUILD_SENT";
            case "CONFIRMED" -> "REBUILD_CONFIRMED";
            case "RECONCILED", "RESOLVED" -> "RESOLVED";
            default -> "REBUILD_PENDING_VALIDATION";
        };
    }

    private String quarantineStatus(String lifecycleStatus) {
        return switch (lifecycleStatus == null ? "" : lifecycleStatus.toUpperCase(java.util.Locale.ROOT)) {
            case "BUILT" -> "REBUILD_PENDING_VALIDATION";
            case "VALIDATED" -> "REBUILD_VALIDATED";
            case "ARCHIVED" -> "REBUILD_ARCHIVED";
            case "SENT" -> "REBUILD_SENT";
            case "CONFIRMED" -> "REBUILD_CONFIRMED";
            case "RECONCILED", "RESOLVED" -> "RESOLVED";
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
            int affectedFragments
    ) {
    }
}
