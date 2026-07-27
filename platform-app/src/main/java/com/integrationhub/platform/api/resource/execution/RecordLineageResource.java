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

import static com.integrationhub.platform.spi.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

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
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<RecordLineageEntryResponse> lineage(@QueryParam("recordId") String recordId,
                                                    @QueryParam("traceId") String traceId,
                                                    @QueryParam("key") String key,
                                                    @QueryParam("value") String value,
                                                    @QueryParam("sourceFileHash") String sourceFileHash,
                                                    @QueryParam("recordNumber") Long recordNumber,
                                                    @QueryParam("processExecutionId") Long processExecutionId,
                                                    @QueryParam("limit") @DefaultValue("1000") int limit) {
        var capped = Math.min(Math.max(limit, 1), MAX_ENTRIES);
        List<AuditRecordEvent> events;
        if (recordId != null && !recordId.isBlank()) {
            events = repository.timelineByRecordId(recordId, capped);
        } else if (traceId != null && !traceId.isBlank()) {
            events = repository.timelineByTraceId(traceId, capped);
        } else if (sourceFileHash != null && !sourceFileHash.isBlank() && recordNumber != null) {
            // B: processExecutionId (opcional) desambigua reprocesos del mismo archivo+fila (varias ejecuciones).
            events = repository.timelineBySourceRow(sourceFileHash, recordNumber, processExecutionId, capped);
        } else if (key != null && !key.isBlank() && value != null && !value.isBlank()) {
            try {
                // processExecutionId (opcional) acota la clave a una ejecucion (desambigua reprocesos del mismo :20:).
                events = repository.timelineByOperationalKey(key, value, processExecutionId, capped);
            } catch (IllegalArgumentException error) {
                throw new BadRequestException(error.getMessage(), error);
            }
        } else {
            throw new BadRequestException("record-lineage requires recordId, traceId, sourceFileHash+recordNumber or key+value");
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
                event.standard,
                event.messageType,
                event.sourceFileName,
                event.sourceFileHash,
                event.recordNumber,
                event.businessKey,
                event.businessKeyHash,
                event.paymentReference,
                event.transactionReference,
                event.uetr,
                event.archiveId,
                event.gatewayReference,
                event.eventTs);
    }
}
