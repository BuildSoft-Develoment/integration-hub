package com.integrationhub.platform.provider.messaging.kafka;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import com.integrationhub.platform.spi.messaging.PublishResult;
import io.smallrye.reactive.messaging.MutinyEmitter;
import io.smallrye.reactive.messaging.kafka.api.OutgoingKafkaRecordMetadata;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Message;

/**
 * Implementacion Kafka del SPI de mensajeria (primer broker enchufado). Publica
 * via SmallRye Reactive Messaging sobre el canal {@code audit-out} y espera el
 * ack del broker antes de confirmar -> el relay solo marca SENT con entrega
 * confirmada (at-least-once, cero perdida).
 *
 * <p>Agregar otro broker (JMS/RabbitMQ/Redis) = otra impl de
 * {@link MessageBrokerProvider} con su {@code type()}, sin tocar al productor.</p>
 */
@ApplicationScoped
public class KafkaMessageBrokerProvider implements MessageBrokerProvider {

    public static final String TYPE = "KAFKA";

    private final MutinyEmitter<String> emitter;

    @Inject
    public KafkaMessageBrokerProvider(@Channel("audit-out") MutinyEmitter<String> emitter) {
        this.emitter = emitter;
    }

    @Override
    public String type() {
        return TYPE;
    }

    @Override
    public MessagePublisher publisher() {
        return this::publish;
    }

    private PublishResult publish(OutboundMessage outbound) {
        try {
            var metadata = OutgoingKafkaRecordMetadata.<String>builder()
                    .withTopic(outbound.topic())
                    .withKey(outbound.key())
                    .build();
            emitter.sendMessageAndAwait(Message.of(outbound.payload()).addMetadata(metadata));
            return PublishResult.ok(null);
        } catch (RuntimeException error) {
            return PublishResult.failed(error.getMessage());
        }
    }
}
