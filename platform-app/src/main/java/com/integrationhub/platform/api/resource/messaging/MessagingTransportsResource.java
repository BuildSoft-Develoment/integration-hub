package com.integrationhub.platform.api.resource.messaging;

import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;

import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Endpoints de mensajería para la UI de tareas asíncronas (ADR-015), de solo lectura:
 * <ul>
 *   <li>{@code GET /api/messaging/transports} — brokers registrados, para el selector de transporte.</li>
 *   <li>{@code GET /api/messaging/async-status} — si el despacho async está activo en este entorno,
 *       para que la UI avise cuando {@code async:true} no tomará efecto (correría síncrono).</li>
 * </ul>
 */
@Path("/api/messaging")
@Produces(MediaType.APPLICATION_JSON)
public class MessagingTransportsResource {

    private final MessageBrokerRegistry brokers;
    private final boolean asyncExecutionEnabled;

    @Inject
    public MessagingTransportsResource(
            MessageBrokerRegistry brokers,
            @ConfigProperty(name = "tasks.async.execution.enabled", defaultValue = "false") boolean asyncExecutionEnabled) {
        this.brokers = brokers;
        this.asyncExecutionEnabled = asyncExecutionEnabled;
    }

    @GET
    @Path("/transports")
    @RolesAllowed({INTEGRATION_ADMIN, PLATFORM_ADMIN, OPERATOR})
    public List<String> transports() {
        return brokers.availableTypes();
    }

    @GET
    @Path("/async-status")
    @RolesAllowed({INTEGRATION_ADMIN, PLATFORM_ADMIN, OPERATOR})
    public AsyncStatus asyncStatus() {
        return new AsyncStatus(asyncExecutionEnabled);
    }

    /** Estado del feature de despacho async en el entorno. */
    public record AsyncStatus(boolean executionEnabled) {
    }
}
