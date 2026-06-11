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

    private final Instance<PaymentMessageTransport> transports;
    private final Mt101FragmentStore fragmentStore;

    @Inject
    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports,
                                Mt101FragmentStore fragmentStore) {
        this.transports = transports;
        this.fragmentStore = fragmentStore;
    }

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports) {
        this(transports, null);
    }

    @Override
    public String type() {
        return "MT101_PAY";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var transportId = stringValue(configuration.get("transport"), DEFAULT_TRANSPORT).toUpperCase();
        var transport = resolveTransport(transportId);
        var fragmentSource = Mt101MessageInputResolver.fragmentSource(context, configuration, type());

        var accumulator = new DispatchAccumulator();
        if (!fragmentSource.isEmpty() && fragmentStore != null) {
            var pageSize = intValue(configuration.get("pageSize"), Mt101FragmentStore.DEFAULT_PAGE_SIZE);
            fragmentStore.forEachPage(fragmentSource, FRAGMENT_READ_STATUSES, pageSize, page -> {
                // Marcado por lote al cierre de cada pagina. Trade-off: si el
                // proceso muere a mitad de pagina, hasta pageSize fragmentos
                // quedan SENT-en-banco pero ARCHIVED-en-BD; el Idempotency-Key
                // del transporte REST hace seguro el re-envio.
                var sentRefs = new ArrayList<String>(page.size());
                var rejectedByRef = new LinkedHashMap<String, String>();
                for (var message : page) {
                    var accepted = dispatch(transport, configuration, message, accumulator);
                    var reference = message.sequenceA() == null ? null
                            : message.sequenceA().sendersReference();
                    if (reference == null) {
                        continue;
                    }
                    if (accepted) {
                        sentRefs.add(reference);
                    } else {
                        rejectedByRef.put(reference, accumulator.lastErrorOf(reference));
                    }
                }
                fragmentStore.markStatusBatch(fragmentSource, sentRefs, "SENT");
                fragmentStore.markStatusBatch(fragmentSource, rejectedByRef, "REJECTED");
            });
        } else {
            var messages = Mt101MessageInputResolver.readMessages(context, configuration, type(), fragmentStore);
            for (var message : messages) {
                dispatch(transport, configuration, message, accumulator);
            }
        }

        if (accumulator.sent.isEmpty() && accumulator.errors.isEmpty()) {
            return TaskResult.success("MT101_PAY skipped because there are no messages to dispatch");
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("sentCount", accumulator.sent.size());
        outputs.put("acceptedCount", accumulator.acceptedCount);
        outputs.put("rejectedCount", accumulator.rejectedCount);
        outputs.put("retriedCount", accumulator.retriedCount);
        outputs.put("totalDurationMs", accumulator.totalDurationMs);
        outputs.put("transport", transportId);
        outputs.put("records", accumulator.sent);
        outputs.put("errors", accumulator.errors);

        var summary = "MT101_PAY via " + transportId
                + " sent=" + accumulator.sent.size()
                + " accepted=" + accumulator.acceptedCount
                + " rejected=" + accumulator.rejectedCount
                + " retried=" + accumulator.retriedCount;
        return accumulator.rejectedCount > 0
                ? TaskResult.failure(summary, outputs)
                : TaskResult.success(summary, outputs);
    }

    /** Despacha un mensaje y acumula el resultado. Devuelve si fue aceptado. */
    private boolean dispatch(PaymentMessageTransport transport,
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
        accumulator.sent.add(entry);
        accumulator.totalDurationMs += result.durationMs();
        if (result.accepted()) {
            accumulator.acceptedCount++;
        } else {
            accumulator.rejectedCount++;
            accumulator.errors.add(entry);
            if (ref != null) {
                accumulator.lastErrorByRef.put(ref, result.lastError());
            }
        }
        if (result.attempts() > 1) {
            accumulator.retriedCount++;
        }
        return result.accepted();
    }

    /** Acumula resultados de despacho sin retener los mensajes en memoria. */
    private static final class DispatchAccumulator {
        final List<Map<String, Object>> sent = new ArrayList<>();
        final List<Map<String, Object>> errors = new ArrayList<>();
        final Map<String, String> lastErrorByRef = new LinkedHashMap<>();
        int acceptedCount;
        int rejectedCount;
        int retriedCount;
        long totalDurationMs;

        String lastErrorOf(String sendersReference) {
            return lastErrorByRef.get(sendersReference);
        }
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
