package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ArchiveTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101PayTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101PayRouteResolver;
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
import com.integrationhub.platform.spi.task.payments.Mt101Message;
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
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

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
                    return correctiveResult(dataSource, runId);
                }
            }
            if ("VALIDATED".equals(status)) {
                runStage(routeProvider, prep, "MT101_ROUTE");
                runStage(archiveProvider, prep, "MT101_ARCHIVE");
                rebuildService.synchronizeLifecycle(connectionRef, run.originalFragmentSetId());
                run = rebuildRepository.findRun(dataSource, runId);
            }
            return correctiveResult(dataSource, runId);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot advance corrective lifecycle for run " + runId, error);
        }
    }

    /**
     * B2': el maker solicita el envio del correctivo (run ARCHIVED) dejando motivo/ticket de negocio
     * como evidencia durable de la solicitud (auditoria maker-checker, simetrica a la resolucion).
     * P0.3 v24: motivo y ticket son OBLIGATORIOS en el backend (no se delega al frontend): un PAY sin
     * justificacion de negocio se rechaza aqui, no exista o no la UI. Sin overload legacy sin motivo.
     */
    public CorrectiveLifecycleResult requestCorrectivePay(String connectionRef, String rebuildRunId, String requestedBy,
                                                          String requestReason, String requestTicket) {
        var runId = require(rebuildRunId, "rebuildRunId");
        var requester = require(requestedBy, "requestedBy");
        var reason = require(requestReason, "reason");
        var ticket = require(requestTicket, "ticketRef");
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
            var prep = prepare(dataSource, run, connectionRef);
            var payloadHash = archivedPayloadHash(dataSource, run);
            var payConfig = stageConfig(prep, "MT101_PAY");
            if (payConfig == null) {
                throw new IllegalStateException("the original process has no MT101_PAY task; cannot request corrective PAY");
            }
            assertCorrectivePayPolicy(payConfig);
            var configHash = payConfigHashOf(payConfig);
            // P0.1 v24: el cambio de estado y su accion auditada ocurren en UNA sola transaccion: si
            // falla el insert de auditoria, se revierte el cambio de pay_status (no queda estado sin
            // evidencia). Sin secuencia de dos conexiones separadas.
            var requested = rebuildRepository.requestPayWithAction(dataSource, runId, requester,
                    payloadHash, configHash, reason, ticket, run.payStatus());
            if (requested == 0) {
                throw new IllegalStateException("cannot request corrective pay for run " + runId
                        + "; payStatus=" + run.payStatus());
            }
            return correctiveResult(dataSource, runId);
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
            var prep = prepare(dataSource, run, connectionRef);
            var payloadHash = archivedPayloadHash(dataSource, run);
            if (!payloadHash.equals(run.payRequestedPayloadHash())) {
                rebuildRepository.invalidatePayRequest(dataSource, runId,
                        "PAY payload hash changed after request; request again before sending");
                recordPayAction(dataSource, runId, "PAY_INVALIDATED", run.payStatus(), "INVALIDATED",
                        approver, "archived payload changed after request", null, payloadHash, null);
                throw new IllegalStateException("corrective pay for run " + runId
                        + " was invalidated because the archived payload changed after request");
            }
            // P0.1 v23: "configuracion aprobada = configuracion usada para enviar". Se lee la config de
            // MT101_PAY UNA sola vez (snapshot congelado), se hashea ESE objeto, se valida contra el hash
            // de la solicitud, y los MISMOS bytes se usan para preparar intents y para despachar. Asi no
            // hay ventana de re-lectura entre el hash y el envio (sin fallback a config dinamica vigente).
            var frozenPayConfig = stageConfig(prep, "MT101_PAY");
            if (frozenPayConfig == null) {
                throw new IllegalStateException("the original process has no MT101_PAY task; cannot pay corrective");
            }
            assertCorrectivePayPolicy(frozenPayConfig);
            var configHash = payConfigHashOf(frozenPayConfig);
            var requestedConfigHash = rebuildRepository.payRequestedConfigHash(dataSource, runId);
            if (!configHash.equals(requestedConfigHash)) {
                rebuildRepository.invalidatePayRequest(dataSource, runId,
                        "PAY configuration changed after request; request again before sending");
                recordPayAction(dataSource, runId, "PAY_INVALIDATED", run.payStatus(), "INVALIDATED",
                        approver, "MT101_PAY configuration changed after request", null, payloadHash, configHash);
                throw new IllegalStateException("corrective pay for run " + runId
                        + " was invalidated because the MT101_PAY configuration changed after request");
            }
            if (!rebuildRepository.claimPayForExecution(dataSource, runId, approver,
                    payloadHash, configHash, LocalDateTime.now().plusMinutes(15))) {
                throw new IllegalStateException("corrective pay for run " + runId
                        + " could not be claimed for execution (concurrent approval or payStatus changed)");
            }
            recordPayAction(dataSource, runId, "PAY_CLAIMED", "REQUESTED", "EXECUTING",
                    approver, null, null, payloadHash, configHash);
            // Hardening v23: congela el perfil de MT101_STATUS usado al enviar, para que la resolucion
            // diferida de un PAY_UNCERTAIN consulte ese perfil (no la config vigente, que pudo cambiar).
            var frozenStatusConfig = stageConfig(prep, "MT101_STATUS");
            if (frozenStatusConfig != null) {
                try {
                    rebuildRepository.freezePayStatusConfig(dataSource, runId,
                            objectMapper.writeValueAsString(frozenStatusConfig));
                } catch (JsonProcessingException error) {
                    throw new IllegalStateException("cannot freeze MT101_STATUS config for run " + runId, error);
                }
            }
            rebuildRepository.refreshPayFragmentsFromCorrectiveSet(dataSource, runId, run.correctiveSetId());
            preparePayIntents(dataSource, runId, run.correctiveSetId(), frozenPayConfig);
            recordPayAction(dataSource, runId, "PAY_DISPATCHING", "EXECUTING", "DISPATCHING",
                    approver, null, null, payloadHash, configHash);
            try {
                var payResult = runStage(payProvider, prep, "MT101_PAY", false,
                        correctiveFragmentPaySource(runId, prep), null, frozenPayConfig);
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
                    rebuildRepository.markPayFragmentsUncertain(dataSource, runId,
                            "PAY uncertain for " + uncertainCount + " fragment(s); reconcile with the gateway before resending");
                    recordPayAction(dataSource, runId, "PAY_UNCERTAIN", "EXECUTING", "UNCERTAIN",
                            approver, "uncertain fragments=" + uncertainCount, null, payloadHash, configHash);
                } else if (summary.total() == 0) {
                    rebuildRepository.markPayFailed(dataSource, runId, "MT101_PAY produced no fragment results");
                    recordPayAction(dataSource, runId, "PAY_REJECTED", "EXECUTING", "FAILED",
                            approver, "MT101_PAY produced no fragment results", null, payloadHash, configHash);
                    throw new IllegalStateException("MT101_PAY produced no fragment results for run " + runId);
                } else if (summary.sent() == summary.total()) {
                    rebuildRepository.markPaySent(dataSource, runId);
                    recordPayAction(dataSource, runId, "PAY_SENT", "EXECUTING", "SENT",
                            approver, null, null, payloadHash, configHash);
                    runPostPaySync(prep, "MT101_STATUS", statusProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, true, frozenStatusConfig);
                    runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, false);
                } else if (summary.sent() > 0) {
                    rebuildRepository.markPayCompleted(dataSource, runId, "PARTIALLY_SENT",
                            "PAY sent " + summary.sent() + " of " + summary.total()
                                    + " fragment(s); rejected=" + summary.rejected());
                    recordPayAction(dataSource, runId, "PAY_PARTIALLY_SENT", "EXECUTING", "PARTIALLY_SENT",
                            approver, "sent=" + summary.sent() + " rejected=" + summary.rejected(), null,
                            payloadHash, configHash);
                    runPostPaySync(prep, "MT101_STATUS", statusProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, true, frozenStatusConfig);
                    runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, false);
                } else {
                    rebuildRepository.markPayFailed(dataSource, runId,
                            payResult.details() == null ? "MT101_PAY rejected all fragments" : payResult.details());
                    recordPayAction(dataSource, runId, "PAY_REJECTED", "EXECUTING", "FAILED",
                            approver, payResult.details(), null, payloadHash, configHash);
                    throw new IllegalStateException("MT101_PAY rejected all fragments for run " + runId
                            + ": " + payResult.details());
                }
            } catch (RuntimeException error) {
                // P0.2 v21: si ya se despacho algun fragmento (DISPATCHING/SENT/UNCERTAIN), el mensaje
                // pudo llegar al banco -> NUNCA FAILED (reusable -> doble pago). Se marca UNCERTAIN.
                if (rebuildRepository.hasDispatchedPayFragments(dataSource, runId)) {
                    rebuildRepository.markPayUncertain(dataSource, runId,
                            "PAY interrupted after dispatching at least one fragment: " + error.getMessage()
                                    + "; reconcile with the gateway before any resend");
                    rebuildRepository.markPayFragmentsUncertain(dataSource, runId,
                            "PAY interrupted after dispatch; reconcile before any resend");
                    recordPayAction(dataSource, runId, "PAY_UNCERTAIN", "EXECUTING", "UNCERTAIN",
                            approver, "interrupted after dispatch: " + error.getMessage(), null, payloadHash, configHash);
                } else {
                    rebuildRepository.markPayFailed(dataSource, runId, error.getMessage());
                    recordPayAction(dataSource, runId, "PAY_REJECTED", "EXECUTING", "FAILED",
                            approver, error.getMessage(), null, payloadHash, configHash);
                }
                throw error;
            }
            rebuildService.synchronizeLifecycle(connectionRef, run.originalFragmentSetId());
            run = rebuildRepository.findRun(dataSource, runId);
            return correctiveResult(dataSource, runId);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot pay corrective for run " + runId, error);
        }
    }

    /** v24: historial append-only completo de acciones PAY de un run, para trazabilidad operativa E2E. */
    public List<Mt101RebuildRepository.PayAction> listPayActions(String connectionRef, String rebuildRunId) {
        var runId = require(rebuildRunId, "rebuildRunId");
        var dataSource = resolveDataSource(connectionRef);
        try {
            return rebuildRepository.payActions(dataSource, runId);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot list corrective PAY actions for run " + runId, error);
        }
    }

    /**
     * Resuelve un PAY_UNCERTAIN consultando MT101_STATUS (nunca reenvia). El motivo de negocio del
     * operador es OBLIGATORIO en el backend (P0.3 v24): queda en la evidencia de resolucion JUNTO al
     * detalle tecnico que devuelve el sistema, no en su lugar. Sin overload legacy sin motivo.
     */
    public CorrectiveLifecycleResult resolveUncertainPay(String connectionRef, String rebuildRunId,
                                                         String executedBy, String resolutionReason) {
        var runId = require(rebuildRunId, "rebuildRunId");
        require(executedBy, "executedBy");
        var reason = require(resolutionReason, "reason");
        var reasonPrefix = reason + " | ";
        var dataSource = resolveDataSource(connectionRef);
        try {
            var run = rebuildRepository.findRun(dataSource, runId);
            if (run == null) {
                throw new IllegalArgumentException("rebuildRunId not found: " + runId);
            }
            assertConnectionRef(run, connectionRef);
            if (!"UNCERTAIN".equals(normalize(run.payStatus()))) {
                throw new IllegalArgumentException("rebuild run " + runId
                        + " must have payStatus UNCERTAIN to resolve PAY; current payStatus is " + run.payStatus());
            }
            var prep = prepare(dataSource, run, connectionRef);
            var statusOverrides = new LinkedHashMap<String, Object>();
            // P1 v21: tambien DISPATCHING (un crash tras marcar DISPATCHING queda asi); se consulta
            // STATUS, nunca se reenvia a ciegas.
            statusOverrides.put("correctivePayStatuses", List.of("UNCERTAIN", "DISPATCHING"));
            statusOverrides.put("resolveCorrectivePay", true);
            // Hardening v23: si el PAY congelo el perfil de MT101_STATUS, la resolucion consulta ESE perfil
            // (no la config vigente, que pudo cambiar entre el envio y esta resolucion). Sin fallback.
            var frozenStatusConfig = frozenStatusConfig(dataSource, runId);
            try {
                runStage(statusProvider, prep, "MT101_STATUS", true,
                        correctivePaySource(runId, connectionRef), statusOverrides, frozenStatusConfig);
                rebuildRepository.markStatusSync(dataSource, runId, "OK", null);
            } catch (RuntimeException error) {
                rebuildRepository.markStatusSync(dataSource, runId, "FAILED", error.getMessage());
                throw error;
            }

            rebuildRepository.syncCorrectiveBuildFragmentsFromPay(dataSource, runId);
            var summary = rebuildRepository.payFragmentSummary(dataSource, runId);
            if (summary.total() == 0) {
                throw new IllegalStateException("no corrective PAY fragment ledger exists for run " + runId);
            }
            String resolvedStatus;
            String resolvedDetail;
            if (summary.pending() > 0) {
                resolvedStatus = "UNCERTAIN";
                resolvedDetail = reasonPrefix + "MT101_STATUS did not return a final accepted/rejected status for "
                        + summary.pending() + " fragment(s)";
                rebuildRepository.markPayResolution(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
            } else if (summary.sent() == summary.total()) {
                resolvedStatus = "SENT";
                resolvedDetail = reasonPrefix + "resolved by MT101_STATUS: all fragments sent";
                rebuildRepository.markPayResolution(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
                runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                        correctivePaySource(runId, connectionRef), dataSource, runId, false);
            } else if (summary.sent() > 0) {
                resolvedStatus = "PARTIALLY_SENT";
                resolvedDetail = reasonPrefix + "PAY resolved by MT101_STATUS: sent=" + summary.sent()
                        + ", rejected=" + summary.rejected();
                rebuildRepository.markPayResolution(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
                runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                        correctivePaySource(runId, connectionRef), dataSource, runId, false);
            } else {
                resolvedStatus = "FAILED";
                resolvedDetail = reasonPrefix + "PAY resolved by MT101_STATUS: all fragments rejected";
                rebuildRepository.markPayResolution(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
            }
            recordPayAction(dataSource, runId, "PAY_RESOLVED", "UNCERTAIN", resolvedStatus,
                    executedBy, resolvedDetail, null, null, null);
            rebuildService.synchronizeLifecycle(connectionRef, run.originalFragmentSetId());
            run = rebuildRepository.findRun(dataSource, runId);
            return correctiveResult(dataSource, runId);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot resolve uncertain PAY for run " + runId, error);
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
        if (stageConfig(prep, taskType) == null) {
            return;
        }
        runStage(provider, prep, taskType);
    }

    private void runOptionalStageWithInput(TaskProvider provider, StagePrep prep, String taskType, Object input) {
        if (stageConfig(prep, taskType) == null) {
            return;
        }
        runStage(provider, prep, taskType, true, input);
    }

    /**
     * P2 v20: ejecuta STATUS/RECONCILE DESPUES de que el PAY ya salio. Un fallo aqui NO revierte el
     * pago (no lanza al operador): se registra en su propio estado (OK/FAILED/SKIPPED) para que se
     * lea "el pago salio; fallo la consulta posterior" en vez de "el PAY fallo". No reintenta PAY.
     */
    private void runPostPaySync(StagePrep prep, String taskType, TaskProvider provider, Object input,
                                DataSource dataSource, String runId, boolean isStatus) throws SQLException {
        runPostPaySync(prep, taskType, provider, input, dataSource, runId, isStatus, null);
    }

    /**
     * Hardening v24: el STATUS post-PAY normal usa el MISMO snapshot congelado de la config de STATUS
     * que la resolucion de inciertos (no la config vigente, que pudo cambiar). Se pasa {@code frozenBaseConfig}.
     */
    private void runPostPaySync(StagePrep prep, String taskType, TaskProvider provider, Object input,
                                DataSource dataSource, String runId, boolean isStatus,
                                Map<String, Object> frozenBaseConfig) throws SQLException {
        if (frozenBaseConfig == null && stageConfig(prep, taskType) == null) {
            setPostPaySync(dataSource, runId, isStatus, "SKIPPED", null);
            return;
        }
        try {
            var result = runStage(provider, prep, taskType, false, input, null, frozenBaseConfig);
            if (result != null && !result.success()) {
                setPostPaySync(dataSource, runId, isStatus, "FAILED", result.details());
            } else {
                setPostPaySync(dataSource, runId, isStatus, "OK", null);
            }
        } catch (RuntimeException error) {
            setPostPaySync(dataSource, runId, isStatus, "FAILED", error.getMessage());
        }
    }

    private void setPostPaySync(DataSource dataSource, String runId, boolean isStatus, String status, String error)
            throws SQLException {
        if (isStatus) {
            rebuildRepository.markStatusSync(dataSource, runId, status, error);
        } else {
            rebuildRepository.markReconciliation(dataSource, runId, status, error);
        }
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
        return runStage(provider, prep, taskType, failOnTaskFailure, stageInput, null);
    }

    private TaskResult runStage(TaskProvider provider, StagePrep prep, String taskType,
                                boolean failOnTaskFailure, Object stageInput,
                                Map<String, Object> configOverrides) {
        return runStage(provider, prep, taskType, failOnTaskFailure, stageInput, configOverrides, null);
    }

    /**
     * Variante con {@code frozenBaseConfig}: cuando se pasa, NO se re-lee la config del task
     * definition; se despacha con el snapshot congelado (P0.1 v23, "aprobado = enviado"). Sin
     * fallback: si viene null se lee la config vigente (etapas no-PAY).
     */
    private TaskResult runStage(TaskProvider provider, StagePrep prep, String taskType,
                                boolean failOnTaskFailure, Object stageInput,
                                Map<String, Object> configOverrides, Map<String, Object> frozenBaseConfig) {
        if (provider == null) {
            throw new IllegalStateException(taskType + " provider is not available");
        }
        var baseConfig = frozenBaseConfig != null ? frozenBaseConfig
                : taskConfigSource.taskConfig(prep.buildTaskDefinitionId(), taskType);
        if (baseConfig == null) {
            throw new IllegalStateException("the original process has no " + taskType
                    + " task; cannot orchestrate the corrective lifecycle for set " + prep.correctiveSetId());
        }
        var config = new LinkedHashMap<String, Object>(baseConfig);
        if (configOverrides != null && !configOverrides.isEmpty()) {
            config.putAll(configOverrides);
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

    private Map<String, Object> stageConfig(StagePrep prep, String taskType) {
        return taskConfigSource.taskConfig(prep.buildTaskDefinitionId(), taskType);
    }

    private String payConfigHash(StagePrep prep) {
        var payConfig = stageConfig(prep, "MT101_PAY");
        if (payConfig == null) {
            throw new IllegalStateException("the original process has no MT101_PAY task; cannot request corrective PAY");
        }
        return payConfigHashOf(payConfig);
    }

    /**
     * P0/P1 v23: para PAY correctivo se prohibe {@code sftp.remoteDuplicatePolicy=OVERWRITE}:
     * sobrescribir el archivo final del banco puede re-entregar una instruccion de pago. Las politicas
     * seguras son {@code SKIP_IF_SAME_HASH} (default, idempotente) y {@code FAIL}. Se valida tanto en la
     * config base como por ruta (routeTransports.*). Sin fallback: se rechaza la solicitud/aprobacion.
     */
    private void assertCorrectivePayPolicy(Map<String, Object> payConfig) {
        assertSftpPolicy(payConfig);
        if (payConfig.get("routeTransports") instanceof Map<?, ?> routes) {
            for (var routeCfg : routes.values()) {
                if (routeCfg instanceof Map<?, ?> route) {
                    assertSftpPolicy(route);
                }
            }
        }
    }

    private void assertSftpPolicy(Map<?, ?> config) {
        if (!(config.get("sftp") instanceof Map<?, ?> sftp)) {
            return;
        }
        var policy = sftp.get("remoteDuplicatePolicy");
        if (policy == null) {
            return;
        }
        // P0.4 v24: para PAY correctivo solo SKIP_IF_SAME_HASH (idempotente) y FAIL son seguras. OVERWRITE
        // y RENAME_WITH_SUFFIX pueden re-entregar una instruccion de pago (sobrescribir el final, o crear
        // un archivo nuevo que el banco trate como nueva instruccion). Sin fallback: se rechazan ambas.
        var normalized = String.valueOf(policy).trim().toUpperCase(java.util.Locale.ROOT);
        if ("OVERWRITE".equals(normalized) || "RENAME_WITH_SUFFIX".equals(normalized)) {
            throw new IllegalArgumentException("corrective PAY must not use sftp.remoteDuplicatePolicy="
                    + normalized + "; use SKIP_IF_SAME_HASH (idempotent) or FAIL to avoid re-delivering a "
                    + "payment instruction");
        }
    }

    /**
     * v23: deserializa el snapshot congelado de la config de MT101_STATUS (perfil usado al enviar). Si no
     * hay snapshot (p. ej. el proceso no tiene STATUS), devuelve {@code null} y {@code runStage} usa la
     * config vigente. Sin fallback cuando SI existe snapshot: se usa exactamente ese perfil.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> frozenStatusConfig(DataSource dataSource, String runId) throws SQLException {
        var snapshot = rebuildRepository.payStatusConfigSnapshot(dataSource, runId);
        if (snapshot == null || snapshot.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(snapshot, LinkedHashMap.class);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("cannot read frozen MT101_STATUS config for run " + runId, error);
        }
    }

    /** v23: registra una accion del ciclo PAY en el historial inmutable (append-only). */
    private void recordPayAction(DataSource dataSource, String runId, String actionType,
                                 String previousStatus, String newStatus, String actor,
                                 String reason, String ticket, String payloadHash, String configHash) {
        try {
            rebuildRepository.recordPayAction(dataSource, runId, actionType, previousStatus, newStatus,
                    actor, reason, ticket, payloadHash, configHash);
        } catch (SQLException error) {
            throw new IllegalStateException("cannot record corrective PAY action " + actionType
                    + " for run " + runId, error);
        }
    }

    /** Hash canonico de un snapshot de config de MT101_PAY (mismo objeto que se hashea y se envia). */
    private String payConfigHashOf(Map<String, Object> payConfig) {
        try {
            return java.util.HexFormat.of().formatHex(sha256(objectMapper.writeValueAsString(canonicalize(payConfig))));
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Cannot canonicalize MT101_PAY configuration", error);
        }
    }

    private Object canonicalize(Object value) {
        if (value instanceof Map<?, ?> rawMap) {
            var sortedKeys = new ArrayList<String>();
            for (var key : rawMap.keySet()) {
                sortedKeys.add(String.valueOf(key));
            }
            sortedKeys.sort(String::compareTo);
            var result = new LinkedHashMap<String, Object>();
            for (var key : sortedKeys) {
                result.put(key, canonicalize(rawMap.get(key)));
            }
            return result;
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream().map(this::canonicalize).toList();
        }
        return value;
    }

    private Map<String, Object> correctivePaySource(String runId, String connectionRef) {
        var source = new LinkedHashMap<String, Object>();
        source.put("correctivePayRunId", runId);
        if (connectionRef != null && !connectionRef.isBlank()) {
            source.put("connectionRef", connectionRef);
        }
        return source;
    }

    private Map<String, Object> correctiveFragmentPaySource(String runId, StagePrep prep) {
        var source = new LinkedHashMap<String, Object>();
        source.put("fragmentSetId", prep.correctiveSetId());
        source.put("correctivePayRunId", runId);
        if (prep.connectionRef() != null && !prep.connectionRef().isBlank()) {
            source.put("connectionRef", prep.connectionRef());
        }
        return source;
    }

    private void preparePayIntents(DataSource dataSource, String runId, String correctiveSetId,
                                   Map<String, Object> payConfig) throws SQLException {
        if (payConfig == null) {
            throw new IllegalStateException("the original process has no MT101_PAY task; cannot prepare PAY intents");
        }
        var pageSize = intValue(payConfig.get("pageSize"), 200);
        var afterIndex = 0;
        while (true) {
            var rows = fragmentRepository.readRoutedPage(dataSource, correctiveSetId, List.of("ARCHIVED"),
                    afterIndex, pageSize);
            if (rows.isEmpty()) {
                return;
            }
            var intents = new ArrayList<Mt101RebuildRepository.PayFragmentIntent>(rows.size());
            for (var row : rows) {
                afterIndex = row.fragmentIndex();
                var message = parseMessage(row.messageJson());
                var reference = message.sequenceA() == null ? null : message.sequenceA().sendersReference();
                if (reference == null || reference.isBlank()) {
                    continue;
                }
                var plan = Mt101PayRouteResolver.resolve(payConfig, row.routedAs(), row.routeError(), message);
                var key = plan.endpointRef();
                intents.add(new Mt101RebuildRepository.PayFragmentIntent(
                        correctiveSetId,
                        reference,
                        null,
                        null,
                        null,
                        payloadHash(message),
                        key,
                        plan.transport(),
                        key));
            }
            rebuildRepository.preparePayIntents(dataSource, runId, intents);
            if (rows.size() < pageSize) {
                return;
            }
        }
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

    private Mt101Message parseMessage(String json) {
        try {
            return objectMapper.readValue(json, Mt101Message.class);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("Cannot deserialize corrective MT101 fragment", error);
        }
    }

    private String payloadHash(Mt101Message message) {
        return java.util.HexFormat.of().formatHex(sha256(message.rawPayload()));
    }

    private byte[] sha256(String value) {
        try {
            return java.security.MessageDigest.getInstance("SHA-256")
                    .digest((value == null ? "" : value).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
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

    public record CorrectiveLifecycleResult(String rebuildRunId, String correctiveSetId, String status,
                                            String payStatus, String statusSyncStatus, String reconciliationStatus,
                                            String payRequestReason, String payRequestTicket,
                                            String payResolvedBy, String payResolutionReason) {
    }

    /**
     * Construye el resultado RELEYENDO el run tras el cambio de estado (P2 v23): asi la respuesta
     * refleja el {@code pay_status} recien aplicado (p. ej. REQUESTED), no el snapshot previo. Incluye
     * la evidencia de gobierno (motivo/ticket de la solicitud y actor/motivo de la resolucion) para
     * que el operador la vea por API, no solo en BD. Lee tambien los estados de sync post-PAY (P2 v20).
     */
    private CorrectiveLifecycleResult correctiveResult(DataSource dataSource, String runId) throws SQLException {
        var run = rebuildRepository.findRun(dataSource, runId);
        if (run == null) {
            throw new IllegalStateException("rebuild run disappeared while building result: " + runId);
        }
        var sync = rebuildRepository.payStageSync(dataSource, runId);
        return new CorrectiveLifecycleResult(runId, run.correctiveSetId(), run.status(),
                run.payStatus(), sync.statusSyncStatus(), sync.reconciliationStatus(),
                run.payRequestReason(), run.payRequestTicket(),
                run.payResolvedBy(), run.payResolutionReason());
    }
}
