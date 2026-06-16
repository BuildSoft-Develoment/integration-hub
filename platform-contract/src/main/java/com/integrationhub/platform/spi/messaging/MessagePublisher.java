package com.integrationhub.platform.spi.messaging;

import java.util.ArrayList;
import java.util.List;

/**
 * Publica mensajes en un broker concreto. Una implementacion por tecnologia
 * (Kafka, JMS, RabbitMQ, Redis...). Stateless respecto al negocio.
 */
public interface MessagePublisher {

    PublishResult publish(OutboundMessage message);

    /**
     * Publica un lote y devuelve un resultado por mensaje (mismo orden). El default
     * es secuencial (compatibilidad); un broker que soporte pipelining (p.ej. Kafka,
     * que batchea los envios en vuelo) lo sobrescribe para no pagar una latencia de
     * ack por mensaje -> throughput de miles/s en vez de decenas/s a escala 1M.
     */
    default List<PublishResult> publishBatch(List<OutboundMessage> messages) {
        var results = new ArrayList<PublishResult>(messages.size());
        for (var message : messages) {
            try {
                results.add(publish(message));
            } catch (RuntimeException error) {
                results.add(PublishResult.failed(error.getMessage()));
            }
        }
        return results;
    }
}
