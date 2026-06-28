package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.LinkedHashMap;
import java.util.Locale;

/**
 * Wire-format de una tarea async (ADR-015): {@link AsyncTaskEnvelope} ->
 * {@link OutboundMessage}.
 *
 * <ul>
 *   <li>El <b>topic</b> deriva del {@code taskType} ({@code tasks.<tasktype>}).</li>
 *   <li>La <b>key</b> es la {@code idempotencyKey} (particion estable + base para el
 *       dedup at-least-once en el consumer).</li>
 *   <li>La metadata ({@code traceId}, {@code attempt}, {@code taskType}) viaja en
 *       <b>headers</b>; el audit trail ya indexa por {@code traceId}.</li>
 * </ul>
 *
 * <p>Logica pura para que el core y cualquier consumer/sidecar compartan el mismo
 * mapeo.</p>
 */
public final class AsyncTaskMessageCodec {

    static final String TOPIC_PREFIX = "tasks.";

    private AsyncTaskMessageCodec() {
    }

    public static OutboundMessage toMessage(AsyncTaskEnvelope envelope) {
        var headers = new LinkedHashMap<String, String>(envelope.headers());
        headers.put("traceId", nullToEmpty(envelope.traceId()));
        headers.put("taskType", nullToEmpty(envelope.taskType()));
        headers.put("attempt", String.valueOf(envelope.attempt()));
        headers.put("idempotencyKey", nullToEmpty(envelope.idempotencyKey()));
        return new OutboundMessage(topicFor(envelope.taskType()), envelope.idempotencyKey(), envelope.payload(), headers);
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
}
