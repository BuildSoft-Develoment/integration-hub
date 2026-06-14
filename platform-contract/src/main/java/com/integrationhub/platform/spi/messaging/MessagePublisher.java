package com.integrationhub.platform.spi.messaging;

/**
 * Publica mensajes en un broker concreto. Una implementacion por tecnologia
 * (Kafka, JMS, RabbitMQ, Redis...). Stateless respecto al negocio.
 */
public interface MessagePublisher {

    PublishResult publish(OutboundMessage message);
}
