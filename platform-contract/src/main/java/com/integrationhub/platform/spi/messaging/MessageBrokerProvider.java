package com.integrationhub.platform.spi.messaging;

/**
 * Punto de extension (SPI) para enchufar distintos brokers de mensajeria sin
 * tocar a los productores. Cada implementacion se registra como bean y se
 * resuelve por {@link #type()} (mismo patron que SourceProvider/TaskProvider).
 *
 * <p>El productor pide un {@link MessagePublisher} al broker resuelto; el lado
 * consumidor se maneja en el deployable {@code audit-consumer}.</p>
 *
 * <p>Abierto a Kafka (primera impl), JMS, RabbitMQ, Redis, etc. La arquitectura
 * puede conectarse/enchufarse a diferentes MQ cambiando configuracion, no codigo.</p>
 */
public interface MessageBrokerProvider {

    /** Identificador del broker: {@code "KAFKA"}, {@code "JMS"}, {@code "RABBITMQ"}, {@code "REDIS"}... */
    String type();

    /** Publisher para este broker. */
    MessagePublisher publisher();
}
