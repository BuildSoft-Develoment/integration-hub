package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101ArchiveTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101PayTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ReconcileTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101RepairTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101RouteTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101StatusTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ValidateTaskProvider;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * B2': cierra el ciclo bancario del set correctivo. Tras el rebuild (run {@code BUILT}),
 * orquesta VALIDATE -> ARCHIVE sobre el set correctivo reusando los configs del proceso
 * original (no mueven dinero, se automatizan). El envio (PAY) tiene maker-checker propio:
 * un usuario lo solicita y OTRO distinto lo aprueba+ejecuta, porque PAY manda dinero real.
 *
 * <p>El estado del run lo deriva {@link Mt101RebuildService#synchronizeLifecycle} de los
 * estados de los fragmentos correctivos; aqui solo se ejecutan las tareas y se sincroniza.
 * Es reanudable: cada etapa se salta si el run ya la paso.</p>
 */
@ApplicationScoped
public class Mt101CorrectiveLifecycleService {

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Mt101RebuildRepository rebuildRepository;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101RebuildService rebuildService;
    private final Mt101CorrectiveTaskConfigSource taskConfigSource;
    private final Mt101ValidateTaskProvider validateProvider;
    private final Mt101RepairTaskProvider repairProvider;
    private final Mt101RouteTaskProvider routeProvider;
    private final Mt101ArchiveTaskProvider archiveProvider;
    private final Mt101PayTaskProvider payProvider;
    private final Mt101StatusTaskProvider statusProvider;
    private final Mt101ReconcileTaskProvider reconcileProvider;

    @Inject
    public Mt101CorrectiveLifecycleService(DataSource defaultDataSource,
                                           ConnectionPoolManager connectionPoolManager,
                                           Mt101RebuildRepository rebuildRepository,
                                           Mt101FragmentRepository fragmentRepository,
                                           Mt101RebuildService rebuildService,
                                           Mt101CorrectiveTaskConfigSource taskConfigSource,
                                           Mt101ValidateTaskProvider validateProvider,
                                           Mt101RepairTaskProvider repairProvider,
                                           Mt101RouteTaskProvider routeProvider,
                                           Mt101ArchiveTaskProvider archiveProvider,
                                           Mt101PayTaskProvider payProvider,
                                           Mt101StatusTaskProvider statusProvider,
                                           Mt101ReconcileTaskProvider reconcileProvider) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.rebuildRepository = rebuildRepository;
        this.fragmentRepository = fragmentRepository;
        this.rebuildService = rebuildService;
        this.taskConfigSource = taskConfigSource;
        this.validateProvider = validateProvider;
        this.repairProvider = repairProvider;
        this.routeProvider = routeProvider;
        this.archiveProvider = archiveProvider;
        this.payProvider = payProvider;
        this.statusProvider = statusProvider;
        this.reconcileProvider = reconcileProvider;
    }

    /**
     * Avanza el correctivo BUILT -> VALIDATED -> ARCHIVED (sin enviar). Reanudable. Si VALIDATE
     * rechaza, el lifecycle marca el run FAILED y la cuarentena REBUILD_REJECTED (no archiva).
     */
    public CorrectiveLifecycleResult advanceCorrective(String connectionRef, String rebuildRunId, String executedBy) {
        var runId = require(rebuildRunId, "rebuildRunId");
        require(executedBy, "executedBy");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var run = rebuildRepository.findRun(dataSource, runId);
            if (run == null) {
                throw new IllegalArgumentException("rebuildRunId not found: " + runId);
            }
            assertConnectionRef(run, connectionRef);
            var status = normalize(run.status());
            if ("FAILED".equals(status)) {
                throw new IllegalArgumentException("rebuild run " + runId
                        + " is FAILED; reopen the rejected rows before advancing the corrective");
            }
            var prep = prepare(dataSource, run, connectionRef);

            if ("BUILT".equals(status)) {
                runOptionalStage(repairProvider, prep, "MT101_REPAIR");
                runStage(validateProvider, prep, "MT101_VALIDATE");
                rebuildService.synchronizeLifecycle(connectionRef, run.originalFragmentSetId());
                run = rebuildRepository.findRun(dataSource, runId);
                status = normalize(run.status());
                if (!"VALIDATED".equals(status)) {
                    // VALIDATE rechazo (o no avanzo a VALIDATED): no se archiva un correctivo invalido.
                    return new CorrectiveLifecycleResult(runId, run.correctiveSetId(), run.status());
                }
            }
            if ("VALIDATED".equals(status)) {
                runStage(routeProvider, prep, "MT101_ROUTE");
                runStage(archiveProvider, prep, "MT101_ARCHIVE");
                rebuildService.synchronizeLifecycle(connectionRef, run.originalFragmentSetId());
                run = rebuildRepository.findRun(dataSource, runId);
            }
            return new CorrectiveLifecycleResult(runId, run.correctiveSetId(), run.status());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot advance corrective lifecycle for run " + runId, error);
        }
    }

    /** B2': el maker solicita el envio del correctivo (run ARCHIVED). */
    public CorrectiveLifecycleResult requestCorrectivePay(String connectionRef, String rebuildRunId, String requestedBy) {
        var runId = require(rebuildRunId, "rebuildRunId");
        var requester = require(requestedBy, "requestedBy");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var run = rebuildRepository.findRun(dataSource, runId);
            if (run == null) {
                throw new IllegalArgumentException("rebuildRunId not found: " + runId);
            }
            assertConnectionRef(run, connectionRef);
            if (!"ARCHIVED".equals(normalize(run.status()))) {
                throw new IllegalArgumentException("rebuild run " + runId
                        + " must be ARCHIVED before requesting corrective pay; current status is " + run.status());
            }
            var payloadHash = archivedPayloadHash(dataSource, run);
            var requested = rebuildRepository.requestPay(dataSource, runId, requester, payloadHash);
            if (requested == 0) {
                throw new IllegalStateException("cannot request corrective pay for run " + runId
                        + "; payStatus=" + run.payStatus());
            }
            return new CorrectiveLifecycleResult(runId, run.correctiveSetId(), run.status());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot request corrective pay for run " + runId, error);
        }
    }

    /**
     * B2': el checker (distinto del maker) aprueba y ejecuta el envio del correctivo. Esto
     * dispara la llamada SWIFT real (PAY). Tras enviar, el lifecycle pasa a SENT.
     */
    public CorrectiveLifecycleResult approveAndPayCorrective(String connectionRef, String rebuildRunId, String approvedBy) {
        var runId = require(rebuildRunId, "rebuildRunId");
        var approver = require(approvedBy, "approvedBy");
        var dataSource = resolveDataSource(connectionRef);
        try {
            var run = rebuildRepository.findRun(dataSource, runId);
            if (run == null) {
                throw new IllegalArgumentException("rebuildRunId not found: " + runId);
            }
            assertConnectionRef(run, connectionRef);
            if (!"ARCHIVED".equals(normalize(run.status()))) {
                throw new IllegalArgumentException("rebuild run " + runId
                        + " must be ARCHIVED before paying the corrective; current status is " + run.status());
            }
            var requester = rebuildRepository.payRequestedBy(dataSource, runId);
            if (requester == null) {
                throw new IllegalArgumentException("corrective pay for run " + runId
                        + " must be requested before approval");
            }
            // Segregacion de funciones: el aprobador del envio no puede ser quien lo solicito.
            if (approver.equals(requester)) {
                throw new IllegalArgumentException("corrective pay for run " + runId
                        + " cannot be approved by its requester " + approver
                        + "; segregation of duties requires a different approver");
            }
            var payloadHash = archivedPayloadHash(dataSource, run);
            if (!payloadHash.equals(run.payRequestedPayloadHash())) {
                rebuildRepository.invalidatePayRequest(dataSource, runId,
                        "PAY payload hash changed after request; request again before sending");
                throw new IllegalStateException("corrective pay for run " + runId
                        + " was invalidated because the archived payload changed after request");
            }
            if (!rebuildRepository.claimPayForExecution(dataSource, runId, approver,
                    payloadHash, LocalDateTime.now().plusMinutes(15))) {
                throw new IllegalStateException("corrective pay for run " + runId
                        + " could not be claimed for execution (concurrent approval or payStatus changed)");
            }
            var prep = prepare(dataSource, run, connectionRef);
            try {
                var payResult = runStageAllowFailure(payProvider, prep, "MT101_PAY");
                persistPayDetail(dataSource, runId, run.correctiveSetId(), payResult);
                // INCIERTO de forma TIPADA: TransportResult.uncertain (timeout/conexion tras enviar)
                // llega como uncertainCount en el output, no por heuristica de texto del error.
                var uncertainCount = intValue(payResult.outputs().get("uncertainCount"), 0);
                var summary = rebuildRepository.payFragmentSummary(dataSource, runId);
                if (uncertainCount > 0) {
                    // No sabemos si el banco recibio: estado explicito para conciliacion. NO se marca
                    // SENT ni se reenvia, y no se corren STATUS/RECONCILE (no asumir enviado).
                    rebuildRepository.markPayUncertain(dataSource, runId,
                            "PAY uncertain for " + uncertainCount + " fragment(s); reconcile with the gateway before resending");
                } else if (summary.total() == 0) {
                    rebuildRepository.markPayFailed(dataSource, runId, "MT101_PAY produced no fragment results");
                    throw new IllegalStateException("MT101_PAY produced no fragment results for run " + runId);
                } else if (summary.sent() == summary.total()) {
                    rebuildRepository.markPaySent(dataSource, runId);
                    runOptionalStageWithInput(statusProvider, prep, "MT101_STATUS",
                            payResult.outputs().getOrDefault("records", List.of()));
                    runOptionalStage(reconcileProvider, prep, "MT101_RECONCILE");
                } else if (summary.sent() > 0) {
                    rebuildRepository.markPayCompleted(dataSource, runId, "PARTIALLY_SENT",
                            "PAY sent " + summary.sent() + " of " + summary.total()
                                    + " fragment(s); rejected=" + summary.rejected());
                    runOptionalStageWithInput(statusProvider, prep, "MT101_STATUS",
                            payResult.outputs().getOrDefault("records", List.of()));
                    runOptionalStage(reconcileProvider, prep, "MT101_RECONCILE");
                } else {
                    rebuildRepository.markPayFailed(dataSource, runId,
                            payResult.details() == null ? "MT101_PAY rejected all fragments" : payResult.details());
                    throw new IllegalStateException("MT101_PAY rejected all fragments for run " + runId
                            + ": " + payResult.details());
                }
            } catch (RuntimeException error) {
                rebuildRepository.markPayFailed(dataSource, runId, error.getMessage());
                throw error;
            }
            rebuildService.synchronizeLifecycle(connectionRef, run.originalFragmentSetId());
            run = rebuildRepository.findRun(dataSource, runId);
            return new CorrectiveLifecycleResult(runId, run.correctiveSetId(), run.status());
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot pay corrective for run " + runId, error);
        }
    }

    private String archivedPayloadHash(DataSource dataSource, Mt101RebuildRepository.RebuildRun run) throws SQLException {
        var hash = rebuildRepository.archivedCorrectivePayloadHash(dataSource, run.correctiveSetId());
        if (hash == null || hash.isBlank()) {
            throw new IllegalStateException("corrective set " + run.correctiveSetId()
                    + " must be fully ARCHIVED before requesting PAY");
        }
        return hash;
    }

    private StagePrep prepare(DataSource dataSource, Mt101RebuildRepository.RebuildRun run, String connectionRef)
            throws SQLException {
        var metadata = fragmentRepository.findSetMetadata(dataSource, run.originalFragmentSetId());
        if (metadata == null || metadata.taskDefinitionId() == null || metadata.processExecutionId() == null) {
            throw new IllegalArgumentException("cannot resolve build metadata for set " + run.originalFragmentSetId());
        }
        return new StagePrep(metadata.processExecutionId(), metadata.taskDefinitionId(),
                run.correctiveSetId(), connectionRef);
    }

    private void runStage(TaskProvider provider, StagePrep prep, String taskType) {
        runStage(provider, prep, taskType, true);
    }

    private TaskResult runStageAllowFailure(TaskProvider provider, StagePrep prep, String taskType) {
        return runStage(provider, prep, taskType, false);
    }

    private void runOptionalStage(TaskProvider provider, StagePrep prep, String taskType) {
        if (taskConfigSource.taskConfig(prep.buildTaskDefinitionId(), taskType) == null) {
            return;
        }
        runStage(provider, prep, taskType);
    }

    private void runOptionalStageWithInput(TaskProvider provider, StagePrep prep, String taskType, Object input) {
        if (taskConfigSource.taskConfig(prep.buildTaskDefinitionId(), taskType) == null) {
            return;
        }
        runStage(provider, prep, taskType, true, input);
    }

    private TaskResult runStage(TaskProvider provider, StagePrep prep, String taskType, boolean failOnTaskFailure) {
        var fragmentSource = new LinkedHashMap<String, Object>();
        fragmentSource.put("fragmentSetId", prep.correctiveSetId());
        if (prep.connectionRef() != null && !prep.connectionRef().isBlank()) {
            fragmentSource.put("connectionRef", prep.connectionRef());
        }
        return runStage(provider, prep, taskType, failOnTaskFailure, fragmentSource);
    }

    private TaskResult runStage(TaskProvider provider, StagePrep prep, String taskType,
                                boolean failOnTaskFailure, Object stageInput) {
        if (provider == null) {
            throw new IllegalStateException(taskType + " provider is not available");
        }
        var config = taskConfigSource.taskConfig(prep.buildTaskDefinitionId(), taskType);
        if (config == null) {
            throw new IllegalStateException("the original process has no " + taskType
                    + " task; cannot orchestrate the corrective lifecycle for set " + prep.correctiveSetId());
        }
        var context = new TaskContext(prep.processExecutionId(), prep.buildTaskDefinitionId());
        context.attributes().put("taskOutputs", Map.of(inputKey(config, taskType), stageInput));
        TaskResult result = provider.execute(context, config);
        if (result == null || (failOnTaskFailure && !result.success())) {
            throw new IllegalStateException(taskType + " failed on corrective set " + prep.correctiveSetId()
                    + (result == null ? "" : ": " + result.details()));
        }
        return result;
    }

    private void persistPayDetail(DataSource dataSource, String runId, String correctiveSetId,
                                  TaskResult payResult) throws SQLException {
        rebuildRepository.refreshPayFragmentsFromCorrectiveSet(dataSource, runId, correctiveSetId);
        var samples = new ArrayList<Mt101RebuildRepository.PayFragmentResult>();
        samples.addAll(payResults(payResult.outputs().get("records"), "SENT"));
        samples.addAll(payResults(payResult.outputs().get("errors"), "REJECTED"));
        samples.addAll(payResults(payResult.outputs().get("uncertain"), "UNCERTAIN"));
        rebuildRepository.updatePayFragmentResults(dataSource, runId, samples);
    }

    private Collection<Mt101RebuildRepository.PayFragmentResult> payResults(Object raw, String defaultStatus) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return List.of();
        }
        var results = new ArrayList<Mt101RebuildRepository.PayFragmentResult>();
        for (var item : rawList) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }
            var ref = stringOrNull(map.get("sendersReference"));
            if (ref == null) {
                continue;
            }
            var status = normalize(stringOrNull(map.get("status")));
            if ("ACCEPTED".equals(status)) {
                status = "SENT";
            } else if (status == null || status.isBlank()) {
                status = defaultStatus;
            }
            results.add(new Mt101RebuildRepository.PayFragmentResult(
                    ref,
                    status,
                    stringOrNull(map.get("gatewayReference")),
                    intValue(map.get("attempts"), 0),
                    stringOrNull(map.get("lastError"))));
        }
        return results;
    }

    /** Clave {@code sourceTaskRef.sourceOutput} que el provider espera en taskOutputs. */
    private String inputKey(Map<String, Object> config, String taskType) {
        if (config.get("input") instanceof Map<?, ?> input) {
            var refObj = input.get("sourceTaskRef");
            var outObj = input.get("sourceOutput");
            var ref = refObj == null ? "" : String.valueOf(refObj).trim();
            var out = outObj == null ? "records" : String.valueOf(outObj).trim();
            if (!ref.isEmpty()) {
                return ref + "." + (out.isEmpty() ? "records" : out);
            }
        }
        throw new IllegalStateException(taskType + " config has no input.sourceTaskRef to wire the corrective fragment source");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(java.util.Locale.ROOT);
    }

    private String stringOrNull(Object raw) {
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        if (raw instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(raw));
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

    private void assertConnectionRef(Mt101RebuildRepository.RebuildRun run, String requestConnectionRef) {
        var persisted = run.connectionRef();
        if (persisted == null || persisted.isBlank()) {
            return;
        }
        var requested = requestConnectionRef == null ? "" : requestConnectionRef.trim();
        if (!persisted.equals(requested)) {
            throw new IllegalArgumentException("rebuild run " + run.rebuildRunId()
                    + " belongs to connectionRef " + persisted + " but request used "
                    + (requested.isBlank() ? "<default>" : requested));
        }
    }

    private record StagePrep(long processExecutionId, long buildTaskDefinitionId,
                             String correctiveSetId, String connectionRef) {
    }

    public record CorrectiveLifecycleResult(String rebuildRunId, String correctiveSetId, String status) {
    }
}
