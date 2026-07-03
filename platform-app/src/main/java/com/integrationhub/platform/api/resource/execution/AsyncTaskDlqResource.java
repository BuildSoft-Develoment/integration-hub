package com.integrationhub.platform.api.resource.execution;

import com.integrationhub.platform.service.execution.async.AsyncTaskDlqService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.Map;

import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * DLQ y recuperación del pipeline async (ADR-015, grupo 3). Visibilidad de los estados muertos y
 * redrive seguro del outbox y de suspensiones colgadas (red de recuperación 3a).
 */
@Path("/api/query/tasks-dlq")
@Produces(MediaType.APPLICATION_JSON)
public class AsyncTaskDlqResource {

    private final AsyncTaskDlqService service;

    public AsyncTaskDlqResource(AsyncTaskDlqService service) {
        this.service = service;
    }

    @GET
    @Path("/summary")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR})
    public AsyncTaskDlqService.DlqSummary summary() {
        return service.summary();
    }

    /** Filas muertas del consumer (DEAD/POISON), más recientes primero, para la consola de DLQ. */
    @GET
    @Path("/dead")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR})
    public java.util.List<AsyncTaskDlqService.DeadTask> dead(@QueryParam("limit") @DefaultValue("100") int limit) {
        return service.listDead(limit);
    }

    /** Scatters en streaming estancados (sin progreso por &gt; {@code minutes}), candidatos a re-inyección. */
    @GET
    @Path("/stalled")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR})
    public java.util.List<AsyncTaskDlqService.StalledScatter> stalled(
            @QueryParam("minutes") @DefaultValue("5") long minutes,
            @QueryParam("limit") @DefaultValue("100") int limit) {
        return service.listStalled(java.time.Duration.ofMinutes(Math.max(0, minutes)), limit);
    }

    /** Reanima filas DEAD del outbox a PENDING para que el relay reintente publicarlas. */
    @POST
    @Path("/outbox/redrive")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public Map<String, Object> redriveOutboxDead(@QueryParam("limit") @DefaultValue("1000") int limit) {
        return Map.of("redriven", service.redriveOutboxDead(limit));
    }

    /** Re-encola el work-item de una tarea async aún suspendida (recuperación de proceso atascado). */
    @POST
    @Path("/suspensions/{processExecutionId}/{taskDefinitionId}/requeue")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public Map<String, Object> requeueSuspension(@PathParam("processExecutionId") Long processExecutionId,
                                                 @PathParam("taskDefinitionId") Long taskDefinitionId) {
        return Map.of("requeued", service.requeueSuspension(processExecutionId, taskDefinitionId));
    }
}
