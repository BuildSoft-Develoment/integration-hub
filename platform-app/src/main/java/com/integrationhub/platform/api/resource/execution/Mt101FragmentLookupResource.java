package com.integrationhub.platform.api.resource.execution;

import com.integrationhub.platform.api.response.execution.Mt101FragmentLinkResponse;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingRecordRepository;
import com.integrationhub.platform.service.payments.swift.Mt101FragmentLookupService;
import com.integrationhub.platform.service.payments.swift.Mt101RowTimelineService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/query/mt101-fragments")
@Produces(MediaType.APPLICATION_JSON)
public class Mt101FragmentLookupResource {

    private final Mt101FragmentLookupService service;
    private final Mt101RowTimelineService rowTimelineService;

    public Mt101FragmentLookupResource(Mt101FragmentLookupService service,
                                       Mt101RowTimelineService rowTimelineService) {
        this.service = service;
        this.rowTimelineService = rowTimelineService;
    }

    @GET
    @Path("/source-row")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<Mt101FragmentLinkResponse> bySourceRow(@QueryParam("connectionRef") String connectionRef,
                                                       @QueryParam("recordNumber") Long recordNumber,
                                                       @QueryParam("sourceFileHash") String sourceFileHash,
                                                       @QueryParam("sourceTable") String sourceTable,
                                                       @QueryParam("processExecutionId") Long processExecutionId,
                                                       @QueryParam("fragmentSetId") String fragmentSetId,
                                                       @QueryParam("limit") @DefaultValue("20") int limit) {
        try {
            return service.findBySourceRow(connectionRef, recordNumber, sourceFileHash, sourceTable,
                            processExecutionId, fragmentSetId, limit)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /** Resumen del lote: total de fragmentos + conteo por estado (para el panel de cuarentena). */
    @GET
    @Path("/summary")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public Map<String, Object> summary(@QueryParam("connectionRef") String connectionRef,
                                       @QueryParam("fragmentSetId") String fragmentSetId) {
        try {
            var counts = service.statusCounts(connectionRef, fragmentSetId);
            var byStatus = new java.util.LinkedHashMap<String, Long>();
            long total = 0;
            for (var entry : counts) {
                byStatus.put(entry.status(), entry.count());
                total += entry.count();
            }
            // Item 3: el conteo de conflictos de pago viaja en el resumen para una alerta operativa de un vistazo.
            var conflicts = service.payConflictCount(connectionRef, fragmentSetId);
            return Map.of("fragmentSetId", fragmentSetId == null ? "" : fragmentSetId,
                    "total", total, "byStatus", byStatus, "conflicts", conflicts);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * item 2 (búsqueda inversa): "archivo + línea física → registro". Resuelve una línea física del archivo a su
     * staging_id + índice lógico (para que soporte ubique el registro/fragmento desde una línea que un banco/auditor
     * referencia). Usa el índice V90 {@code (source_file_hash, physical_line)}. 404 (null) si la línea no tiene
     * registro o el reader no aportó línea física.
     */
    @GET
    @Path("/by-physical-line")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public Mt101StagingRecordRepository.PhysicalLineMatch byPhysicalLine(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("sourceFileHash") String sourceFileHash,
            @QueryParam("physicalLine") Long physicalLine,
            @QueryParam("processExecutionId") Long processExecutionId) {
        if (physicalLine == null) {
            throw new BadRequestException("physicalLine is required");
        }
        try {
            return service.findByPhysicalLine(connectionRef, sourceFileHash, physicalLine, processExecutionId);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * Item 3 (visibilidad): fragmentos en conflicto de pago del set (contradicción terminal worker↔STATUS), con su
     * motivo y estado real. La UI los lista para conciliar; complementa las tramas append-only {@code PAY_CONFLICT}
     * del timeline.
     */
    @GET
    @Path("/pay-conflicts")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<Mt101FragmentRepository.PayConflictRow> payConflicts(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("fragmentSetId") String fragmentSetId) {
        try {
            return service.payConflicts(connectionRef, fragmentSetId);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * Línea de tiempo E2E <b>operacional</b> de una fila (instantánea, desde staging /
     * fragmento / cuarentena), independiente del store frío asíncrono.
     */
    @GET
    @Path("/row-timeline")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<Mt101RowTimelineService.Milestone> rowTimeline(@QueryParam("connectionRef") String connectionRef,
                                                               @QueryParam("fragmentSetId") String fragmentSetId,
                                                               @QueryParam("sourceFileHash") String sourceFileHash,
                                                               @QueryParam("recordNumber") Long recordNumber,
                                                               @QueryParam("stagingId") Long stagingId) {
        if (recordNumber == null) {
            throw new BadRequestException("recordNumber is required");
        }
        if (stagingId == null) {
            throw new BadRequestException("stagingId is required");
        }
        try {
            return rowTimelineService.rowTimeline(connectionRef, fragmentSetId, sourceFileHash, recordNumber, stagingId);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    private Mt101FragmentLinkResponse toResponse(Mt101FragmentRepository.FragmentLookupRow row) {
        return new Mt101FragmentLinkResponse(
                row.fragmentSetId(),
                row.processExecutionId(),
                row.taskDefinitionId(),
                row.sourceTable(),
                row.stagingIdFrom(),
                row.stagingIdTo(),
                row.sourceRecordFrom(),
                row.sourceRecordTo(),
                row.sourceFileHash(),
                row.fragmentIndex(),
                row.fragmentTotal(),
                row.sendersReference(),
                row.status(),
                row.errorMessage(),
                row.createdAt(),
                row.updatedAt());
    }
}
