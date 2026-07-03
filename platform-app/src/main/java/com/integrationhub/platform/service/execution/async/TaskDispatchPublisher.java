package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.PublishResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Publica un work-item de tarea async al broker (ADR-015). El broker se resuelve
 * por transporte fuera (via {@code MessageBrokerRegistry}); aqui se serializa el
 * envelope entero como payload (mismo patron que la auditoria) y se publica.
 *
 * <p>Recibir el {@link MessageBrokerProvider} (interfaz) en lugar de resolverlo
 * dentro mantiene la pieza desacoplada y trivialmente testeable.</p>
 */
@ApplicationScoped
public class TaskDispatchPublisher {

    private final ObjectMapper objectMapper;

    @Inject
    public TaskDispatchPublisher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Constructor para tests sin CDI. */
    public TaskDispatchPublisher() {
        this(new ObjectMapper());
    }

    public PublishResult publish(MessageBrokerProvider broker, AsyncTaskEnvelope envelope) {
        return broker.publisher().publish(AsyncTaskMessageCodec.toMessage(envelope, objectMapper));
    }
}
