package com.integrationhub.platform.api.resource.execution;

import com.integrationhub.platform.api.response.execution.RecordLineageEntryResponse;
import com.integrationhub.platform.entity.AuditRecordEvent;
import com.integrationhub.platform.repository.AuditRecordEventRepository;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

/**
 * Visor de trazabilidad E2E a nivel de registro: devuelve la linea de tiempo de
 * un registro (:20:) o de toda una ejecucion (traceId) desde el store frio.
 */
@Path("/api/query/record-lineage")
@Produces(MediaType.APPLICATION_JSON)
public class RecordLineageResource {

    private static final int MAX_ENTRIES = 5000;

    private final AuditRecordEventRepository repository;

    public RecordLineageResource(AuditRecordEventRepository repository) {
        this.repository = repository;
    }

    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public List<RecordLineageEntryResponse> lineage(@QueryParam("recordId") String recordId,
                                                    @QueryParam("traceId") String traceId,
                                                    @QueryParam("limit") @DefaultValue("1000") int limit) {
        var capped = Math.min(Math.max(limit, 1), MAX_ENTRIES);
        List<AuditRecordEvent> events;
        if (recordId != null && !recordId.isBlank()) {
            events = repository.timelineByRecordId(recordId, capped);
        } else if (traceId != null && !traceId.isBlank()) {
            events = repository.timelineByTraceId(traceId, capped);
        } else {
            throw new BadRequestException("record-lineage requires recordId or traceId");
        }
        return events.stream().map(this::toResponse).toList();
    }

    private RecordLineageEntryResponse toResponse(AuditRecordEvent event) {
        return new RecordLineageEntryResponse(
                event.recordId,
                event.traceId,
                event.stage,
                event.status,
                event.processExecutionId,
                event.taskDefinitionId,
                event.message,
                event.payloadJson,
                event.eventTs);
    }
}
