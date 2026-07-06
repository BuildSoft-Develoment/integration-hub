package com.integrationhub.platform.api.resource.messaging;

import com.integrationhub.platform.service.messaging.AsyncAvailabilityService;
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
 * Endpoints de mensajería para la UI de tareas asíncronas (ADR-015), de solo lectura:
 * <ul>
 *   <li>{@code GET /api/messaging/transports} — brokers registrados, para el selector de transporte.</li>
 *   <li>{@code GET /api/messaging/async-status} — estado COMPUESTO de disponibilidad async (execution + relay +
 *       consumer + broker), para que la UI avise cuando {@code async:true} no se ejecutaría end-to-end.</li>
 * </ul>
 */
@Path("/api/messaging")
@Produces(MediaType.APPLICATION_JSON)
public class MessagingTransportsResource {

    private final MessageBrokerRegistry brokers;
    private final AsyncAvailabilityService asyncAvailability;

    @Inject
    public MessagingTransportsResource(MessageBrokerRegistry brokers,
                                       AsyncAvailabilityService asyncAvailability) {
        this.brokers = brokers;
        this.asyncAvailability = asyncAvailability;
    }

    @GET
    @Path("/transports")
    @RolesAllowed({INTEGRATION_ADMIN, PLATFORM_ADMIN, OPERATOR})
    public List<String> transports() {
        return brokers.availableTypes();
    }

    /**
     * v59-fix: estado compuesto (DISABLED/DEGRADED/READY) + los flags que lo componen. El borde HTTP solo delega en
     * {@link AsyncAvailabilityService}. Backward-compatible: conserva {@code executionEnabled}.
     */
    @GET
    @Path("/async-status")
    @RolesAllowed({INTEGRATION_ADMIN, PLATFORM_ADMIN, OPERATOR})
    public AsyncAvailabilityService.AsyncAvailability asyncStatus() {
        return asyncAvailability.availability();
    }
}
