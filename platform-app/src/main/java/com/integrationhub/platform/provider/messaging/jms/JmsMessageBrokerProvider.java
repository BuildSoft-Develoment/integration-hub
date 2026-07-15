package com.integrationhub.platform.provider.messaging.jms;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.spi.messaging.PublishResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.Connection;
import jakarta.jms.DeliveryMode;
import jakarta.jms.Session;
import jakarta.jms.TextMessage;
import org.apache.activemq.artemis.jms.client.ActiveMQConnectionFactory;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;

/**
 * Conector JMS (Artemis) del SPI de mensajeria. Usa {@link ActiveMQConnectionFactory}
 * directamente, provisto por la extension {@code quarkus-artemis-jms} (native-ready);
 * la conexion es lazy: solo conecta si {@code audit.broker.type=JMS}. Envia a una cola
 * homonima del {@code topic} como TextMessage persistente (send sincrono = ack del broker).
 */
@ApplicationScoped
public class JmsMessageBrokerProvider implements MessageBrokerProvider {

    public static final String TYPE = "JMS";

    private final String url;
    private final String username;
    private final String password;

    private volatile Connection connection;

    // Optional<String>: SmallRye Config trata un String vacio como "ausente" y rompe el
    // boot si se usa defaultValue="". Con Optional, credenciales ausentes = anonimo.
    @Inject
    public JmsMessageBrokerProvider(
            @ConfigProperty(name = "jms.url", defaultValue = "tcp://localhost:61616") String url,
            @ConfigProperty(name = "jms.username") Optional<String> username,
            @ConfigProperty(name = "jms.password") Optional<String> password) {
        this.url = url;
        this.username = username.filter(value -> !value.isBlank()).orElse(null);
        this.password = password.orElse(null);
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
        try (Session session = connection().createSession(false, Session.AUTO_ACKNOWLEDGE)) {
            var queue = session.createQueue(message.topic());
            try (var producer = session.createProducer(queue)) {
                producer.setDeliveryMode(DeliveryMode.PERSISTENT);
                TextMessage jmsMessage = session.createTextMessage(message.payload());
                if (message.key() != null) {
                    jmsMessage.setStringProperty("traceKey", message.key());
                }
                producer.send(jmsMessage);
                return PublishResult.ok(jmsMessage.getJMSMessageID());
            }
        } catch (Exception error) {
            return PublishResult.failed(error.getMessage());
        }
    }

    private Connection connection() throws Exception {
        var local = connection;
        if (local != null) {
            return local;
        }
        synchronized (this) {
            if (connection == null) {
                var factory = username == null || username.isBlank()
                        ? new ActiveMQConnectionFactory(url)
                        : new ActiveMQConnectionFactory(url, username, password);
                connection = factory.createConnection();
                connection.start();
            }
            return connection;
        }
    }
}
