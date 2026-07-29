package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.platform.spi.engine.ConfigurationMapper;
import com.integrationhub.platform.spi.engine.ProcessTaskConfigSource;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.vertical.swift.mt101.provider.task.Mt101ArchiveTaskProvider;
import com.integrationhub.vertical.swift.mt101.provider.task.Mt101PayTaskProvider;
import com.integrationhub.vertical.swift.mt101.provider.Mt101DispatchPlanCompiler;
import com.integrationhub.vertical.swift.mt101.provider.Mt101PayRouteResolver;
import com.integrationhub.vertical.swift.mt101.provider.task.Mt101SftpSinkConnectionResolver;
import com.integrationhub.vertical.swift.mt101.provider.task.Mt101ReconcileTaskProvider;
import com.integrationhub.vertical.swift.mt101.provider.task.Mt101RepairTaskProvider;
import com.integrationhub.vertical.swift.mt101.provider.task.Mt101RouteTaskProvider;
import com.integrationhub.vertical.swift.mt101.provider.task.Mt101StatusTaskProvider;
import com.integrationhub.vertical.swift.mt101.provider.task.Mt101ValidateTaskProvider;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.vertical.swift.mt101.repository.Mt101RebuildRepository;
import com.integrationhub.platform.spi.engine.JdbcConnectionResolver;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
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

    // v40-bis: ventana de obsolescencia de la RESERVA de preparacion del plan. Si un maker reserva el run
    // (PREPARING_PLAN) y muere antes de concretar la solicitud, otro maker puede reclamar la reserva pasados
    // estos segundos. La preparacion (compilar/persistir specs) es de milisegundos; 120s es holgado y evita
    // dejar el run atascado por un proceso caido.
    private static final int PLAN_RESERVATION_STALE_SECONDS = 120;

    private final DataSource defaultDataSource;
    private final JdbcConnectionResolver connectionPoolManager;
    private final Mt101RebuildRepository rebuildRepository;
    private final Mt101FragmentRepository fragmentRepository;
    private final Mt101RebuildService rebuildService;
    private final ProcessTaskConfigSource taskConfigSource;
    /** v27 P0.2: re-resuelve los ${secret:...} de un snapshot congelado, con Vault fresco al ejecutar. */
    private final ConfigurationMapper configurationMapper;
    private final Mt101ValidateTaskProvider validateProvider;
    private final Mt101RepairTaskProvider repairProvider;
    private final Mt101RouteTaskProvider routeProvider;
    private final Mt101ArchiveTaskProvider archiveProvider;
    private final Mt101PayTaskProvider payProvider;
    private final Mt101StatusTaskProvider statusProvider;
    private final Mt101ReconcileTaskProvider reconcileProvider;
    // ADR-017: resuelve+congela la conexion SFTP desde una fuente OUTPUT/BOTH (sftp.sinkRef) ANTES de compilar el
    // spec ejecutable del correctivo, para que el host resuelto quede snapshotteado (no el sinkRef como ref viva).
    private final Mt101SftpSinkConnectionResolver sinkConnectionResolver;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Inject
    public Mt101CorrectiveLifecycleService(DataSource defaultDataSource,
                                           JdbcConnectionResolver connectionPoolManager,
                                           Mt101RebuildRepository rebuildRepository,
                                           Mt101FragmentRepository fragmentRepository,
                                           Mt101RebuildService rebuildService,
                                           ProcessTaskConfigSource taskConfigSource,
                                           ConfigurationMapper configurationMapper,
                                           Mt101ValidateTaskProvider validateProvider,
                                           Mt101RepairTaskProvider repairProvider,
                                           Mt101RouteTaskProvider routeProvider,
                                           Mt101ArchiveTaskProvider archiveProvider,
                                           Mt101PayTaskProvider payProvider,
                                           Mt101StatusTaskProvider statusProvider,
                                           Mt101ReconcileTaskProvider reconcileProvider,
                                           Mt101SftpSinkConnectionResolver sinkConnectionResolver) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.rebuildRepository = rebuildRepository;
        this.fragmentRepository = fragmentRepository;
        this.rebuildService = rebuildService;
        this.taskConfigSource = taskConfigSource;
        this.configurationMapper = configurationMapper;
        this.validateProvider = validateProvider;
        this.repairProvider = repairProvider;
        this.routeProvider = routeProvider;
        this.archiveProvider = archiveProvider;
        this.payProvider = payProvider;
        this.statusProvider = statusProvider;
        this.reconcileProvider = reconcileProvider;
        this.sinkConnectionResolver = sinkConnectionResolver;
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
            // D2-R1: re-solicitar un run PARTIALLY_SENT SOLO tiene sentido si quedan fragmentos INVALIDATED (fallo de
            // transporte, re-enviables). Si no hay ninguno, es un no-op que confundiria al operador (los REJECTED se
            // recuperan con request-child, no re-solicitando). Fail-loud con guía.
            if ("PARTIALLY_SENT".equals(normalize(run.payStatus()))
                    && rebuildRepository.countInvalidatedPayFragments(dataSource, runId) == 0) {
                throw new IllegalArgumentException("rebuild run " + runId + " is PARTIALLY_SENT with no INVALIDATED "
                        + "(transport-failed) fragments to re-send; use request-child for REJECTED fragments.");
            }
            // v40-bis (P0 inmutabilidad + atomicidad): se RESERVA el run de forma EXCLUSIVA y ATOMICA antes de
            // tocar el ledger (NOT_REQUESTED/FAILED/INVALIDATED -> PREPARING_PLAN; o se reclama una reserva caida).
            // Si ya hay una solicitud/despacho en curso (REQUESTED/EXECUTING/...) o OTRO maker esta preparando, la
            // reserva devuelve 0 y se rechaza: el plan aprobado es inmutable y dos makers no pueden mezclar specs.
            // v42: la reserva genera un TOKEN de propiedad inmutable (reservation_id). Toda escritura/compilacion/
            // promocion/liberacion exige ese token: un maker que pierda la reserva (takeover de una reserva vencida)
            // ya no puede escribir specs, concretar la solicitud ni liberar el trabajo del nuevo dueno.
            var reservationId = java.util.UUID.randomUUID().toString();
            var reserved = rebuildRepository.reservePayForPlanPreparation(dataSource, runId, reservationId, requester,
                    PLAN_RESERVATION_STALE_SECONDS);
            if (reserved == 0) {
                throw new IllegalStateException("corrective pay for run " + runId + " is not eligible to request;"
                        + " payStatus=" + run.payStatus() + " (a request/dispatch is in progress or another maker is"
                        + " preparing the plan; the approved plan is immutable — resolve or invalidate it before"
                        + " requesting again)");
            }
            // A partir de aqui el run esta RESERVADO (PREPARING_PLAN). Cualquier salida sin concretar la solicitud
            // debe liberar la reserva y limpiar specs PREPARED parciales (no dejar el run atascado).
            var requestConcreted = false;
            try {
                var prep = prepare(dataSource, run, connectionRef);
                var payloadHash = archivedPayloadHash(dataSource, run);
                var payConfig = stageConfig(prep, "MT101_PAY");
                if (payConfig == null) {
                    throw new IllegalStateException("the original process has no MT101_PAY task; cannot request corrective PAY");
                }
                assertCorrectivePayPolicy(payConfig);
                var configHash = payConfigHashOf(payConfig);
                // v38 (hallazgo #3): el MAKER compila y persiste el conjunto EXACTO de planes ejecutables (en
                // exclusiva, bajo la reserva) ANTES de cambiar el estado a REQUESTED. Si la compilacion de una
                // spec falla a mitad, el run NO queda atascado: el finally libera la reserva (re-solicitable).
                // La compilacion (resolver de ruta) vive solo aqui, en la preparacion.
                rebuildRepository.refreshPayFragmentsFromCorrectiveSet(dataSource, runId, reservationId, run.correctiveSetId());
                var unresolvedPayConfig = taskConfigSource.siblingConfigOfUnresolved(prep.buildTaskDefinitionId(), "MT101_PAY");
                preparePayIntents(dataSource, runId, reservationId, run.correctiveSetId(), payConfig, unresolvedPayConfig);
                // v41 (modelo versionado): snapshot INMUTABLE del conjunto preparado como una revision DRAFT
                // (bajo la reserva exclusiva; ningun otro maker escribe en paralelo). La revision se ACTIVA en la
                // transaccion atomica de la solicitud. v42: exige el token de propiedad.
                var draft = rebuildRepository.compileDraftPlanRevision(dataSource, runId, requester, reservationId);
                // v39+v41: PREPARING_PLAN -> REQUESTED + ACTIVAR la revision DRAFT (DRAFT->ACTIVE, supersede la
                // anterior, etiqueta el ledger con la revision) + hash del conjunto + PAY_REQUESTED +
                // PAY_PLAN_PREPARED en UNA sola transaccion atomica. previousStatus = estado original (pre-reserva).
                var requested = rebuildRepository.requestPayWithPlanSet(dataSource, runId, requester,
                        payloadHash, configHash, reason, ticket, normalize(run.payStatus()),
                        draft.planSet(), draft.revision(), reservationId);
                if (requested == 0) {
                    throw new IllegalStateException("cannot request corrective pay for run " + runId
                            + "; payStatus=" + run.payStatus());
                }
                requestConcreted = true;
            } finally {
                // v40-bis: si la solicitud no se concreto, se LIBERA la reserva (PREPARING_PLAN -> NOT_REQUESTED) y
                // se eliminan los intents/specs PREPARED parciales (race-safe, solo si ninguna solicitud activa
                // posee el run). Asi un request fallido no deja el run atascado ni planes no aprobables.
                if (!requestConcreted) {
                    try {
                        // v43: ABANDONO transaccional UNICO (bajo el advisory lock y gated por el token): borra el
                        // DRAFT + intents parciales, RESTAURA el estado anterior y registra
                        // PAY_PLAN_PREPARATION_ABORTED. Corrige el bug v42 (release limpiaba el token y dejaba el
                        // DRAFT huerfano). Si OTRO maker reclamo la reserva (takeover), es no-op.
                        rebuildRepository.abandonPayPlanPreparation(dataSource, runId, reservationId, requester,
                                "plan preparation aborted: request did not concrete");
                    } catch (SQLException cleanupError) {
                        // no enmascarar el error original de la solicitud
                    }
                }
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
                rebuildRepository.invalidatePayRequestWithAction(dataSource, runId,
                        "PAY payload hash changed after request; request again before sending",
                        approver, run.payStatus(), payloadHash, null);
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
                rebuildRepository.invalidatePayRequestWithAction(dataSource, runId,
                        "PAY configuration changed after request; request again before sending",
                        approver, run.payStatus(), payloadHash, configHash);
                throw new IllegalStateException("corrective pay for run " + runId
                        + " was invalidated because the MT101_PAY configuration changed after request");
            }
            // v37 fase 2: el checker aprueba el CONJUNTO EXACTO de planes preparados al solicitar. La aprobacion
            // NO reconstruye ni reemplaza los planes: valida que el hash agregado del conjunto persistido siga
            // siendo el aprobado. Si cambio (drift de payload/spec tras la solicitud) -> INVALIDA, re-solicitar.
            // v41 (modelo versionado): la FUENTE de la verdad es la revision ACTIVE inmutable. Se valida en DOS
            // frentes: (1) el run apunta al conjunto de la revision ACTIVE; (2) el ledger de ejecucion (lo que se
            // despachara) sigue coincidiendo con ese conjunto. Cualquier divergencia -> INVALIDA (sin enviar).
            // v49-fix: la validacion NO es solo del hash: se exige que las TRES vistas (run aprobado, revision ACTIVE,
            // ledger vivo) coincidan en ALGORITMO (version), CONTEO y HASH, y que el algoritmo sea exactamente el
            // vigente (MT101_PAY_PLAN_SET_V3). Asi un run preparado con un algoritmo de hash anterior se INVALIDA con
            // un motivo explicito (no como un generico "cambio el plan"), sin rutas legacy de compatibilidad.
            var expectedVersion = Mt101RebuildRepository.PAY_PLAN_SET_VERSION;
            var approvedPlanSet = rebuildRepository.payApprovedPlanSummary(dataSource, runId);
            var activeRevision = rebuildRepository.payActivePlanRevisionSummary(dataSource, runId);
            var currentPlanSet = rebuildRepository.computePayPlanSet(dataSource, runId);
            if (approvedPlanSet == null || activeRevision == null
                    || !expectedVersion.equals(approvedPlanSet.version())
                    || !expectedVersion.equals(activeRevision.version())
                    || approvedPlanSet.count() == null
                    || !approvedPlanSet.count().equals(activeRevision.count())
                    || !approvedPlanSet.count().equals(currentPlanSet.count())
                    || approvedPlanSet.setHash() == null
                    || !approvedPlanSet.setHash().equals(activeRevision.setHash())
                    || !approvedPlanSet.setHash().equals(currentPlanSet.setHash())) {
                rebuildRepository.invalidatePayRequestWithAction(dataSource, runId,
                        "PAY plan set (algorithm/count/hash) changed or is not " + expectedVersion
                                + " after request; request again before sending",
                        approver, run.payStatus(), payloadHash, configHash);
                throw new IllegalStateException("corrective pay for run " + runId
                        + " was invalidated because the persisted plan set version/count/hash changed after request");
            }
            // v28 #3: exige secretRef/Vault para STATUS y RECONCILE ANTES de reclamar. Un secreto LITERAL se
            // redactaria al congelar el snapshot y seria IRRECUPERABLE para autenticar un PAY_UNCERTAIN
            // diferido; se rechaza pre-claim (sin dejar el run en EXECUTING) y se exige una ref re-resoluble.
            var unresolvedStatusConfig = taskConfigSource.siblingConfigOfUnresolved(prep.buildTaskDefinitionId(), "MT101_STATUS");
            if (unresolvedStatusConfig != null) {
                assertSecretsAreResolvableRefs(unresolvedStatusConfig, "STATUS", "");
            }
            var unresolvedReconcileConfig = taskConfigSource.siblingConfigOfUnresolved(prep.buildTaskDefinitionId(), "MT101_RECONCILE");
            if (unresolvedReconcileConfig != null) {
                assertSecretsAreResolvableRefs(unresolvedReconcileConfig, "RECONCILE", "");
            }
            if (!rebuildRepository.claimPayForExecutionWithAction(dataSource, runId, approver,
                    payloadHash, configHash, LocalDateTime.now().plusMinutes(15))) {
                throw new IllegalStateException("corrective pay for run " + runId
                        + " could not be claimed for execution (concurrent approval or payStatus changed)");
            }
            // Hardening v23: congela el perfil de MT101_STATUS usado al enviar, para que la resolucion
            // diferida de un PAY_UNCERTAIN consulte ese perfil (no la config vigente, que pudo cambiar).
            // Resuelto para el uso INMEDIATO post-PAY (al aprobar live == aprobado).
            var frozenStatusConfig = stageConfig(prep, "MT101_STATUS");
            // v27 P0.2: el snapshot persiste la config SIN resolver (refs ${secret:...} intactas) + redacta
            // secretos LITERALES; al resolver un incierto luego, se re-resuelven los refs desde Vault fresco.
            // Asi el snapshot no guarda secretos resueltos y la auth SFTP/STATUS diferida sigue funcionando.
            if (unresolvedStatusConfig != null) {
                try {
                    rebuildRepository.freezePayStatusConfig(dataSource, runId,
                            objectMapper.writeValueAsString(redactSecrets(unresolvedStatusConfig)));
                } catch (JsonProcessingException error) {
                    throw new IllegalStateException("cannot freeze MT101_STATUS config for run " + runId, error);
                }
            }
            // v26 #4 + v27 P0.2: congela tambien el perfil de MT101_RECONCILE sin resolver secretos.
            var frozenReconcileConfig = stageConfig(prep, "MT101_RECONCILE");
            if (unresolvedReconcileConfig != null) {
                try {
                    rebuildRepository.freezePayReconcileConfig(dataSource, runId,
                            objectMapper.writeValueAsString(redactSecrets(unresolvedReconcileConfig)));
                } catch (JsonProcessingException error) {
                    throw new IllegalStateException("cannot freeze MT101_RECONCILE config for run " + runId, error);
                }
            }
            // v37 fase 2: los planes ejecutables YA fueron compilados y persistidos al solicitar (y su conjunto
            // validado arriba). La aprobacion NO reconstruye ni reemplaza los planes: solo ejecuta los aprobados.
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
                    rebuildRepository.markPayUncertainWithAction(dataSource, runId,
                            "PAY uncertain for " + uncertainCount + " fragment(s); reconcile with the gateway before resending",
                            approver, payloadHash, configHash);
                    rebuildRepository.markPayFragmentsUncertain(dataSource, runId,
                            "PAY uncertain for " + uncertainCount + " fragment(s); reconcile with the gateway before resending");
                } else if (summary.total() == 0) {
                    rebuildRepository.markPayCompletedWithAction(dataSource, runId, "FAILED",
                            "MT101_PAY produced no fragment results", approver,
                            "MT101_PAY produced no fragment results", payloadHash, configHash);
                    throw new IllegalStateException("MT101_PAY produced no fragment results for run " + runId);
                } else if (summary.sent() == summary.total()) {
                    rebuildRepository.markPayCompletedWithAction(dataSource, runId, "SENT", null,
                            approver, null, payloadHash, configHash);
                    runPostPaySync(prep, "MT101_STATUS", statusProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, true, frozenStatusConfig);
                    runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, false, frozenReconcileConfig);
                } else if (summary.sent() > 0) {
                    rebuildRepository.markPayCompletedWithAction(dataSource, runId, "PARTIALLY_SENT",
                            "PAY sent " + summary.sent() + " of " + summary.total()
                                    + " fragment(s); rejected=" + summary.rejected()
                                    + " invalidated=" + summary.invalidated(),
                            approver, "sent=" + summary.sent() + " rejected=" + summary.rejected()
                                    + " invalidated=" + summary.invalidated(),
                            payloadHash, configHash);
                    runPostPaySync(prep, "MT101_STATUS", statusProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, true, frozenStatusConfig);
                    runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, false, frozenReconcileConfig);
                } else if (summary.invalidated() > 0 && summary.rejected() == 0) {
                    // P0.3 v25 + D.2: fragmentos INVALIDATED sin ningún rechazo de negocio. Dos causas posibles, ambas
                    // re-solicitables (NO es un rechazo bancario -> NO FAILED terminal): (a) el plan cambió tras aprobar
                    // (drift) y se bloqueó el envío; (b) fallo de TRANSPORTE/AUTENTICACIÓN antes del despacho (el banco
                    // no recibió nada). En ambas se arregla la causa (re-aprobar el plan / la credencial) y se re-pide.
                    rebuildRepository.markPayCompletedWithAction(dataSource, runId, "INVALIDATED",
                            "PAY invalidated (not sent to the bank) for " + summary.invalidated() + " fragment(s) "
                                    + "by plan drift or a transport/auth failure; fix the cause and request/approve "
                                    + "again", approver,
                            "invalidated=" + summary.invalidated() + " (re-solicitable: not a bank rejection)",
                            payloadHash, configHash);
                    throw new IllegalStateException("MT101_PAY invalidated " + summary.invalidated()
                            + " fragment(s) for run " + runId + " (not sent to the bank; plan drift or transport/auth "
                            + "failure); fix the cause and request/approve again");
                } else if (summary.invalidated() > 0) {
                    // D2-R2: run MIXTO sent=0 con REJECTED (rechazo de negocio del banco) + INVALIDATED (fallo de
                    // transporte, re-solicitable). NO es "todo rechazado" (FAILED terminal): los INVALIDATED se
                    // re-solicitan (request-pay tras arreglar la causa técnica) y los REJECTED se recuperan con
                    // request-child. Se clasifica PARTIALLY_SENT (mismo estado recuperable que el mixto sent>0), aunque
                    // sent=0 — habilita ambas recuperaciones (request-child exige PARTIALLY_SENT + refs REJECTED;
                    // request-pay admite PARTIALLY_SENT + invalidated>0). La cuarentena se sincroniza por-fragmento
                    // (deriveLifecycleStatus da PARTIALLY_FAILED -> markPartialSelections), no bulk REBUILD_SENT.
                    // NO se lanza excepción: el catch re-marcaría FAILED (hasDispatchedPayFragments=false), deshaciéndolo.
                    rebuildRepository.markPayCompletedWithAction(dataSource, runId, "PARTIALLY_SENT",
                            "PAY sent 0 of " + summary.total() + " fragment(s); rejected=" + summary.rejected()
                                    + " invalidated=" + summary.invalidated()
                                    + " (re-request the INVALIDATED after fixing the transport cause; "
                                    + "request-child the REJECTED)",
                            approver, "sent=0 rejected=" + summary.rejected() + " invalidated=" + summary.invalidated(),
                            payloadHash, configHash);
                    runPostPaySync(prep, "MT101_STATUS", statusProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, true, frozenStatusConfig);
                    runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                            correctivePaySource(runId, connectionRef), dataSource, runId, false, frozenReconcileConfig);
                } else {
                    // sent=0, invalidated=0: TODO rechazado por el banco -> FAILED (corregir contenido + rebuild).
                    rebuildRepository.markPayCompletedWithAction(dataSource, runId, "FAILED",
                            payResult.details() == null ? "MT101_PAY rejected all fragments" : payResult.details(),
                            approver, payResult.details(), payloadHash, configHash);
                    throw new IllegalStateException("MT101_PAY rejected all fragments for run " + runId
                            + ": " + payResult.details());
                }
                // v29: aceptacion TARDIA. Si el lease vencio durante send() y el scheduler marco el run
                // UNCERTAIN, pero los fragmentos finalmente quedaron SENT, el cierre EXECUTING->SENT del
                // worker fue no-op (la guarda 'EXECUTING' lo impide). Se resuelve el run UNCERTAIN->SENT con
                // accion append-only, sin reenviar; si queda algun fragmento pendiente, se mantiene UNCERTAIN.
                rebuildRepository.resolveLateAcceptedPayRun(dataSource, runId, approver);
            } catch (RuntimeException error) {
                // P0.2 v21: si ya se despacho algun fragmento (DISPATCHING/SENT/UNCERTAIN), el mensaje
                // pudo llegar al banco -> NUNCA FAILED (reusable -> doble pago). Se marca UNCERTAIN.
                if (rebuildRepository.hasDispatchedPayFragments(dataSource, runId)) {
                    rebuildRepository.markPayUncertainWithAction(dataSource, runId,
                            "PAY interrupted after dispatching at least one fragment: " + error.getMessage()
                                    + "; reconcile with the gateway before any resend",
                            approver, payloadHash, configHash);
                    rebuildRepository.markPayFragmentsUncertain(dataSource, runId,
                            "PAY interrupted after dispatch; reconcile before any resend");
                } else {
                    rebuildRepository.markPayCompletedWithAction(dataSource, runId, "FAILED",
                            error.getMessage(), approver, error.getMessage(), payloadHash, configHash);
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
            var frozenReconcileConfig = frozenReconcileConfig(dataSource, runId);
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
            if (summary.conflicts() > 0) {
                // v36: un PAY_CONFLICT (resultado terminal contradictorio, p.ej. STATUS REJECTED contra un
                // ledger SENT) exige conciliacion MANUAL. NO se auto-resuelve a SENT/PARTIALLY_SENT/FAILED: el
                // run se mantiene UNCERTAIN hasta que un operador concilie el conflicto explicitamente.
                resolvedStatus = "UNCERTAIN";
                resolvedDetail = reasonPrefix + "MT101_STATUS detected " + summary.conflicts()
                        + " fragment(s) in conflict (pay_conflict); manual reconciliation required, no auto-resolution";
                rebuildRepository.markPayResolutionWithAction(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
            } else if (summary.pending() > 0) {
                resolvedStatus = "UNCERTAIN";
                resolvedDetail = reasonPrefix + "MT101_STATUS did not return a final accepted/rejected status for "
                        + summary.pending() + " fragment(s)";
                rebuildRepository.markPayResolutionWithAction(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
            } else if (summary.sent() == summary.total()) {
                resolvedStatus = "SENT";
                resolvedDetail = reasonPrefix + "resolved by MT101_STATUS: all fragments sent";
                rebuildRepository.markPayResolutionWithAction(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
                runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                        correctivePaySource(runId, connectionRef), dataSource, runId, false, frozenReconcileConfig);
            } else if (summary.sent() > 0) {
                resolvedStatus = "PARTIALLY_SENT";
                resolvedDetail = reasonPrefix + "PAY resolved by MT101_STATUS: sent=" + summary.sent()
                        + ", rejected=" + summary.rejected();
                rebuildRepository.markPayResolutionWithAction(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
                runPostPaySync(prep, "MT101_RECONCILE", reconcileProvider,
                        correctivePaySource(runId, connectionRef), dataSource, runId, false, frozenReconcileConfig);
            } else {
                resolvedStatus = "FAILED";
                resolvedDetail = reasonPrefix + "PAY resolved by MT101_STATUS: all fragments rejected";
                rebuildRepository.markPayResolutionWithAction(dataSource, runId, resolvedStatus, resolvedDetail, executedBy);
            }
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
                : taskConfigSource.siblingConfigOf(prep.buildTaskDefinitionId(), taskType);
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
        return taskConfigSource.siblingConfigOf(prep.buildTaskDefinitionId(), taskType);
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
            // v27 P0.2: el snapshot tiene refs ${secret:...} sin resolver; se RE-RESUELVEN ahora (Vault
            // fresco) para que la consulta SFTP/STATUS diferida pueda autenticarse.
            return configurationMapper.resolveSecretsIn(objectMapper.readValue(snapshot, LinkedHashMap.class));
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("cannot read frozen MT101_STATUS config for run " + runId, error);
        }
    }

    /** v26 #4: snapshot congelado de la config de MT101_RECONCILE (perfil aprobado al enviar), o null. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> frozenReconcileConfig(DataSource dataSource, String runId) throws SQLException {
        var snapshot = rebuildRepository.payReconcileConfigSnapshot(dataSource, runId);
        if (snapshot == null || snapshot.isBlank()) {
            return null;
        }
        try {
            return configurationMapper.resolveSecretsIn(objectMapper.readValue(snapshot, LinkedHashMap.class));
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("cannot read frozen MT101_RECONCILE config for run " + runId, error);
        }
    }

    private static final java.util.Set<String> SECRET_KEYS = java.util.Set.of(
            "authorization", "password", "passphrase", "token", "secret", "privatekey", "private_key",
            "apikey", "api_key", "credential", "credentials", "bearer", "clientsecret", "client_secret");

    /**
     * v24: redacta (recursivamente) valores de claves que pueden contener secretos resueltos antes de
     * persistir el snapshot de config de STATUS. No depende de que la config nunca traiga secretos: si
     * llega uno resuelto, no se guarda. Las referencias del tipo {@code ${secret:...}} no son secretos.
     */
    private Object redactSecrets(Object value) {
        if (value instanceof Map<?, ?> map) {
            var result = new LinkedHashMap<String, Object>();
            map.forEach((key, raw) -> {
                var name = String.valueOf(key);
                if (SECRET_KEYS.contains(name.toLowerCase(java.util.Locale.ROOT))) {
                    result.put(name, redactSecretValue(raw));
                } else {
                    result.put(name, redactSecrets(raw));
                }
            });
            return result;
        }
        if (value instanceof List<?> list) {
            var result = new ArrayList<Object>(list.size());
            for (var item : list) {
                result.add(redactSecrets(item));
            }
            return result;
        }
        return value;
    }

    /** Una referencia sin resolver ({@code ${secret:...}}) NO es un secreto; un valor resuelto SI se redacta. */
    private Object redactSecretValue(Object raw) {
        if (raw instanceof String text && text.contains("${")) {
            return raw;
        }
        return "***REDACTED***";
    }

    /**
     * v28 #3: exige secretRef/Vault para STATUS y RECONCILE. Un secreto LITERAL en estas configs se redacta
     * al congelar el snapshot, pero entonces NO podra recuperarse para resolver un PAY_UNCERTAIN diferido
     * (la auth quedaria como {@code ***REDACTED***}). Sin fallback: en vez de degradar silenciosamente, se
     * rechaza el PAY al aprobar y se exige que el secreto sea una referencia {@code ${secret:...}}
     * re-resoluble desde Vault en la ejecucion diferida.
     */
    private void assertSecretsAreResolvableRefs(Object value, String taskName, String path) {
        if (value instanceof Map<?, ?> map) {
            map.forEach((key, raw) -> {
                var name = String.valueOf(key);
                var childPath = path.isEmpty() ? name : path + "." + name;
                if (SECRET_KEYS.contains(name.toLowerCase(java.util.Locale.ROOT))
                        && raw instanceof String text && !text.isBlank() && !text.contains("${")) {
                    throw new IllegalStateException("MT101_" + taskName + " secret '" + childPath
                            + "' must be a ${secret:...} reference (Vault), not a literal: a literal cannot be"
                            + " re-resolved to authenticate a deferred PAY_UNCERTAIN resolution");
                }
                assertSecretsAreResolvableRefs(raw, taskName, childPath);
            });
        } else if (value instanceof List<?> list) {
            for (int i = 0; i < list.size(); i++) {
                assertSecretsAreResolvableRefs(list.get(i), taskName, path + "[" + i + "]");
            }
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

    private void preparePayIntents(DataSource dataSource, String runId, String reservationId, String correctiveSetId,
                                   Map<String, Object> payConfig, Map<String, Object> unresolvedPayConfig)
            throws SQLException {
        if (payConfig == null) {
            throw new IllegalStateException("the original process has no MT101_PAY task; cannot prepare PAY intents");
        }
        if (unresolvedPayConfig == null) {
            throw new IllegalStateException("MT101_PAY unresolved config required to compile the executable plan");
        }
        // ADR-017: resuelve la conexion SFTP (sftp.sinkRef -> fuente OUTPUT/BOTH) y la mergea en el bloque sftp ANTES
        // de compilar, para que el compiler CONGELE el host resuelto (literal) + credenciales como ${secret:...} refs.
        // El dispatch correctivo materializa ese spec congelado y NUNCA re-resuelve la fuente: el destino aprobado no
        // cambia aunque un operador edite/borre la fuente entre el pago original y el correctivo (anti doble-pago).
        // (nullable solo en tests planos sin CDI: sin resolver no hay merge -> modo inline, como antes de ADR-017.)
        if (sinkConnectionResolver != null) {
            unresolvedPayConfig = sinkConnectionResolver.withResolvedSink(unresolvedPayConfig);
        }
        // v37: compila la especificacion EJECUTABLE por fragmento desde la config SIN resolver (refs intactas)
        // -> el ledger pasa a ser el contrato de despacho; el dispatch correctivo ya no resuelve la ruta.
        var compiler = new Mt101DispatchPlanCompiler(objectMapper);
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
                var payloadHashValue = payloadHash(message);
                // v37: especificacion ejecutable canonica (transporte + config con refs ${secret:...} + correlacion)
                // compilada desde la config SIN resolver; el dispatch correctivo la lee y re-resuelve solo secretos.
                var spec = compiler.compile(unresolvedPayConfig, row.routedAs(), row.routeError(), message);
                // v38: destino + dispatch_plan_hash se derivan de la materializacion SIN resolver secretos del
                // PROPIO spec (mismo calculo que hara el dispatch antes del claim), garantizando consistencia y
                // que el claim no dependa de un plan re-resuelto con Vault. P0.4 v25: destino real redactado.
                var plan = compiler.materialize(spec.specJson(), null);
                var key = plan.endpointRef();
                var destination = Mt101PayRouteResolver.dispatchDestination(plan, message);
                var planHash = Mt101PayRouteResolver.dispatchPlanHash(plan, payloadHashValue, row.routedAs(), message);
                intents.add(new Mt101RebuildRepository.PayFragmentIntent(
                        correctiveSetId,
                        reference,
                        null,
                        null,
                        null,
                        payloadHashValue,
                        key,
                        plan.transport(),
                        key,
                        row.routedAs(),
                        destination,
                        planHash,
                        spec.version(),
                        spec.specJson(),
                        spec.specHash()));
            }
            rebuildRepository.preparePayIntents(dataSource, runId, reservationId, intents);
            if (rows.size() < pageSize) {
                return;
            }
        }
    }

    private void persistPayDetail(DataSource dataSource, String runId, String correctiveSetId,
                                  TaskResult payResult) throws SQLException {
        // Sincronizacion post-dispatch (run EXECUTING): no hay reserva en juego -> token null (el guard de
        // ownership solo aplica si el run esta en PREPARING_PLAN).
        rebuildRepository.refreshPayFragmentsFromCorrectiveSet(dataSource, runId, null, correctiveSetId);
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

    /**
     * P0.4 v25: destino REAL resuelto del despacho (para reconstruir a que host/ruta se envio), redactado
     * de credenciales. REST: la URL resuelta; SFTP: sftp://host/dropPath. No incluye secretos resueltos.
     */
    @SuppressWarnings("unchecked")
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
