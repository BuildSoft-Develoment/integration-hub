package com.integrationhub.platform.api.resource.execution;

import com.integrationhub.platform.api.response.execution.AuditSpoolEntryResponse;
import com.integrationhub.platform.api.response.execution.AuditSpoolSummaryResponse;
import com.integrationhub.platform.entity.AuditSpool;
import com.integrationhub.platform.service.execution.AuditSpoolOperationsService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

/** Operacion del spool/outbox de auditoria asincrona. */
@Path("/api/query/audit-spool")
@Produces(MediaType.APPLICATION_JSON)
public class AuditSpoolResource {

    private final AuditSpoolOperationsService service;

    public AuditSpoolResource(AuditSpoolOperationsService service) {
        this.service = service;
    }

    @GET
    @Path("/summary")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public AuditSpoolSummaryResponse summary() {
        var summary = service.summary();
        return new AuditSpoolSummaryResponse(
                summary.pending(),
                summary.inFlight(),
                summary.sent(),
                summary.dead(),
                summary.oldestPendingCreatedAt());
    }

    @GET
    @Path("/dead")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public List<AuditSpoolEntryResponse> dead(@QueryParam("limit") @DefaultValue("100") int limit) {
        return service.deadEvents(limit).stream().map(this::toResponse).toList();
    }

    @POST
    @Path("/{id}/retry")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public void retry(@PathParam("id") Long id) {
        service.retryDead(id);
    }

    @DELETE
    @Path("/sent")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public CleanupResponse cleanupSent(@QueryParam("retentionDays") @DefaultValue("7") int retentionDays,
                                       @QueryParam("limit") @DefaultValue("10000") int limit) {
        return new CleanupResponse(service.cleanupSent(retentionDays, limit));
    }

    @DELETE
    @Path("/dead-letters")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public CleanupResponse cleanupDeadLetters(@QueryParam("retentionDays") @DefaultValue("30") int retentionDays,
                                              @QueryParam("limit") @DefaultValue("10000") int limit) {
        return new CleanupResponse(service.cleanupDeadLetters(retentionDays, limit));
    }

    private AuditSpoolEntryResponse toResponse(AuditSpool row) {
        return new AuditSpoolEntryResponse(
                row.id,
                row.eventId,
                row.traceId,
                row.topic,
                row.partitionKey,
                row.spoolStatus,
                row.attempts,
                row.lastError,
                row.createdAt,
                row.sentAt,
                row.lockedBy,
                row.lockedAt,
                row.nextAttemptAt,
                row.deadAt,
                row.deadReason);
    }

    public record CleanupResponse(long deleted) {
    }
}
