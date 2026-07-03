package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Set;

/**
 * Wire-format de una tarea async (ADR-015): {@link AsyncTaskEnvelope} ↔ {@link OutboundMessage}.
 *
 * <ul>
 *   <li>El <b>topic</b> deriva del {@code taskType} ({@code tasks.<tasktype>}).</li>
 *   <li>La <b>key</b> es la {@code idempotencyKey} (particion estable + base para el
 *       dedup at-least-once en el consumer).</li>
 *   <li>Toda la metadata de correlacion del envelope ({@code traceId},
 *       {@code processExecutionId}, {@code taskDefinitionId}, {@code taskType},
 *       {@code transport}, {@code attempt}, {@code idempotencyKey}) viaja en <b>headers</b>, de
 *       modo que el consumer puede reconstruir el envelope completo (lossless) y correlacionar el
 *       resume; los headers de negocio del envelope (p.ej. {@code recordId}) se preservan.</li>
 * </ul>
 *
 * <p>Logica pura para que el core y cualquier consumer/sidecar compartan el mismo mapeo.</p>
 */
public final class AsyncTaskMessageCodec {

    static final String TOPIC_PREFIX = "tasks.";

    private static final String H_TRACE_ID = "traceId";
    private static final String H_PROCESS_EXECUTION_ID = "processExecutionId";
    private static final String H_TASK_DEFINITION_ID = "taskDefinitionId";
    private static final String H_TASK_TYPE = "taskType";
    private static final String H_TRANSPORT = "transport";
    private static final String H_ATTEMPT = "attempt";
    private static final String H_IDEMPOTENCY_KEY = "idempotencyKey";

    /** Claves gestionadas por el codec; se separan de los headers de negocio al reconstruir. */
    private static final Set<String> CODEC_KEYS = Set.of(
            H_TRACE_ID, H_PROCESS_EXECUTION_ID, H_TASK_DEFINITION_ID, H_TASK_TYPE,
            H_TRANSPORT, H_ATTEMPT, H_IDEMPOTENCY_KEY);

    private AsyncTaskMessageCodec() {
    }

    public static OutboundMessage toMessage(AsyncTaskEnvelope envelope) {
        var headers = new LinkedHashMap<String, String>(envelope.headers());
        headers.put(H_TRACE_ID, nullToEmpty(envelope.traceId()));
        headers.put(H_PROCESS_EXECUTION_ID, Long.toString(envelope.processExecutionId()));
        headers.put(H_TASK_DEFINITION_ID, Long.toString(envelope.taskDefinitionId()));
        headers.put(H_TASK_TYPE, nullToEmpty(envelope.taskType()));
        headers.put(H_TRANSPORT, nullToEmpty(envelope.transport()));
        headers.put(H_ATTEMPT, Integer.toString(envelope.attempt()));
        headers.put(H_IDEMPOTENCY_KEY, nullToEmpty(envelope.idempotencyKey()));
        return new OutboundMessage(topicFor(envelope.taskType()), envelope.idempotencyKey(), envelope.payload(), headers);
    }

    /**
     * Reconstruye el {@link AsyncTaskEnvelope} desde un mensaje (inverso de {@link #toMessage}):
     * los campos de correlacion salen de headers; el payload y los headers de negocio se preservan.
     */
    public static AsyncTaskEnvelope decode(OutboundMessage message) {
        var headers = message.headers();
        var business = new LinkedHashMap<String, String>(headers);
        CODEC_KEYS.forEach(business::remove);
        return new AsyncTaskEnvelope(
                emptyToNull(headers.get(H_TRACE_ID)),
                parseLong(headers.get(H_PROCESS_EXECUTION_ID)),
                parseLong(headers.get(H_TASK_DEFINITION_ID)),
                emptyToNull(headers.get(H_TASK_TYPE)),
                emptyToNull(headers.get(H_TRANSPORT)),
                message.key(),
                parseInt(headers.get(H_ATTEMPT)),
                message.payload(),
                business);
    }

    public static String topicFor(String taskType) {
        var suffix = (taskType == null || taskType.isBlank())
                ? "unknown"
                : taskType.trim().toLowerCase(Locale.ROOT);
        return TOPIC_PREFIX + suffix;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String emptyToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }

    private static long parseLong(String value) {
        try {
            return value == null || value.isBlank() ? 0L : Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private static int parseInt(String value) {
        try {
            return value == null || value.isBlank() ? 0 : Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
