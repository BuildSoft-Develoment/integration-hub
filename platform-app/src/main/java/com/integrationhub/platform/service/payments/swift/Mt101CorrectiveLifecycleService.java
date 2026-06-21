package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.Mt101ArchiveTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101PayTaskProvider;
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
import java.util.LinkedHashMap;
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
    private final Mt101ArchiveTaskProvider archiveProvider;
    private final Mt101PayTaskProvider payProvider;

    @Inject
    public Mt101CorrectiveLifecycleService(DataSource defaultDataSource,
                                           ConnectionPoolManager connectionPoolManager,
                                           Mt101RebuildRepository rebuildRepository,
                                           Mt101FragmentRepository fragmentRepository,
                                           Mt101RebuildService rebuildService,
                                           Mt101CorrectiveTaskConfigSource taskConfigSource,
                                           Mt101ValidateTaskProvider validateProvider,
                                           Mt101ArchiveTaskProvider archiveProvider,
                                           Mt101PayTaskProvider payProvider) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.rebuildRepository = rebuildRepository;
        this.fragmentRepository = fragmentRepository;
        this.rebuildService = rebuildService;
        this.taskConfigSource = taskConfigSource;
        this.validateProvider = validateProvider;
        this.archiveProvider = archiveProvider;
        this.payProvider = payProvider;
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
            var requested = rebuildRepository.requestPay(dataSource, runId, requester);
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
            if (!rebuildRepository.claimPayForExecution(dataSource, runId, approver)) {
                throw new IllegalStateException("corrective pay for run " + runId
                        + " could not be claimed for execution (concurrent approval or payStatus changed)");
            }
            var prep = prepare(dataSource, run, connectionRef);
            try {
                runStage(payProvider, prep, "MT101_PAY");
                rebuildRepository.markPaySent(dataSource, runId);
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
        var config = taskConfigSource.taskConfig(prep.buildTaskDefinitionId(), taskType);
        if (config == null) {
            throw new IllegalStateException("the original process has no " + taskType
                    + " task; cannot orchestrate the corrective lifecycle for set " + prep.correctiveSetId());
        }
        // Siembra el fragment-source del correctivo en taskOutputs (los providers leen de ahi
        // por input.sourceTaskRef), para que la tarea opere sobre el set correctivo.
        var fragmentSource = new LinkedHashMap<String, Object>();
        fragmentSource.put("fragmentSetId", prep.correctiveSetId());
        if (prep.connectionRef() != null && !prep.connectionRef().isBlank()) {
            fragmentSource.put("connectionRef", prep.connectionRef());
        }
        var context = new TaskContext(prep.processExecutionId(), prep.buildTaskDefinitionId());
        context.attributes().put("taskOutputs", Map.of(inputKey(config, taskType), fragmentSource));
        TaskResult result = provider.execute(context, config);
        if (result == null || !result.success()) {
            throw new IllegalStateException(taskType + " failed on corrective set " + prep.correctiveSetId()
                    + (result == null ? "" : ": " + result.details()));
        }
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
