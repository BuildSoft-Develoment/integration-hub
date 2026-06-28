package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;

/**
 * Resuelve un broker por transporte (envuelve {@code MessageBrokerRegistry::resolve}).
 * Seam funcional para que el relay sea testeable sin CDI: en produccion se cablea
 * con el registry; en tests con un lambda.
 */
@FunctionalInterface
public interface BrokerResolver {

    MessageBrokerProvider resolve(String transport);
}
