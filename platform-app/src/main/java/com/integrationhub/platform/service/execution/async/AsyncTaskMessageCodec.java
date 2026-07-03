package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.Locale;
import java.util.Map;

/**
 * Wire-format de una tarea async (ADR-015): {@link AsyncTaskEnvelope} ↔ {@link OutboundMessage}.
 *
 * <p><b>Mismo patrón que la auditoría</b> ({@code AuditSpoolWriter}/{@code OutboxRelay}): el
 * <b>payload</b> es el {@link AsyncTaskEnvelope} serializado <b>entero</b> (JSON); el consumer lo
 * decodifica con un solo {@code readValue}. Así el core, los consumidores y los sidecars comparten
 * el mismo mapeo trivial y lossless, sin metadata dispersa en headers.</p>
 *
 * <ul>
 *   <li>El <b>topic</b> deriva del {@code taskType} ({@code tasks.<tasktype>}).</li>
 *   <li>La <b>key</b> es la {@code idempotencyKey} (partición estable + dedup at-least-once).</li>
 *   <li>Los <b>headers</b> quedan vacíos: toda la correlación viaja dentro del envelope.</li>
 * </ul>
 *
 * <p>El {@link ObjectMapper} se pasa como parámetro para que la pieza siga siendo lógica pura,
 * reutilizable por un sidecar sin CDI.</p>
 */
public final class AsyncTaskMessageCodec {

    static final String TOPIC_PREFIX = "tasks.";

    private AsyncTaskMessageCodec() {
    }

    public static OutboundMessage toMessage(AsyncTaskEnvelope envelope, ObjectMapper mapper) {
        return new OutboundMessage(
                topicFor(envelope.taskType()),
                envelope.idempotencyKey(),
                writeJson(envelope, mapper),
                Map.of());
    }

    /** Inverso de {@link #toMessage}: reconstruye el envelope entero desde el payload JSON. */
    public static AsyncTaskEnvelope decode(String payload, ObjectMapper mapper) {
        try {
            return mapper.readValue(payload, AsyncTaskEnvelope.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("AsyncTaskEnvelope inválido en el payload", ex);
        }
    }

    public static String topicFor(String taskType) {
        var suffix = (taskType == null || taskType.isBlank())
                ? "unknown"
                : taskType.trim().toLowerCase(Locale.ROOT);
        return TOPIC_PREFIX + suffix;
    }

    private static String writeJson(AsyncTaskEnvelope envelope, ObjectMapper mapper) {
        try {
            return mapper.writeValueAsString(envelope);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("No se pudo serializar el AsyncTaskEnvelope", ex);
        }
    }
}
