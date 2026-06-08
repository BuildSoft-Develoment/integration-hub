package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.spi.PaymentMessageTransport;
import com.integrationhub.platform.provider.task.payments.spi.TransportResult;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

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

    private final Instance<PaymentMessageTransport> transports;

    public Mt101PayTaskProvider(Instance<PaymentMessageTransport> transports) {
        this.transports = transports;
    }

    @Override
    public String type() {
        return "MT101_PAY";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var messages = readMessages(context, configuration);
        if (messages.isEmpty()) {
            return TaskResult.success("MT101_PAY skipped because there are no messages to dispatch");
        }
        var transportId = stringValue(configuration.get("transport"), DEFAULT_TRANSPORT).toUpperCase();
        var transport = resolveTransport(transportId);

        var sent = new ArrayList<Map<String, Object>>(messages.size());
        var errors = new ArrayList<Map<String, Object>>();
        var acceptedCount = 0;
        var rejectedCount = 0;
        var retriedCount = 0;
        var totalDurationMs = 0L;

        for (var message : messages) {
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
            sent.add(entry);
            totalDurationMs += result.durationMs();
            if (result.accepted()) {
                acceptedCount++;
            } else {
                rejectedCount++;
                errors.add(entry);
            }
            if (result.attempts() > 1) {
                retriedCount++;
            }
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("sentCount", messages.size());
        outputs.put("acceptedCount", acceptedCount);
        outputs.put("rejectedCount", rejectedCount);
        outputs.put("retriedCount", retriedCount);
        outputs.put("totalDurationMs", totalDurationMs);
        outputs.put("transport", transportId);
        outputs.put("records", sent);
        outputs.put("errors", errors);

        var summary = "MT101_PAY via " + transportId
                + " sent=" + messages.size()
                + " accepted=" + acceptedCount
                + " rejected=" + rejectedCount
                + " retried=" + retriedCount;
        return rejectedCount > 0 ? TaskResult.failure(summary, outputs) : TaskResult.success(summary, outputs);
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

    @SuppressWarnings("unchecked")
    private List<Mt101Message> readMessages(TaskContext context, Map<String, Object> configuration) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()) {
            return List.of();
        }
        if (!(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            throw new IllegalArgumentException("MT101_PAY requires configuration.input");
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("MT101_PAY input.sourceTaskRef is required");
        }
        var sourceOutput = stringValue(((Map<String, Object>) rawInput).get("sourceOutput"), "records");
        var key = sourceTaskRef + "." + sourceOutput;
        var raw = taskOutputs.get(key);
        if (raw == null) {
            return List.of();
        }
        if (!(raw instanceof List<?> rawList)) {
            throw new IllegalArgumentException(
                    "Expected " + key + " to be a List<Mt101Message> but got " + raw.getClass().getName());
        }
        var result = new ArrayList<Mt101Message>(rawList.size());
        for (var item : rawList) {
            if (item instanceof Mt101Message msg) {
                result.add(msg);
            } else if (item != null) {
                throw new IllegalArgumentException(
                        "Expected items at " + key + " to be Mt101Message but got " + item.getClass().getName());
            }
        }
        return result;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }
}
