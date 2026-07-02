package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.PublishResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import jakarta.enterprise.context.ApplicationScoped;

/**
 * Publica un work-item de tarea async al broker (ADR-015). El broker se resuelve
 * por transporte fuera (via {@code MessageBrokerRegistry}); aqui se mapea el
 * envelope al wire-format y se publica.
 *
 * <p>Recibir el {@link MessageBrokerProvider} (interfaz) en lugar de resolverlo
 * dentro mantiene la pieza desacoplada y trivialmente testeable.</p>
 */
@ApplicationScoped
public class TaskDispatchPublisher {

    public PublishResult publish(MessageBrokerProvider broker, AsyncTaskEnvelope envelope) {
        return broker.publisher().publish(AsyncTaskMessageCodec.toMessage(envelope));
    }
}
