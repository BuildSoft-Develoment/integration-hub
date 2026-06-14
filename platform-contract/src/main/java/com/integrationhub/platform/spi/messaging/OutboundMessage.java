package com.integrationhub.platform.spi.messaging;

import java.util.Map;

/**
 * Mensaje a publicar en un broker, independiente de la tecnologia concreta.
 *
 * @param topic   destino logico (topic/queue/stream segun el broker)
 * @param key     clave de particion/orden (p.ej. {@code traceId}); puede ser null
 * @param payload cuerpo serializado (JSON)
 * @param headers metadatos opcionales (nunca null)
 */
public record OutboundMessage(String topic, String key, String payload, Map<String, String> headers) {

    public OutboundMessage {
        if (topic == null || topic.isBlank()) {
            throw new IllegalArgumentException("OutboundMessage topic cannot be blank");
        }
        headers = headers == null ? Map.of() : Map.copyOf(headers);
    }

    public static OutboundMessage of(String topic, String key, String payload) {
        return new OutboundMessage(topic, key, payload, Map.of());
    }
}
