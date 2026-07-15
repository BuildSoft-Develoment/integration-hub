package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import com.integrationhub.platform.spi.task.payments.PaymentMessageTransport;
import com.integrationhub.platform.spi.task.payments.PreDispatchTransportException;
import com.integrationhub.platform.spi.task.payments.TransportResult;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Task provider {@code MT101_PAY}: itera la lista de {@link Mt101Message} consumida
 * de una tarea anterior (tipicamente {@code MT101_ARCHIVE} o {@code MT101_BUILD}) y
 * la despacha al banco/gateway via el {@link PaymentMessageTransport} configurado.
 *
 * <p>{@code executionMode} esperado: {@code per-record} en uso normal. Para slice 3
 * el provider procesa la lista entera de mensajes secuencialmente (un mensaje SWIFT
 * por archivo es lo comun). En slice 4+, cuando el motor exponga {@code per-record}
 * sobre objetos no-{@code ReadRecord}, el motor mismo iterara.</p>
 *
 * <p><b>Outputs</b>: {@code summary} (dispatchCount/sentCount/acceptedCount/rejectedCount/retriedCount),
 * {@code records} (status por mensaje) y {@code errors} (mensajes rechazados con causa).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-004, T-009
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101PayTaskProvider implements TaskProvider {

    /**
     * Gate de estados (P1): por defecto PAY solo despacha fragmentos {@code ARCHIVED}
     * (hash + retencion ya persistidos). Enviar {@code BUILT} (sin validar/archivar)
     * o re-enviar {@code REJECTED} requiere fijar {@code fragmentSource.statuses}
     * explicitamente.
     */
    private static final List<String> FRAGMENT_READ_STATUSES = List.of("ARCHIVED");
    /** Muestra de records/errors en el output; los conteos son siempre exactos. */
    private static final int DEFAULT_MAX_RECORDS_IN_OUTPUT = 1000;

    private final Instance<PaymentMessageTransport> transports;
    private final Mt101FragmentStore fragmentStore;
    private final Mt101ArchiveStatusUpdater archiveStatusUpdater;
    private final RecordAuditEmitter recordAuditEmitter;
    private final Mt101CorrectivePayStore correctivePayStore;
    // P3: ledger de intención de dispatch para el camino de lista en memoria (re-request safety sin cambiar topología).
    private final Mt101PayDispatchIntentStore dispatchIntentStore;
    // v37: compila/materializa el plan EJECUTABLE persistido (dispatch correctivo sin Mt101PayRouteResolver).
    private final Mt101DispatchPlanCompiler dispatchPlanCompiler =
            new Mt101DispatchPlanCompiler(new com.fasterxml.jackson.databind.ObjectMapper());
    // v37: re-resuelve SOLO las referencias ${secret:...} del plan persistido al materializarlo en el dispatch.
    private final java.util.function.UnaryOperator<Map<String, Object>> correctiveSecretResolver;

    @Inject
    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore,
                                Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                RecordAuditEmitter recordAuditEmitter,
                                Mt101CorrectivePayStore correctivePayStore,
                                com.integrationhub.platform.service.JsonConfigurationMapper configurationMapper,
                                Mt101PayDispatchIntentStore dispatchIntentStore) {
        this.transports = transports;
        this.fragmentStore = fragmentStore;
        this.archiveStatusUpdater = archiveStatusUpdater;
        this.recordAuditEmitter = recordAuditEmitter;
        this.correctivePayStore = correctivePayStore;
        this.correctiveSecretResolver = configurationMapper == null ? null : configurationMapper::resolveSecretsIn;
        this.dispatchIntentStore = dispatchIntentStore;
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore,
                                Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                RecordAuditEmitter recordAuditEmitter,
                                Mt101CorrectivePayStore correctivePayStore,
                                com.integrationhub.platform.service.JsonConfigurationMapper configurationMapper) {
        this(transports, fragmentStore, archiveStatusUpdater, recordAuditEmitter, correctivePayStore,
                configurationMapper, null);
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore,
                                Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                RecordAuditEmitter recordAuditEmitter,
                                Mt101CorrectivePayStore correctivePayStore) {
        this(transports, fragmentStore, archiveStatusUpdater, recordAuditEmitter, correctivePayStore, null, null);
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore,
                                Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                RecordAuditEmitter recordAuditEmitter) {
        this(transports, fragmentStore, archiveStatusUpdater, recordAuditEmitter, null);
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore,
                                Mt101ArchiveStatusUpdater archiveStatusUpdater) {
        this(transports, fragmentStore, archiveStatusUpdater, null);
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore) {
        this(transports, fragmentStore, null, null);
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports) {
        this(transports, null, null, null);
    }

    @Override
    public String type() {
        return "MT101_PAY";
    }

    @Override
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var routedPay = Mt101PayRouteResolver.hasRouteTransports(configuration);
        var transportId = routedPay
                ? "ROUTED"
                : stringValue(configuration.get("transport"), Mt101PayRouteResolver.DEFAULT_TRANSPORT).toUpperCase();
        var transport = routedPay ? null : resolveTransport(transportId);
        var fragmentSource = Mt101MessageInputResolver.fragmentSource(context, configuration, type());

        var accumulator = new DispatchAccumulator(
                intValue(configuration.get("maxRecordsInOutput"), DEFAULT_MAX_RECORDS_IN_OUTPUT));
        if (!fragmentSource.isEmpty() && fragmentStore != null) {
            var pageSize = intValue(configuration.get("pageSize"), Mt101FragmentStore.DEFAULT_PAGE_SIZE);
            if (routedPay) {
                fragmentStore.forEachRoutedPage(fragmentSource, FRAGMENT_READ_STATUSES, pageSize, page -> {
                    dispatchFragmentPage(context, configuration, fragmentSource, accumulator,
                            page.stream()
                                    .map(item -> new RoutedDispatchMessage(item.message(), item.routedAs(), item.routeError()))
                                    .toList());
                });
            } else {
                fragmentStore.forEachPage(fragmentSource, FRAGMENT_READ_STATUSES, pageSize, page -> {
                    dispatchFragmentPage(context, configuration, fragmentSource, accumulator,
                            page.stream()
                                    .map(message -> new RoutedDispatchMessage(message, null, null))
                                    .toList(),
                            transport);
                });
            }
        } else {
            var inputs = Mt101MessageInputResolver.readResolvedMessages(context, configuration, type(), fragmentStore);
            var sentArchiveIds = new LinkedHashMap<String, List<Long>>();
            var rejectedArchiveIds = new LinkedHashMap<String, List<Long>>();
            var audit = new ArrayList<AuditEnvelope>(inputs.size());
            for (var input : inputs) {
                var plan = Mt101PayRouteResolver.resolve(configuration, null, null, input.message());
                var effectiveTransport = routedPay ? resolveTransport(plan.transport()) : transport;
                var result = dispatch(effectiveTransport, plan.configuration(), input, accumulator, context, true);
                var reference = input.message() != null && input.message().sequenceA() != null
                        ? input.message().sequenceA().sendersReference() : null;
                if (result.accepted()) {
                    collectArchiveId(configuration, input, sentArchiveIds);
                } else if (result.uncertain()) {
                    // INCIERTO: no se sincroniza a SENT ni REJECTED; queda para conciliacion.
                    audit.add(recordEnvelope(context, reference, result));
                    continue;
                } else if (result.retriable()) {
                    // D.2: transportFailure pre-despacho (no salio al banco) -> re-solicitable, NO rechazo de negocio.
                    // NO se sincroniza el archive a REJECTED (seria pintar un fallo tecnico como rechazo bancario);
                    // el intent quedo INVALIDATED (re-reclamable) y el output cuenta invalidatedCount.
                    audit.add(recordEnvelope(context, reference, result));
                    continue;
                } else {
                    collectArchiveId(configuration, input, rejectedArchiveIds);
                }
                audit.add(recordEnvelope(context, reference, result));
            }
            emitRecordAudit(audit);
            syncArchiveIds(configuration, sentArchiveIds, "SENT");
            syncArchiveIds(configuration, rejectedArchiveIds, "REJECTED");
        }

        if (accumulator.totalCount() == 0) {
            return TaskResult.success("MT101_PAY skipped because there are no messages to dispatch");
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("dispatchCount", accumulator.totalCount());
        outputs.put("sentCount", accumulator.acceptedCount);
        outputs.put("acceptedCount", accumulator.acceptedCount);
        outputs.put("rejectedCount", accumulator.rejectedCount);
        outputs.put("invalidatedCount", accumulator.invalidatedCount);
        outputs.put("uncertainCount", accumulator.uncertainCount);
        outputs.put("retriedCount", accumulator.retriedCount);
        outputs.put("totalDurationMs", accumulator.totalDurationMs);
        // v38 (trazabilidad): en el correctivo el transporte sale del plan PERSISTIDO, no de la config viva.
        // Se reporta PERSISTED_PLAN y la lista de transportes realmente usados por fragmento.
        var corrective = stringValue(fragmentSource.get("correctivePayRunId"), null) != null;
        outputs.put("transport", corrective ? "PERSISTED_PLAN" : transportId);
        outputs.put("transportsUsed", new ArrayList<>(accumulator.transportsUsed));
        // records/errors/uncertain son una MUESTRA acotada (ver maxRecordsInOutput); para
        // el detalle completo, consultar mt101_build_fragment por fragmentSetId.
        outputs.put("records", accumulator.sent);
        outputs.put("errors", accumulator.errors);
        outputs.put("uncertain", accumulator.uncertain);
        outputs.put("recordsSampled", accumulator.totalCount() > accumulator.sent.size());

        var summary = "MT101_PAY via " + transportId
                + " dispatch=" + accumulator.totalCount()
                + " sent=" + accumulator.acceptedCount
                + " accepted=" + accumulator.acceptedCount
                + " rejected=" + accumulator.rejectedCount
                + " invalidated=" + accumulator.invalidatedCount
                + " uncertain=" + accumulator.uncertainCount
                + " retried=" + accumulator.retriedCount;
        // G1: un INCIERTO deja dinero en estado ambiguo -> señal needsReconciliation para que el motor cierre la
        // ejecución en NEEDS_RECONCILIATION (no COMPLETED silencioso ni FAILED opaco). Un REJECTED sin UNCERTAIN es un
        // fallo de negocio probado (no salió al banco): failure normal. Éxito solo si todo SENT.
        if (accumulator.uncertainCount > 0) {
            return TaskResult.needsReconciliation(summary, outputs);
        }
        // D.2: un fallo de transporte/auth (invalidated) NO salió al banco -> failure re-solicitable (no éxito, no
        // needsReconciliation ambiguo). Un rechazo de negocio también es failure. Éxito solo si todo SENT.
        return (accumulator.rejectedCount > 0 || accumulator.invalidatedCount > 0)
                ? TaskResult.failure(summary, outputs)
                : TaskResult.success(summary, outputs);
    }

    private void dispatchFragmentPage(TaskContext context,
                                      Map<String, Object> configuration,
                                      Map<String, Object> fragmentSource,
                                      DispatchAccumulator accumulator,
                                      List<RoutedDispatchMessage> page) {
        dispatchFragmentPage(context, configuration, fragmentSource, accumulator, page, null);
    }

    private void dispatchFragmentPage(TaskContext context,
                                      Map<String, Object> configuration,
                                      Map<String, Object> fragmentSource,
                                      DispatchAccumulator accumulator,
                                      List<RoutedDispatchMessage> page,
                                      PaymentMessageTransport defaultTransport) {
        // Marcado por lote al cierre de cada pagina. Trade-off: si el
        // proceso muere a mitad de pagina, hasta pageSize fragmentos
        // quedan SENT-en-banco pero ARCHIVED-en-BD; la clave de correlacion
        // estable hace seguro resolver/reconciliar antes de cualquier reenvio.
        var sentRefs = new ArrayList<String>(page.size());
        var sentTargets = new ArrayList<Mt101ArchiveStatusUpdater.StatusTarget>(page.size());
        var rejectedTargets = new ArrayList<Mt101ArchiveStatusUpdater.StatusTarget>();
        // Mapa de errores acotado a la pagina (no a la ejecucion completa).
        var rejectedByRef = new LinkedHashMap<String, String>();
        var pageAudit = new ArrayList<AuditEnvelope>(page.size());
        // P0.1 v21: resultado durable POR FRAGMENTO de toda la pagina (no la muestra
        // acotada): el ledger es la fuente de verdad para 20k fragmentos correctivos.
        var pageLedger = new ArrayList<Mt101RebuildRepository.PayFragmentResult>(page.size());
        var rebuildRunId = stringValue(fragmentSource.get("correctivePayRunId"), null);
        // v51-fix (PAY normal durable): en el flujo NO correctivo se reclama la pagina ARCHIVED->DISPATCHING de
        // forma ATOMICA antes de enviar; solo se despacha lo reclamado. Un fragmento no reclamado (otro worker lo
        // tomo, o ya es terminal/DISPATCHING) NO se reenvia. En el correctivo el claim es por-fragmento contra la
        // revision inmutable (mas abajo), asi que aqui no se toca.
        var uncertainRefs = new ArrayList<String>();
        // D.2 (PAY normal): refs con transportFailure pre-despacho. El fragmento fue reclamado ARCHIVED->DISPATCHING
        // pero nada salio al banco -> hay que revertirlo a ARCHIVED (re-pagable). Map ref->error para la auditoria.
        var invalidatedByRef = new LinkedHashMap<String, String>();
        java.util.Set<String> claimedNormalRefs = null;
        if (rebuildRunId == null && fragmentStore != null) {
            var pageRefs = new ArrayList<String>(page.size());
            for (var item : page) {
                var ref = item.message() == null || item.message().sequenceA() == null ? null
                        : item.message().sequenceA().sendersReference();
                if (ref != null && !ref.isBlank()) {
                    pageRefs.add(ref);
                }
            }
            claimedNormalRefs = fragmentStore.claimForDispatch(fragmentSource, pageRefs, FRAGMENT_READ_STATUSES);
        }
        for (var item : page) {
            var message = item.message();
            var reference = message.sequenceA() == null ? null
                    : message.sequenceA().sendersReference();
            Mt101PayRouteResolver.PayPlan plan;
            PaymentMessageTransport transport;
            if (rebuildRunId != null) {
                // v37: FLUJO CORRECTIVO. El plan ejecutable es el CONTRATO persistido en el ledger;
                // Mt101PayRouteResolver YA NO se ejecuta aqui (no se vuelve a decidir ruta/transporte/destino).
                // Sin spec persistido NO hay fallback al resolver vigente: se INVALIDA y NO se llama al banco.
                if (reference == null || reference.isBlank()) {
                    continue;
                }
                if (correctivePayStore == null) {
                    throw new IllegalStateException("MT101_PAY corrective source requires Mt101CorrectivePayStore");
                }
                // v46-fix (read-from-pf): el contrato (spec, payload_hash, ruta, destino, plan_hash) se lee
                // DIRECTAMENTE de la revision ACTIVE INMUTABLE (mt101_corrective_pay_plan_fragment), no del ledger
                // operativo. El ledger solo aporta el gate PREPARED. Sin contrato coherente (cadena run->cabecera
                // ACTIVE->fragmento) NO hay fallback: se INVALIDA.
                var prepared = correctivePayStore.readPreparedSpec(fragmentSource, rebuildRunId, reference);
                if (prepared == null || prepared.specJson() == null || prepared.specJson().isBlank()) {
                    correctivePayStore.invalidateMissingSpec(fragmentSource, rebuildRunId, reference);
                    continue;
                }
                // v46-fix: si el ledger operativo DIVERGE de la revision inmutable de la que se leyo el contrato
                // (manipulacion directa del ledger), se INVALIDA (estado terminal claro) y NO se despacha.
                if (correctivePayStore.invalidateIfLedgerDivergesFromActiveRevision(fragmentSource, rebuildRunId, reference)) {
                    continue;
                }
                // v37 (P0.2): INTEGRIDAD de la spec (de pf, inmutable): el dispatch_spec_json debe coincidir con su
                // dispatch_spec_hash; defensa adicional aunque pf este protegida por trigger.
                if (!dispatchPlanCompiler.specHash(prepared.specJson()).equals(prepared.specHash())) {
                    correctivePayStore.invalidateTamperedSpec(fragmentSource, rebuildRunId, reference);
                    continue;
                }
                // v38 (hallazgo #1): materializa SIN resolver secretos (solo parseo JSON, sin Vault) para validar
                // la estructura y computar el plan_hash del claim. La resolucion de secretos ocurre DESPUES de
                // ganar el claim: un worker que pierda el claim o llegue tarde NO consulta Vault.
                Mt101PayRouteResolver.PayPlan structuralPlan;
                try {
                    structuralPlan = dispatchPlanCompiler.materialize(prepared.specJson(), null);
                } catch (RuntimeException specError) {
                    correctivePayStore.invalidateTamperedSpec(fragmentSource, rebuildRunId, reference);
                    continue;
                }
                var payloadHash = payloadHash(message);
                var planHash = Mt101PayRouteResolver.dispatchPlanHash(structuralPlan, payloadHash,
                        prepared.approvedRoutedAs(), message);
                // v37 P0.2 + v38 #2: el claim enlaza ATOMICAMENTE el contrato persistido EXACTO: payload_hash
                // actual = aprobado + approved_routed_as + dispatch_plan_hash + dispatch_spec_hash + el
                // dispatch_spec_json byte-a-byte. Si difiere -> INVALIDATED, no se envia.
                if (!correctivePayStore.markDispatching(fragmentSource, rebuildRunId, reference,
                        payloadHash, prepared.approvedRoutedAs(), planHash, prepared.specHash(), prepared.specJson())) {
                    continue;
                }
                // v38 (hallazgo #1): ganado el claim -> ahora si se re-resuelven los secretos. Si la resolucion
                // (Vault/OpenBao) o la materializacion falla ANTES del envio, NO hubo llamada al banco -> el
                // fragmento se INVALIDA (re-solicitable), nunca UNCERTAIN ni se exige STATUS.
                try {
                    plan = dispatchPlanCompiler.materialize(prepared.specJson(), correctiveSecretResolver);
                    // v37 (P0.1): el transporte sale SIEMPRE del plan persistido, nunca de la config viva.
                    transport = resolveTransport(plan.transport());
                } catch (RuntimeException materializeError) {
                    correctivePayStore.invalidateMaterializeFailure(fragmentSource, rebuildRunId, reference,
                            "dispatch plan materialization failed before send (no bank call): "
                                    + materializeError.getMessage());
                    continue;
                }
            } else {
                // Flujo no-correctivo: solo se despacha si ESTA fila gano el claim atomico ARCHIVED->DISPATCHING
                // (v51-fix). Si no se reclamo (concurrencia, ya terminal, o sin store), no se llama al transporte.
                if (claimedNormalRefs == null || reference == null || !claimedNormalRefs.contains(reference)) {
                    continue;
                }
                plan = Mt101PayRouteResolver.resolve(configuration, item.routedAs(), item.routeError(), message);
                transport = defaultTransport == null ? resolveTransport(plan.transport()) : defaultTransport;
            }
            var result = dispatch(transport, plan.configuration(), message, accumulator, context);
            if (reference == null) {
                continue;
            }
            if (result.accepted()) {
                sentRefs.add(reference);
                sentTargets.add(archiveTarget(message));
            } else if (result.uncertain()) {
                // INCIERTO: no se marca SENT ni REJECTED. v51-fix: en el flujo normal el fragmento se marca
                // UNCERTAIN de forma DURABLE (abajo) para EXCLUIRLO de una nueva seleccion de PAY (que solo lee
                // ARCHIVED); reenviarlo duplicaria el pago. Resolver por STATUS/RECONCILE, nunca reenvio automatico.
                if (rebuildRunId == null) {
                    uncertainRefs.add(reference);
                }
            } else if (result.retriable()) {
                // D.2: fallo de TRANSPORTE/AUTENTICACION antes del despacho (el banco no recibio nada) -> re-solicitable.
                // NO es un rechazo de negocio: NO se anade a sentRefs ni rejectedByRef.
                //  - CORRECTIVO: el build_fragment NO se reclamo a DISPATCHING aqui (sigue ARCHIVED); el ledger lo
                //    marca INVALIDATED (payStatusOf) -> run re-solicitable.
                //  - NORMAL persistido: el fragmento SI fue reclamado ARCHIVED->DISPATCHING (claimForDispatch, arriba).
                //    Se REVIERTE a ARCHIVED en finalizeNormalGuarded (guardado, solo-desde-DISPATCHING); sin esto
                //    quedaria atascado en DISPATCHING (bloquea el cierre de conciliacion, sin ruta de re-solicitud).
                if (rebuildRunId == null) {
                    invalidatedByRef.put(reference, result.lastError());
                }
            } else {
                rejectedByRef.put(reference, result.lastError());
                rejectedTargets.add(archiveTarget(message));
            }
            pageAudit.add(recordEnvelope(context, reference, result));
            var payStatus = payStatusOf(result);
            pageLedger.add(new Mt101RebuildRepository.PayFragmentResult(
                    reference, payStatus, result.gatewayReference(), result.attempts(), result.lastError()));
        }
        // Trazabilidad E2E por registro: una trama RECORD por fragmento,
        // emitida en lote por pagina (un solo JDBC batch), fuera de la TX.
        emitRecordAudit(pageAudit);
        var conflicts = persistCorrectiveLedger(fragmentSource, pageLedger);
        // v34/v35 (hallazgo 2): si el ledger NO aceptó la transición terminal (conflicto contra una resolución
        // previa), NO se propaga a build_fragment ni a archive en NINGÚN sentido (ni SENT ni REJECTED): el
        // ledger es la fuente de verdad y las tres tablas quedan coherentes. El fragmento conserva su estado
        // real y queda marcado pay_conflict para conciliación (PAY_CONFLICT append-only). Filtro simétrico.
        if (!conflicts.isEmpty()) {
            sentRefs.removeAll(conflicts);
            sentTargets.removeIf(target -> conflicts.contains(target.sendersReference()));
            rejectedByRef.keySet().removeAll(conflicts);
            rejectedTargets.removeIf(target -> conflicts.contains(target.sendersReference()));
        }
        if (rebuildRunId == null) {
            // P0-1 (PAY normal): transición terminal GUARDADA (solo desde DISPATCHING/UNCERTAIN) + pay_conflict
            // durable ante un resultado tardío contradictorio. Reemplaza el markStatusBatch sin guarda, que podía
            // sobrescribir en silencio un terminal ya resuelto por STATUS/RECONCILE (REJECTED→SENT).
            finalizeNormalGuarded(context, configuration, fragmentSource, sentRefs, rejectedByRef, uncertainRefs,
                    invalidatedByRef, sentTargets, rejectedTargets);
        } else {
            // CORRECTIVO: el ledger correctivo ya filtró conflicts y el fragmento está DISPATCHING del run (claim
            // v37, contra el contrato persistido). El marcado directo mantiene el comportamiento existente.
            fragmentStore.markStatusBatch(fragmentSource, sentRefs, "SENT");
            fragmentStore.markStatusBatch(fragmentSource, rejectedByRef, "REJECTED");
            // H5: avanza el estado durable en mt101_archive (auditoría) si la sync no se desactivó.
            syncArchive(configuration, fragmentSource, sentTargets, "SENT");
            syncArchive(configuration, fragmentSource, rejectedTargets, "REJECTED");
        }
    }

    /**
     * P0-1 (PAY normal): finaliza el resultado con transición terminal GUARDADA. Un resultado tardío (p.ej. un
     * ACCEPTED de un send colgado) NO sobrescribe un terminal ya resuelto por STATUS/RECONCILE: los refs que no
     * transicionan desde DISPATCHING/UNCERTAIN quedaron en un terminal contradictorio → se marcan pay_conflict
     * (durable, sin sobrescribir) y NO se propagan a archive. Fuerza conciliación, sin sobrescritura silenciosa.
     * Espejo del PAY_CONFLICT del correctivo (V58) sobre el fragmento normal.
     */
    private void finalizeNormalGuarded(TaskContext context, Map<String, Object> configuration,
            Map<String, Object> fragmentSource,
            java.util.List<String> sentRefs, Map<String, String> rejectedByRef, java.util.List<String> uncertainRefs,
            Map<String, String> invalidatedByRef,
            java.util.List<Mt101ArchiveStatusUpdater.StatusTarget> sentTargets,
            java.util.List<Mt101ArchiveStatusUpdater.StatusTarget> rejectedTargets) {
        var fromUnresolved = java.util.List.of("DISPATCHING", "UNCERTAIN");
        var sentUpdated = fragmentStore.resolvePayStatusReturning(fragmentSource, sentRefs, fromUnresolved, "SENT", null);
        var rejectedUpdated = fragmentStore.resolvePayStatusReturning(
                fragmentSource, rejectedByRef, fromUnresolved, "REJECTED");

        // Refs que NO transicionaron desde DISPATCHING/UNCERTAIN: su estado actual ya es terminal. Se CLASIFICA
        // con el estado real (P0-1, simetría), sin tratar cualquier no-update como conflicto:
        //   estado actual == terminal entrante  -> SAME_TERMINAL: idempotente, NO es conflicto (evita el falso
        //                                           positivo cuando STATUS ya resolvió al mismo terminal).
        //   estado actual == OTRO terminal        -> CONFLICT: contradicción real -> pay_conflict + trama append-only.
        var intendedByRef = new java.util.LinkedHashMap<String, String>();
        for (var ref : sentRefs) {
            if (!sentUpdated.contains(ref)) {
                intendedByRef.put(ref, "SENT");
            }
        }
        for (var ref : rejectedByRef.keySet()) {
            if (!rejectedUpdated.contains(ref)) {
                intendedByRef.put(ref, "REJECTED");
            }
        }
        var conflicts = new java.util.LinkedHashSet<String>();
        var conflictAudit = new ArrayList<AuditEnvelope>();
        if (!intendedByRef.isEmpty()) {
            var currentStatuses = fragmentStore.payStatusesFor(fragmentSource, intendedByRef.keySet());
            for (var entry : intendedByRef.entrySet()) {
                var ref = entry.getKey();
                var incoming = entry.getValue();
                var current = currentStatuses.get(ref);
                if (current == null || incoming.equals(current)) {
                    // SAME_TERMINAL (o ya no existe): idempotente. No sobrescribe y NO marca conflicto.
                    continue;
                }
                conflicts.add(ref);
                conflictAudit.add(payConflictEnvelope(context, ref, current, incoming));
            }
        }
        // UNCERTAIN solo desde DISPATCHING (un terminal ya resuelto no debe bajar a UNCERTAIN).
        if (!uncertainRefs.isEmpty()) {
            fragmentStore.resolvePayStatusReturning(fragmentSource, uncertainRefs,
                    java.util.List.of("DISPATCHING"), "UNCERTAIN", null);
        }
        // D.2 (PAY normal): transportFailure pre-despacho -> el fragmento fue reclamado a DISPATCHING pero NADA salio
        // al banco. Se REVIERTE DISPATCHING->ARCHIVED (re-pagable por la proxima ejecucion de PAY, que solo lee
        // ARCHIVED). Guardado (solo-desde-DISPATCHING): un terminal tardio de STATUS/RECONCILE no se pisa. La
        // auditoria ya emitio RECORD_INVALIDATED (recordEnvelope). No hay doble pago: retriable ⟺ pre-despacho.
        if (!invalidatedByRef.isEmpty()) {
            fragmentStore.resolvePayStatusReturning(fragmentSource, invalidatedByRef,
                    java.util.List.of("DISPATCHING"), "ARCHIVED");
        }
        if (!conflicts.isEmpty()) {
            fragmentStore.markPayConflict(fragmentSource, conflicts,
                    "resultado terminal tardío contradijo una resolución previa (STATUS/RECONCILE); "
                            + "no se sobrescribió el fragmento — conciliar");
            // Trama append-only PAY_CONFLICT (espejo del correctivo): el booleano no basta para monitoreo bancario.
            emitRecordAudit(conflictAudit);
            // No propagar a archive los conflictivos: coherencia con el pay_status real del fragmento.
            sentTargets.removeIf(target -> conflicts.contains(target.sendersReference()));
            rejectedTargets.removeIf(target -> conflicts.contains(target.sendersReference()));
        }
        // H5: avanza mt101_archive para lo NO conflictivo si la sync no se desactivó.
        syncArchive(configuration, fragmentSource, sentTargets, "SENT");
        syncArchive(configuration, fragmentSource, rejectedTargets, "REJECTED");
    }

    /**
     * P0-1 (C): trama append-only {@code PAY_CONFLICT} para el PAY normal, espejo de la acción del ledger
     * correctivo. Un resultado terminal tardío contradijo el estado ya resuelto por STATUS/RECONCILE; se conserva
     * el estado real (no se sobrescribe) y se deja evidencia conciliable en auditoría/timeline/UI (no solo el
     * booleano {@code pay_conflict}). Mismo esqueleto que {@link #recordEnvelope} para paridad de esquema.
     */
    private AuditEnvelope payConflictEnvelope(TaskContext context, String reference,
            String currentStatus, String incomingTerminal) {
        // DRY: misma trama PAY_CONFLICT que emite el resolver STATUS, con source=WORKER (contradicción detectada al
        // aplicar un resultado terminal tardío del despacho).
        return com.integrationhub.platform.service.payments.swift.Mt101PayConflictAudit.envelope(
                context.processExecutionId(), context.taskDefinitionId(), reference, currentStatus, incomingTerminal,
                null, com.integrationhub.platform.service.payments.swift.Mt101PayConflictAudit.Source.WORKER, null);
    }

    private record RoutedDispatchMessage(Mt101Message message, String routedAs, String routeError) {
    }

    /**
     * P0.1 v21: persiste el resultado por fragmento de la pagina al ledger correctivo (todos).
     * v34: devuelve las referencias en conflicto terminal (el ledger no aceptó SENT) para no propagarlas a
     * build_fragment/archive.
     */
    private java.util.List<String> persistCorrectiveLedger(Map<String, Object> fragmentSource,
                                         java.util.List<Mt101RebuildRepository.PayFragmentResult> pageLedger) {
        var rebuildRunId = stringValue(fragmentSource.get("correctivePayRunId"), null);
        if (rebuildRunId == null || rebuildRunId.isBlank() || correctivePayStore == null || pageLedger.isEmpty()) {
            return java.util.List.of();
        }
        return correctivePayStore.markResults(fragmentSource, rebuildRunId, pageLedger);
    }

    /** P0.2 v24: hash del payload actual, idéntico al que el servicio congeló en el ledger al preparar. */
    private String payloadHash(Mt101Message message) {
        return sha256Hex(message == null ? "" : message.rawPayload());
    }

    /**
     * R1: identidad ESTABLE del pago para el intent-ledger del camino de lista. El {@code UETR} es el ÚNICO campo
     * volátil del payload formateado (los 3 formatters solo inyectan {@code uetr}; {@code uetrStrategy=perMessage} lo
     * regenera en cada build), así que se neutraliza: dos builds del MISMO pago (mismo :20:, mismo negocio) dan la
     * MISMA identidad (preserva la idempotencia del re-request), pero cualquier diferencia material (monto,
     * beneficiario, cuenta) cambia el hash → colisión detectable. El fallo seguro es hacia conflicto, nunca hacia
     * silenciar un pago.
     */
    private String paymentIdentityHash(Mt101Message message) {
        var raw = message == null || message.rawPayload() == null ? "" : message.rawPayload();
        var uetr = message != null && message.envelope() != null ? message.envelope().uetr() : null;
        if (uetr != null && !uetr.isBlank()) {
            raw = raw.replace(uetr, "");
        }
        return sha256Hex(raw);
    }

    private static String sha256Hex(String value) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest((value == null ? "" : value).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    /** Construye la trama RECORD de despacho para un fragmento (traceId=ejecucion, recordId=:20:). */
    private AuditEnvelope recordEnvelope(TaskContext context, String reference, TransportResult result) {
        var payStatus = payStatusOf(result);
        var action = result.accepted() ? "RECORD_SENT"
                : (result.uncertain() ? "RECORD_SEND_UNCERTAIN"
                : (result.retriable() ? "RECORD_INVALIDATED" : "RECORD_REJECTED"));
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                context.processExecutionId() == null ? null : "exec-" + context.processExecutionId(),
                reference,
                AuditLevel.RECORD,
                action,
                payStatus,
                context.processExecutionId(),
                context.taskDefinitionId(),
                result.lastError(),
                null,
                Map.of("attempts", String.valueOf(result.attempts())),
                "SWIFT",
                "MT101",
                null,
                null,
                null,
                null,
                null,
                reference,
                null,
                null,
                null,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }

    /** Emite el lote de tramas RECORD si hay un emisor inyectado (no en tests unitarios). */
    private void emitRecordAudit(List<AuditEnvelope> envelopes) {
        if (recordAuditEmitter != null && !envelopes.isEmpty()) {
            recordAuditEmitter.emitRecords(envelopes);
        }
    }

    /**
     * P3: en el camino de LISTA en memoria reclama la intención de dispatch (idempotency key del banco) ANTES de enviar,
     * dándole re-request-safety: un re-request del mismo pago encuentra la fila y NO reenvía. El camino persistido
     * ({@code durableIntent=false}) ya tiene su claim de fragmento y no pasa por aquí.
     */
    private TransportResult dispatchWithDurableIntent(PaymentMessageTransport transport, Mt101Message message,
            Map<String, Object> dispatchConfiguration, Mt101MessageInputResolver.ResolvedMessage input,
            String correlationKey, String sendersReference, TaskContext context, boolean durableIntent) {
        if (!durableIntent || dispatchIntentStore == null) {
            return sendClassified(transport, message, dispatchConfiguration);
        }
        // P0-2 (fail-loud): la clave de re-request-safety EXIGE una correlationKey (idempotency key del banco) NO
        // vacía y única por pago. Si queda vacía (REST con idempotencyKeyTemplate vacío, o SFTP sin dropPathTemplate),
        // dos pagos DISTINTOS colisionarían bajo la misma clave "transport|conn|" y el segundo se reportaría
        // ALREADY_SENT SIN enviarse (silenciaría un pago que nunca salió). Sin correlación NO se crea intención
        // ambigua: rechazo seguro (re-solicitable), nunca una aceptación silenciosa.
        if (correlationKey == null || correlationKey.isBlank()) {
            // D.2: no salió al banco (config incompleta) -> re-solicitable (transportFailure -> INVALIDATED), no un
            // rechazo de negocio que dejaría el correctivo FAILED terminal.
            return TransportResult.transportFailure(0, 0L,
                    "missing per-payment idempotency/correlation key for durable dispatch intent "
                    + "(configure a non-empty idempotencyKeyTemplate for REST or dropPathTemplate for SFTP); not sent");
        }
        // R1 (identidad de pago, fail-loud): el hash del payload (lo EXACTO que recibe el banco) es la prueba de que
        // un ALREADY_SENT corresponde al MISMO pago. Sin payload no hay identidad comparable -> dos pagos distintos
        // bajo la misma clave se silenciarían. Espejo del guard de correlación: sin payload NO se crea intención.
        var rawPayload = message == null ? null : message.rawPayload();
        if (rawPayload == null || rawPayload.isBlank()) {
            // D.2: espejo del guard de correlación; no salió al banco -> re-solicitable (transportFailure).
            return TransportResult.transportFailure(0, 0L,
                    "missing formatted message payload for durable dispatch intent identity "
                    + "(format the MT101 message before PAY so its payload can be hashed); not sent");
        }
        var payloadHash = paymentIdentityHash(message);
        // La clave incluye el destino real (transport + connectionRef) + la idempotency key del banco (correlationKey).
        var intentKey = transport.transport() + "|"
                + (input.connectionRef() == null ? "" : input.connectionRef()) + "|" + correlationKey;
        var peId = context == null ? null : context.processExecutionId();
        var claim = dispatchIntentStore.claimForDispatch(intentKey, peId, sendersReference, payloadHash);
        return switch (claim) {
            case CLAIMED -> {
                var sent = sendClassified(transport, message, dispatchConfiguration);
                // DISPATCHING -> SENT/REJECTED/UNCERTAIN. Un UNCERTAIN queda durable y bloquea futuros reenvíos.
                dispatchIntentStore.recordResult(intentKey, intentStatus(sent), sent.gatewayReference(),
                        sent.attempts(), sent.lastError());
                yield sent;
            }
            // MISMO pago ya enviado (payload idéntico): NO reenviar (idempotente). Se reporta aceptado (cuenta enviado).
            case ALREADY_SENT -> TransportResult.accepted(null, 0, 0L);
            // R1: MISMA clave, payload DISTINTO -> es OTRO pago colisionando con la idempotency key de uno ya enviado
            // (o ambiguo). NUNCA se reporta aceptado (silenciaría este pago): se clasifica INCIERTO (no toca archive,
            // no-éxito, exige conciliar la colisión de clave). No se sobrescribe el pago original.
            case ALREADY_SENT_CONFLICT -> TransportResult.uncertain(0, 0L,
                    "a different payment payload collides with the idempotency key of an already-SENT payment; "
                    + "not sent — reconcile the key collision (no re-send)");
            case ALREADY_UNCERTAIN_CONFLICT -> TransportResult.uncertain(0, 0L,
                    "a different payment payload collides with the idempotency key of an ambiguous (UNCERTAIN) "
                    + "payment; not sent — reconcile the key collision (no re-send)");
            // MISMO pago ambiguo o en vuelo: NO reenviar; exige conciliación (nunca un reenvío ciego).
            default -> TransportResult.uncertain(0, 0L,
                    "prior dispatch for the same payment is ambiguous or in-flight; reconcile before re-send (no re-send)");
        };
    }

    private TransportResult sendClassified(PaymentMessageTransport transport, Mt101Message message,
                                           Map<String, Object> dispatchConfiguration) {
        try {
            return transport.send(message, dispatchConfiguration);
        } catch (PreDispatchTransportException configError) {
            // v27 P1 + D.2: error TIPADO de pre-dispatch (validacion/config, antes de cualquier I/O): el mensaje NO
            // salio al banco -> re-solicitable. Es un fallo tecnico, no un rechazo de negocio del banco: transportFailure
            // (-> INVALIDATED), para que un correctivo no quede FAILED terminal por un error de configuracion.
            return TransportResult.transportFailure(1, 0L, "transport config error: " + configError.getMessage());
        } catch (RuntimeException error) {
            // P0 v26+v27: cualquier OTRA excepcion es INCIERTA: si no se puede DEMOSTRAR que no salio al banco, nunca se
            // marca REJECTED reusable (evita doble pago); se resuelve por STATUS/conciliacion.
            return TransportResult.uncertain(1, 0L, "unexpected transport error: " + error.getMessage());
        }
    }

    /** D.2: mapa único TransportResult → pay_status del ledger. retriable (fallo de transporte) → INVALIDATED. */
    private static String payStatusOf(TransportResult result) {
        if (result.accepted()) {
            return "SENT";
        }
        if (result.uncertain()) {
            return "UNCERTAIN";
        }
        if (result.retriable()) {
            return "INVALIDATED";
        }
        return "REJECTED";
    }

    private String intentStatus(TransportResult result) {
        // D.2: retriable (transportFailure pre-despacho) -> INVALIDATED (no salio al banco), NO REJECTED (no fue
        // rechazo de negocio). El intent store re-reclama INVALIDATED igual que REJECTED (mismo "probado no enviado").
        return result.accepted() ? "SENT"
                : result.uncertain() ? "UNCERTAIN"
                : result.retriable() ? "INVALIDATED"
                : "REJECTED";
    }

    /** Despacha un mensaje y acumula el resultado (camino persistido: sin intent, ya tiene claim de fragmento). */
    private TransportResult dispatch(PaymentMessageTransport transport,
                                     Map<String, Object> configuration,
                                     Mt101Message message,
                                     DispatchAccumulator accumulator,
                                     TaskContext context) {
        return dispatch(transport, configuration,
                new Mt101MessageInputResolver.ResolvedMessage(message, null, null, null),
                accumulator, context, false);
    }

    private TransportResult dispatch(PaymentMessageTransport transport,
                                     Map<String, Object> configuration,
                                     Mt101MessageInputResolver.ResolvedMessage input,
                                     DispatchAccumulator accumulator,
                                     TaskContext context,
                                     boolean durableIntent) {
        var message = input.message();
        accumulator.transportsUsed.add(transport.transport());
        var correlationKey = Mt101PaymentCorrelation.correlationKey(transport.transport(), configuration, message);
        var dispatchConfiguration = Mt101PaymentCorrelation.withResolvedCorrelation(
                transport.transport(), configuration, message);
        var ref = message.sequenceA() != null ? message.sequenceA().sendersReference() : null;
        var result = dispatchWithDurableIntent(transport, message, dispatchConfiguration, input,
                correlationKey, ref, context, durableIntent);

        var uetr = message.envelope() != null ? message.envelope().uetr() : null;
        var entry = new LinkedHashMap<String, Object>();
        entry.put("sendersReference", ref);
        if (input.archiveId() != null) {
            entry.put("archiveId", input.archiveId());
        }
        if (input.envelopeId() != null) {
            entry.put("envelopeId", input.envelopeId());
        }
        entry.put("uetr", uetr);
        entry.put("idempotencyKey", correlationKey);
        entry.put("status", result.accepted() ? "ACCEPTED"
                : (result.uncertain() ? "UNCERTAIN" : (result.retriable() ? "INVALIDATED" : "REJECTED")));
        entry.put("gatewayReference", result.gatewayReference());
        entry.put("attempts", result.attempts());
        entry.put("durationMs", result.durationMs());
        if (result.lastError() != null) {
            entry.put("lastError", result.lastError());
        }
        accumulator.totalDurationMs += result.durationMs();
        // Sample acotado: solo conservamos las primeras maxRecordsInOutput
        // entradas en el output (records = todos los despachados, errors = los
        // rechazados); los conteos son siempre exactos. Para 100k+ fragmentos
        // esto evita acumular 100k maps en heap.
        accumulator.addSentSample(entry);
        if (result.accepted()) {
            accumulator.acceptedCount++;
        } else if (result.uncertain()) {
            // INCIERTO: ni enviado ni rechazado. No se reenvia a ciegas (duplicaria el pago);
            // exige conciliacion/intervencion. Se reporta aparte para el orquestador.
            accumulator.uncertainCount++;
            accumulator.addUncertainSample(entry);
        } else if (result.retriable()) {
            // D.2: fallo de TRANSPORTE/AUTH antes del despacho (no salio al banco) -> re-solicitable, NO un rechazo
            // de negocio. Se cuenta aparte para no reportarlo como REJECTED (que llevaria el correctivo a FAILED).
            accumulator.invalidatedCount++;
            accumulator.addErrorSample(entry);
        } else {
            accumulator.rejectedCount++;
            accumulator.addErrorSample(entry);
        }
        if (result.attempts() > 1) {
            accumulator.retriedCount++;
        }
        return result;
    }

    /** Acumula resultados de despacho con sample acotado (memoria O(maxRecords)). */
    private static final class DispatchAccumulator {
        private final List<Map<String, Object>> sent = new ArrayList<>();
        private final List<Map<String, Object>> errors = new ArrayList<>();
        private final List<Map<String, Object>> uncertain = new ArrayList<>();
        private final int maxRecordsInOutput;
        // v38: transportes REALMENTE usados por el dispatch (del plan persistido en el correctivo), no el
        // inferido de la configuracion viva.
        final java.util.Set<String> transportsUsed = new java.util.LinkedHashSet<>();
        int acceptedCount;
        int rejectedCount;
        int uncertainCount;
        int invalidatedCount;
        int retriedCount;
        long totalDurationMs;

        DispatchAccumulator(int maxRecordsInOutput) {
            this.maxRecordsInOutput = Math.max(maxRecordsInOutput, 0);
        }

        void addSentSample(Map<String, Object> entry) {
            if (sent.size() < maxRecordsInOutput) {
                sent.add(entry);
            }
        }

        void addErrorSample(Map<String, Object> entry) {
            if (errors.size() < maxRecordsInOutput) {
                errors.add(entry);
            }
        }

        void addUncertainSample(Map<String, Object> entry) {
            if (uncertain.size() < maxRecordsInOutput) {
                uncertain.add(entry);
            }
        }

        int totalCount() {
            return acceptedCount + rejectedCount + uncertainCount + invalidatedCount;
        }
    }

    private void syncArchive(Map<String, Object> configuration,
                             Map<String, Object> fragmentSource,
                             java.util.Collection<Mt101ArchiveStatusUpdater.StatusTarget> targets,
                             String status) {
        if (archiveStatusUpdater == null || targets.isEmpty()
                || !boolValue(configuration.get("archiveStatusSync"), true)) {
            return;
        }
        var connectionRef = stringValue(fragmentSource.get("connectionRef"), null);
        var table = stringValue(configuration.get("archiveStatusTable"),
                Mt101ArchiveStatusUpdater.DEFAULT_TABLE);
        archiveStatusUpdater.updateStatusTargets(connectionRef, table, targets, status);
    }

    private void collectArchiveId(Map<String, Object> configuration,
                                  Mt101MessageInputResolver.ResolvedMessage input,
                                  Map<String, List<Long>> archiveIdsByConnection) {
        if (input.archiveId() == null) {
            return;
        }
        var connectionRef = stringValue(input.connectionRef(),
                stringValue(configuration.get("archiveStatusConnectionRef"),
                        stringValue(configuration.get("connectionRef"), null)));
        archiveIdsByConnection.computeIfAbsent(connectionRef, ignored -> new ArrayList<>())
                .add(input.archiveId());
    }

    private void syncArchiveIds(Map<String, Object> configuration,
                                Map<String, List<Long>> archiveIdsByConnection,
                                String status) {
        if (archiveStatusUpdater == null || archiveIdsByConnection.isEmpty()
                || !boolValue(configuration.get("archiveStatusSync"), true)) {
            return;
        }
        var table = stringValue(configuration.get("archiveStatusTable"),
                Mt101ArchiveStatusUpdater.DEFAULT_TABLE);
        archiveIdsByConnection.forEach((connectionRef, archiveIds) ->
                archiveStatusUpdater.updateStatusByArchiveIds(connectionRef, table, archiveIds, status));
    }

    private Mt101ArchiveStatusUpdater.StatusTarget archiveTarget(Mt101Message message) {
        var sequenceA = message.sequenceA();
        var envelope = message.envelope();
        return new Mt101ArchiveStatusUpdater.StatusTarget(
                sequenceA == null ? null : sequenceA.sendersReference(),
                sequenceA == null ? null : sequenceA.requestedExecutionDate(),
                envelope == null ? null : envelope.senderLt());
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    private PaymentMessageTransport resolveTransport(String transportId) {
        for (var transport : transports) {
            if (transport.transport().equalsIgnoreCase(transportId)) {
                return transport;
            }
        }
        var available = new StringBuilder();
        transports.forEach(t -> {
            if (available.length() > 0) available.append(", ");
            available.append(t.transport());
        });
        throw new IllegalArgumentException("Unsupported MT101_PAY transport: " + transportId
                + ". Available: " + available);
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
    }
}
