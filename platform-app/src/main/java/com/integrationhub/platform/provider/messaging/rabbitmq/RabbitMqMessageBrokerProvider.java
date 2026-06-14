package com.integrationhub.platform.provider.messaging.rabbitmq;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.spi.messaging.PublishResult;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.nio.charset.StandardCharsets;

/**
 * Conector RabbitMQ del SPI de mensajeria. Cliente raw con conexion lazy: solo
 * conecta si {@code audit.broker.type=RABBITMQ} (el relay lo resuelve por type()).
 * Publica al exchange por defecto con routing key = {@code topic} (cola homonima).
 */
@ApplicationScoped
public class RabbitMqMessageBrokerProvider implements MessageBrokerProvider {

    public static final String TYPE = "RABBITMQ";

    private final String host;
    private final int port;
    private final String username;
    private final String password;

    private volatile Connection connection;

    @Inject
    public RabbitMqMessageBrokerProvider(
            @ConfigProperty(name = "rabbitmq.host", defaultValue = "localhost") String host,
            @ConfigProperty(name = "rabbitmq.port", defaultValue = "5672") int port,
            @ConfigProperty(name = "rabbitmq.username", defaultValue = "guest") String username,
            @ConfigProperty(name = "rabbitmq.password", defaultValue = "guest") String password) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
    }

    @Override
    public String type() {
        return TYPE;
    }

    @Override
    public MessagePublisher publisher() {
        return this::publish;
    }

    private PublishResult publish(OutboundMessage message) {
        try (Channel channel = connection().createChannel()) {
            channel.confirmSelect();
            channel.queueDeclare(message.topic(), true, false, false, null);
            var props = new AMQP.BasicProperties.Builder()
                    .messageId(message.key())
                    .deliveryMode(2) // persistente
                    .build();
            channel.basicPublish("", message.topic(), props,
                    message.payload().getBytes(StandardCharsets.UTF_8));
            channel.waitForConfirmsOrDie(5000);
            return PublishResult.ok(message.key());
        } catch (Exception error) {
            return PublishResult.failed(error.getMessage());
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
