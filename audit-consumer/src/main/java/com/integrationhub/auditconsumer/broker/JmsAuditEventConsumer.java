package com.integrationhub.auditconsumer.broker;

import com.integrationhub.auditconsumer.AuditEventHandler;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.Connection;
import jakarta.jms.Session;
import jakarta.jms.TextMessage;
import org.apache.activemq.artemis.jms.client.ActiveMQConnectionFactory;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;

/**
 * Consumer JMS/Artemis opcional del contrato de auditoria. Usa cola persistente
 * homonima al topic logico.
 */
@ApplicationScoped
public class JmsAuditEventConsumer {

    private final AuditEventHandler handler;
    private final String brokerType;
    private final String topic;
    private final int batchSize;
    private final String url;
    private final String username;
    private final String password;

    private volatile Connection connection;

    @Inject
    public JmsAuditEventConsumer(
            AuditEventHandler handler,
            @ConfigProperty(name = "audit.broker.type", defaultValue = "KAFKA") String brokerType,
            @ConfigProperty(name = "audit.topic", defaultValue = "audit-events") String topic,
            @ConfigProperty(name = "audit.consumer.batch-size", defaultValue = "200") int batchSize,
            @ConfigProperty(name = "jms.url", defaultValue = "tcp://localhost:61616") String url,
            // Optional: SmallRye rechaza convertir un String vacio (defaultValue="") y rompe el boot.
            @ConfigProperty(name = "jms.username") Optional<String> username,
            @ConfigProperty(name = "jms.password") Optional<String> password) {
        this.handler = handler;
        this.brokerType = brokerType;
        this.topic = topic;
        this.batchSize = batchSize;
        this.url = url;
        this.username = username.filter(value -> !value.isBlank()).orElse(null);
        this.password = password.orElse(null);
    }

    @Scheduled(every = "{audit.consumer.poll.every}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void poll() {
        if (!"JMS".equalsIgnoreCase(brokerType)) {
            return;
        }
        try (Session session = connection().createSession(false, Session.CLIENT_ACKNOWLEDGE)) {
            var queue = session.createQueue(topic);
            try (var consumer = session.createConsumer(queue)) {
                for (int i = 0; i < batchSize; i++) {
                    var message = consumer.receive(100);
                    if (message == null) {
                        return;
                    }
                    try {
                        if (!(message instanceof TextMessage textMessage)) {
                            throw new IllegalArgumentException("Unsupported JMS audit message type: "
                                    + message.getClass().getName());
                        }
                        handler.handle(textMessage.getText(), "JMS", topic);
                        message.acknowledge();
                    } catch (RuntimeException error) {
                        session.recover();
                        throw error;
                    }
                }
            }
        } catch (Exception error) {
            throw new IllegalStateException("JMS audit consumer failed", error);
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
