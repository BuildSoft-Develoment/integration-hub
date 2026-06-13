package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.spi.PaymentMessageTransport;
import com.integrationhub.platform.provider.task.payments.spi.TransportResult;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
 * <p><b>Outputs</b>: {@code summary} (sentCount/acceptedCount/rejectedCount/retriedCount),
 * {@code records} (status por mensaje) y {@code errors} (mensajes rechazados con causa).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-004, T-009
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101PayTaskProvider implements TaskProvider {

    private static final String DEFAULT_TRANSPORT = "REST";
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

    @Inject
    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore,
                                Mt101ArchiveStatusUpdater archiveStatusUpdater) {
        this.transports = transports;
        this.fragmentStore = fragmentStore;
        this.archiveStatusUpdater = archiveStatusUpdater;
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore) {
        this(transports, fragmentStore, null);
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports) {
        this(transports, null, null);
    }

    @Override
    public String type() {
        return "MT101_PAY";
    }

    @Override
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var transportId = stringValue(configuration.get("transport"), DEFAULT_TRANSPORT).toUpperCase();
        var transport = resolveTransport(transportId);
        var fragmentSource = Mt101MessageInputResolver.fragmentSource(context, configuration, type());

        var accumulator = new DispatchAccumulator(
                intValue(configuration.get("maxRecordsInOutput"), DEFAULT_MAX_RECORDS_IN_OUTPUT));
        if (!fragmentSource.isEmpty() && fragmentStore != null) {
            var pageSize = intValue(configuration.get("pageSize"), Mt101FragmentStore.DEFAULT_PAGE_SIZE);
            fragmentStore.forEachPage(fragmentSource, FRAGMENT_READ_STATUSES, pageSize, page -> {
                // Marcado por lote al cierre de cada pagina. Trade-off: si el
                // proceso muere a mitad de pagina, hasta pageSize fragmentos
                // quedan SENT-en-banco pero ARCHIVED-en-BD; el Idempotency-Key
                // del transporte REST hace seguro el re-envio.
                var sentRefs = new ArrayList<String>(page.size());
                // Mapa de errores acotado a la pagina (no a la ejecucion completa).
                var rejectedByRef = new LinkedHashMap<String, String>();
                for (var message : page) {
                    var lastError = dispatch(transport, configuration, message, accumulator);
                    var reference = message.sequenceA() == null ? null
                            : message.sequenceA().sendersReference();
                    if (reference == null) {
                        continue;
                    }
                    if (lastError == null) {
                        sentRefs.add(reference);
                    } else {
                        rejectedByRef.put(reference, lastError);
                    }
                }
                fragmentStore.markStatusBatch(fragmentSource, sentRefs, "SENT");
                fragmentStore.markStatusBatch(fragmentSource, rejectedByRef, "REJECTED");
                // H5: avanza el estado durable en mt101_archive (la tabla de
                // auditoria, no solo el fragmento) si la sincronizacion no se
                // desactivo explicitamente.
                syncArchive(configuration, fragmentSource, sentRefs, "SENT");
                syncArchive(configuration, fragmentSource, rejectedByRef.keySet(), "REJECTED");
            });
        } else {
            var messages = Mt101MessageInputResolver.readMessages(context, configuration, type(), fragmentStore);
            for (var message : messages) {
                dispatch(transport, configuration, message, accumulator);
            }
        }

        if (accumulator.totalCount() == 0) {
            return TaskResult.success("MT101_PAY skipped because there are no messages to dispatch");
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("sentCount", accumulator.totalCount());
        outputs.put("acceptedCount", accumulator.acceptedCount);
        outputs.put("rejectedCount", accumulator.rejectedCount);
        outputs.put("retriedCount", accumulator.retriedCount);
        outputs.put("totalDurationMs", accumulator.totalDurationMs);
        outputs.put("transport", transportId);
        // records/errors son una MUESTRA acotada (ver maxRecordsInOutput); para
        // el detalle completo, consultar mt101_build_fragment por fragmentSetId.
        outputs.put("records", accumulator.sent);
        outputs.put("errors", accumulator.errors);
        outputs.put("recordsSampled", accumulator.totalCount() > accumulator.sent.size());

        var summary = "MT101_PAY via " + transportId
                + " sent=" + accumulator.totalCount()
                + " accepted=" + accumulator.acceptedCount
                + " rejected=" + accumulator.rejectedCount
                + " retried=" + accumulator.retriedCount;
        return accumulator.rejectedCount > 0
                ? TaskResult.failure(summary, outputs)
                : TaskResult.success(summary, outputs);
    }

    /** Despacha un mensaje y acumula el resultado. Devuelve lastError, o null si aceptado. */
    private String dispatch(PaymentMessageTransport transport,
                            Map<String, Object> configuration,
                            Mt101Message message,
                            DispatchAccumulator accumulator) {
        TransportResult result;
        try {
            result = transport.send(message, configuration);
        } catch (RuntimeException error) {
            result = TransportResult.rejected(1, 0L, "transport error: " + error.getMessage());
        }

        var ref = message.sequenceA() != null ? message.sequenceA().sendersReference() : null;
        var uetr = message.envelope() != null ? message.envelope().uetr() : null;
        var entry = new LinkedHashMap<String, Object>();
        entry.put("sendersReference", ref);
        entry.put("uetr", uetr);
        entry.put("status", result.accepted() ? "ACCEPTED" : "REJECTED");
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
        } else {
            accumulator.rejectedCount++;
            accumulator.addErrorSample(entry);
        }
        if (result.attempts() > 1) {
            accumulator.retriedCount++;
        }
        return result.lastError();
    }

    /** Acumula resultados de despacho con sample acotado (memoria O(maxRecords)). */
    private static final class DispatchAccumulator {
        private final List<Map<String, Object>> sent = new ArrayList<>();
        private final List<Map<String, Object>> errors = new ArrayList<>();
        private final int maxRecordsInOutput;
        int acceptedCount;
        int rejectedCount;
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

        int totalCount() {
            return acceptedCount + rejectedCount;
        }
    }

    private void syncArchive(Map<String, Object> configuration,
                             Map<String, Object> fragmentSource,
                             java.util.Collection<String> references,
                             String status) {
        if (archiveStatusUpdater == null || references.isEmpty()
                || !boolValue(configuration.get("archiveStatusSync"), true)) {
            return;
        }
        var connectionRef = stringValue(fragmentSource.get("connectionRef"), null);
        var table = stringValue(configuration.get("archiveStatusTable"),
                Mt101ArchiveStatusUpdater.DEFAULT_TABLE);
        archiveStatusUpdater.updateStatus(connectionRef, table, references, status);
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
