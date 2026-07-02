package com.integrationhub.platform.api.resource.messaging;

import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Lista los transportes de mensajería disponibles (brokers registrados: Kafka/JMS/RabbitMQ/Redis).
 * Sirve para que la UI pueble el selector de transporte de una tarea asíncrona sin hardcodear la
 * lista. Additivo y de solo lectura.
 */
@Path("/api/messaging/transports")
@Produces(MediaType.APPLICATION_JSON)
public class MessagingTransportsResource {

    private final MessageBrokerRegistry brokers;

    @Inject
    public MessagingTransportsResource(MessageBrokerRegistry brokers) {
        this.brokers = brokers;
    }

    @GET
    @RolesAllowed({INTEGRATION_ADMIN, PLATFORM_ADMIN, OPERATOR})
    public List<String> transports() {
        return brokers.availableTypes();
    }
}
