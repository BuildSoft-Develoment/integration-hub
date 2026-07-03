package com.integrationhub.platform.service.execution.async;

import io.smallrye.reactive.messaging.annotations.Blocking;
import io.smallrye.reactive.messaging.kafka.api.IncomingKafkaRecordMetadata;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.eclipse.microprofile.reactive.messaging.Message;
import org.jboss.logging.Logger;

import java.util.concurrent.CompletionStage;

/**
 * Adaptador de transporte del consumer de tareas asíncronas (ADR-015 Etapa 5): saca la trama del
 * canal {@code tasks-in} (Kafka, suscripción por patrón {@code tasks.*}) y delega en el núcleo puro
 * {@link AsyncTaskConsumer}, igual que {@code AuditEventConsumer} delega en {@code AuditEventHandler}.
 * Solo hace de puente broker↔caso-de-uso; toda la lógica (dedup, ejecución, completación) vive en el
 * handler, testeable sin broker.
 *
 * <p><b>Gated</b>: el canal está deshabilitado por defecto ({@code mp.messaging.incoming.tasks-in.enabled=false});
 * platform-app no abre un consumer de Kafka salvo que el feature async se active explícitamente. La
 * completación es lógica de motor in-process, por eso el consumer vive aquí (no en un worker aparte).</p>
 *
 * <p><b>Ack/nack</b>: el handler ACK-ea por diseño los desenlaces terminales (PROCESSED/DUPLICATE/
 * FAILED/DEAD/POISON); solo relanza en fallo transitorio de {@code execute}. Ahí se hace <b>nack</b>
 * para no confirmar el offset y no perder el work-item (la estrategia de fallo del conector decide la
 * reentrega/parada; sin pérdida silenciosa).</p>
 */
@ApplicationScoped
public class AsyncTaskBrokerConsumer {

    private static final Logger LOG = Logger.getLogger(AsyncTaskBrokerConsumer.class);

    private final AsyncTaskConsumer consumer;

    @Inject
    public AsyncTaskBrokerConsumer(AsyncTaskConsumer consumer) {
        this.consumer = consumer;
    }

    @Incoming("tasks-in")
    @Blocking("async-task-worker-pool")
    public CompletionStage<Void> consume(Message<String> message) {
        var topic = message.getMetadata(IncomingKafkaRecordMetadata.class)
                .map(IncomingKafkaRecordMetadata::getTopic)
                .orElse("tasks");
        try {
            consumer.consume(message.getPayload(), "KAFKA", topic);
            return message.ack();
        } catch (RuntimeException transientFailure) {
            LOG.warnf(transientFailure, "Async task consumer: fallo transitorio en %s → nack (reentrega)", topic);
            return message.nack(transientFailure);
        }
    }
}
