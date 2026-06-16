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

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Implementacion Kafka del SPI de mensajeria (primer broker enchufado). Publica
 * via SmallRye Reactive Messaging sobre el canal {@code audit-out} y espera el
 * ack del broker antes de confirmar -> el relay solo marca SENT con entrega
 * confirmada (at-least-once, cero perdida).
 *
 * <p><b>Pipelining</b>: {@code publishBatch} dispara los envios de una ventana en
 * vuelo y luego espera todos los acks, en vez de un await por mensaje. El producer
 * Kafka agrupa los records -> una latencia de ack por ventana, no por mensaje
 * (de ~decenas/s a miles/s, clave para drenar el outbox a escala 1M).</p>
 *
 * <p>Agregar otro broker (JMS/RabbitMQ/Redis) = otra impl de
 * {@link MessageBrokerProvider} con su {@code type()}, sin tocar al productor.</p>
 */
@ApplicationScoped
public class KafkaMessageBrokerProvider implements MessageBrokerProvider {

    public static final String TYPE = "KAFKA";
    /** Mensajes en vuelo por ventana: acota el buffer del emitter sin perder pipelining. */
    private static final int PIPELINE_WINDOW = 256;

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
        return new MessagePublisher() {
            @Override
            public PublishResult publish(OutboundMessage message) {
                return KafkaMessageBrokerProvider.this.publish(message);
            }

            @Override
            public List<PublishResult> publishBatch(List<OutboundMessage> messages) {
                return KafkaMessageBrokerProvider.this.publishBatch(messages);
            }
        };
    }

    private PublishResult publish(OutboundMessage outbound) {
        try {
            emitter.sendMessageAndAwait(message(outbound));
            return PublishResult.ok(null);
        } catch (RuntimeException error) {
            return PublishResult.failed(error.getMessage());
        }
    }

    private List<PublishResult> publishBatch(List<OutboundMessage> messages) {
        var results = new ArrayList<PublishResult>(messages.size());
        for (int from = 0; from < messages.size(); from += PIPELINE_WINDOW) {
            var window = messages.subList(from, Math.min(messages.size(), from + PIPELINE_WINDOW));
            // 1) Dispara todos los envios de la ventana (en vuelo, sin await por mensaje).
            var inflight = new ArrayList<CompletableFuture<Void>>(window.size());
            for (var outbound : window) {
                inflight.add(emitter.sendMessage(message(outbound)).subscribeAsCompletionStage().toCompletableFuture());
            }
            // 2) Espera los acks (Kafka agrupa los records -> una latencia por ventana).
            for (var future : inflight) {
                try {
                    future.join();
                    results.add(PublishResult.ok(null));
                } catch (RuntimeException error) {
                    results.add(PublishResult.failed(rootMessage(error)));
                }
            }
        }
        return results;
    }

    private Message<String> message(OutboundMessage outbound) {
        var metadata = OutgoingKafkaRecordMetadata.<String>builder()
                .withTopic(outbound.topic())
                .withKey(outbound.key())
                .build();
        return Message.of(outbound.payload()).addMetadata(metadata);
    }

    private String rootMessage(Throwable error) {
        var cause = error;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause.getMessage() == null ? cause.getClass().getSimpleName() : cause.getMessage();
    }
}
