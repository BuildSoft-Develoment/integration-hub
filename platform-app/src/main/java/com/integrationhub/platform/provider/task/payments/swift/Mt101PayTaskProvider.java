package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import com.integrationhub.platform.spi.task.payments.PaymentMessageTransport;
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

    @Inject
    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore,
                                Mt101ArchiveStatusUpdater archiveStatusUpdater,
                                RecordAuditEmitter recordAuditEmitter,
                                Mt101CorrectivePayStore correctivePayStore) {
        this.transports = transports;
        this.fragmentStore = fragmentStore;
        this.archiveStatusUpdater = archiveStatusUpdater;
        this.recordAuditEmitter = recordAuditEmitter;
        this.correctivePayStore = correctivePayStore;
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
                var result = dispatch(effectiveTransport, plan.configuration(), input, accumulator);
                var reference = input.message() != null && input.message().sequenceA() != null
                        ? input.message().sequenceA().sendersReference() : null;
                if (result.accepted()) {
                    collectArchiveId(configuration, input, sentArchiveIds);
                } else if (result.uncertain()) {
                    // INCIERTO: no se sincroniza a SENT ni REJECTED; queda para conciliacion.
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
        outputs.put("uncertainCount", accumulator.uncertainCount);
        outputs.put("retriedCount", accumulator.retriedCount);
        outputs.put("totalDurationMs", accumulator.totalDurationMs);
        outputs.put("transport", transportId);
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
                + " uncertain=" + accumulator.uncertainCount
                + " retried=" + accumulator.retriedCount;
        // INCIERTO tambien es no-exito: el orquestador debe tratarlo (no asumir enviado).
        return accumulator.rejectedCount > 0 || accumulator.uncertainCount > 0
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
        for (var item : page) {
            var message = item.message();
            var plan = Mt101PayRouteResolver.resolve(configuration, item.routedAs(), item.routeError(), message);
            var transport = defaultTransport == null ? resolveTransport(plan.transport()) : defaultTransport;
            var reference = message.sequenceA() == null ? null
                    : message.sequenceA().sendersReference();
            // P0.2 v22: ninguna llamada externa sin intencion durable aprobada. Solo se despacha
            // si se reclamo EXACTAMENTE una intencion PREPARED del ledger correctivo; un fragmento
            // ya DISPATCHING/terminal o sin intencion NO se reenvia (se resuelve por STATUS).
            if (!claimDispatch(fragmentSource, reference)) {
                continue;
            }
            var result = dispatch(transport, plan.configuration(), message, accumulator);
            if (reference == null) {
                continue;
            }
            if (result.accepted()) {
                sentRefs.add(reference);
                sentTargets.add(archiveTarget(message));
            } else if (result.uncertain()) {
                // INCIERTO: no se marca SENT ni REJECTED (ningun bucket) -> el fragmento
                // queda ARCHIVED y requiere conciliacion; reenviarlo duplicaria el pago.
            } else {
                rejectedByRef.put(reference, result.lastError());
                rejectedTargets.add(archiveTarget(message));
            }
            pageAudit.add(recordEnvelope(context, reference, result));
            var payStatus = result.accepted() ? "SENT" : (result.uncertain() ? "UNCERTAIN" : "REJECTED");
            pageLedger.add(new Mt101RebuildRepository.PayFragmentResult(
                    reference, payStatus, result.gatewayReference(), result.attempts(), result.lastError()));
        }
        // Trazabilidad E2E por registro: una trama RECORD por fragmento,
        // emitida en lote por pagina (un solo JDBC batch), fuera de la TX.
        emitRecordAudit(pageAudit);
        persistCorrectiveLedger(fragmentSource, pageLedger);
        fragmentStore.markStatusBatch(fragmentSource, sentRefs, "SENT");
        fragmentStore.markStatusBatch(fragmentSource, rejectedByRef, "REJECTED");
        // H5: avanza el estado durable en mt101_archive (la tabla de
        // auditoria, no solo el fragmento) si la sincronizacion no se
        // desactivo explicitamente.
        syncArchive(configuration, fragmentSource, sentTargets, "SENT");
        syncArchive(configuration, fragmentSource, rejectedTargets, "REJECTED");
    }

    private record RoutedDispatchMessage(Mt101Message message, String routedAs, String routeError) {
    }

    /** P0.1 v21: persiste el resultado por fragmento de la pagina al ledger correctivo (todos). */
    private void persistCorrectiveLedger(Map<String, Object> fragmentSource,
                                         java.util.List<Mt101RebuildRepository.PayFragmentResult> pageLedger) {
        var rebuildRunId = stringValue(fragmentSource.get("correctivePayRunId"), null);
        if (rebuildRunId == null || rebuildRunId.isBlank() || correctivePayStore == null || pageLedger.isEmpty()) {
            return;
        }
        correctivePayStore.markResults(fragmentSource, rebuildRunId, pageLedger);
    }

    /**
     * P0.2 v22: reclama la intencion durable antes del envio. Devuelve true si se puede despachar:
     * en el flujo no-correctivo siempre; en el correctivo, solo si se reclamo EXACTAMENTE una
     * intencion {@code PREPARED} (transicion atomica PREPARED -> DISPATCHING). Si false, NO se
     * llama al transporte (un fragmento ya DISPATCHING/terminal o sin intencion no se reenvia).
     */
    private boolean claimDispatch(Map<String, Object> fragmentSource, String reference) {
        var rebuildRunId = stringValue(fragmentSource.get("correctivePayRunId"), null);
        if (rebuildRunId == null) {
            return true;
        }
        if (correctivePayStore == null) {
            throw new IllegalStateException("MT101_PAY corrective source requires Mt101CorrectivePayStore");
        }
        if (reference == null || reference.isBlank()) {
            return false;
        }
        return correctivePayStore.markDispatching(fragmentSource, rebuildRunId, reference);
    }

    /** Construye la trama RECORD de despacho para un fragmento (traceId=ejecucion, recordId=:20:). */
    private AuditEnvelope recordEnvelope(TaskContext context, String reference, TransportResult result) {
        var uncertain = result.uncertain();
        var accepted = result.accepted();
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                context.processExecutionId() == null ? null : "exec-" + context.processExecutionId(),
                reference,
                AuditLevel.RECORD,
                accepted ? "RECORD_SENT" : (uncertain ? "RECORD_SEND_UNCERTAIN" : "RECORD_REJECTED"),
                accepted ? "SENT" : (uncertain ? "UNCERTAIN" : "REJECTED"),
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

    /** Despacha un mensaje y acumula el resultado. */
    private TransportResult dispatch(PaymentMessageTransport transport,
                                     Map<String, Object> configuration,
                                     Mt101Message message,
                                     DispatchAccumulator accumulator) {
        return dispatch(transport, configuration,
                new Mt101MessageInputResolver.ResolvedMessage(message, null, null, null),
                accumulator);
    }

    private TransportResult dispatch(PaymentMessageTransport transport,
                                     Map<String, Object> configuration,
                                     Mt101MessageInputResolver.ResolvedMessage input,
                                     DispatchAccumulator accumulator) {
        var message = input.message();
        TransportResult result;
        var correlationKey = Mt101PaymentCorrelation.correlationKey(transport.transport(), configuration, message);
        var dispatchConfiguration = Mt101PaymentCorrelation.withResolvedCorrelation(
                transport.transport(), configuration, message);
        try {
            result = transport.send(message, dispatchConfiguration);
        } catch (RuntimeException error) {
            result = TransportResult.rejected(1, 0L, "transport error: " + error.getMessage());
        }

        var ref = message.sequenceA() != null ? message.sequenceA().sendersReference() : null;
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
        entry.put("status", result.accepted() ? "ACCEPTED" : (result.uncertain() ? "UNCERTAIN" : "REJECTED"));
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
        int acceptedCount;
        int rejectedCount;
        int uncertainCount;
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
            return acceptedCount + rejectedCount + uncertainCount;
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
