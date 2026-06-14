package com.integrationhub.auditconsumer.broker;

import com.integrationhub.auditconsumer.AuditEventHandler;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.nio.charset.StandardCharsets;

/**
 * Consumer RabbitMQ opcional del contrato de auditoria. Se activa solo cuando
 * {@code audit.broker.type=RABBITMQ}; Kafka sigue siendo el default.
 */
@ApplicationScoped
public class RabbitMqAuditEventConsumer {

    private final AuditEventHandler handler;
    private final String brokerType;
    private final String topic;
    private final int batchSize;
    private final String host;
    private final int port;
    private final String username;
    private final String password;

    private volatile Connection connection;

    @Inject
    public RabbitMqAuditEventConsumer(
            AuditEventHandler handler,
            @ConfigProperty(name = "audit.broker.type", defaultValue = "KAFKA") String brokerType,
            @ConfigProperty(name = "audit.topic", defaultValue = "audit-events") String topic,
            @ConfigProperty(name = "audit.consumer.batch-size", defaultValue = "200") int batchSize,
            @ConfigProperty(name = "rabbitmq.host", defaultValue = "localhost") String host,
            @ConfigProperty(name = "rabbitmq.port", defaultValue = "5672") int port,
            @ConfigProperty(name = "rabbitmq.username", defaultValue = "guest") String username,
            @ConfigProperty(name = "rabbitmq.password", defaultValue = "guest") String password) {
        this.handler = handler;
        this.brokerType = brokerType;
        this.topic = topic;
        this.batchSize = batchSize;
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
    }

    @Scheduled(every = "{audit.consumer.poll.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void poll() {
        if (!"RABBITMQ".equalsIgnoreCase(brokerType)) {
            return;
        }
        try (Channel channel = connection().createChannel()) {
            channel.queueDeclare(topic, true, false, false, null);
            for (int i = 0; i < batchSize; i++) {
                var delivery = channel.basicGet(topic, false);
                if (delivery == null) {
                    return;
                }
                try {
                    handler.handle(new String(delivery.getBody(), StandardCharsets.UTF_8), "RABBITMQ", topic);
                    channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
                } catch (RuntimeException error) {
                    channel.basicNack(delivery.getEnvelope().getDeliveryTag(), false, true);
                    throw error;
                }
            }
        } catch (Exception error) {
            throw new IllegalStateException("RabbitMQ audit consumer failed", error);
        }
    }

    private Connection connection() throws Exception {
        var local = connection;
        if (local != null && local.isOpen()) {
            return local;
        }
        synchronized (this) {
            if (connection == null || !connection.isOpen()) {
                var factory = new ConnectionFactory();
                factory.setHost(host);
                factory.setPort(port);
                factory.setUsername(username);
                factory.setPassword(password);
                connection = factory.newConnection();
            }
            return connection;
        }
    }
}
