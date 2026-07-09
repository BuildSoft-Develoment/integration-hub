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
     * G-A (búsqueda inversa enriquecida): "archivo + línea física → registro(s)". Devuelve <b>lista</b> de registros
     * (uno por ejecución: reprocesos del mismo archivo visibles, no solo el último), cada uno con su resumen de
     * cuarentena si falló validación (regla + motivo + :20:/:21:) — así, desde una línea que un banco/auditor
     * referencia, soporte ve el registro Y por qué se cuarentenó (un cuarentenado no tiene fragmento). Usa el índice
     * V90 {@code (source_file_hash, physical_line)}. Lista vacía si la línea no tiene registro.
     */
    @GET
    @Path("/by-physical-line")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<Mt101StagingRecordRepository.PhysicalLineLineage> byPhysicalLine(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("sourceFileHash") String sourceFileHash,
            @QueryParam("physicalLine") Long physicalLine,
            @QueryParam("processExecutionId") Long processExecutionId) {
        if (physicalLine == null) {
            throw new BadRequestException("physicalLine is required");
        }
        try {
            return service.findLineageByPhysicalLine(connectionRef, sourceFileHash, physicalLine, processExecutionId);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * #4 (búsqueda inversa Excel): "archivo + hoja + fila → registro(s)". Espejo de {@code by-physical-line} para Excel:
     * devuelve lista (reprocesos visibles) enriquecida con cuarentena. Usa el índice V93 {@code (source_file_hash,
     * sheet_name, sheet_row)}. Lista vacía si no hay registro en esa hoja+fila.
     */
    @GET
    @Path("/by-sheet-row")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<Mt101StagingRecordRepository.PhysicalLineLineage> bySheetRow(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("sourceFileHash") String sourceFileHash,
            @QueryParam("sheetName") String sheetName,
            @QueryParam("sheetRow") Long sheetRow,
            @QueryParam("processExecutionId") Long processExecutionId) {
        if (sheetName == null || sheetName.isBlank()) {
            throw new BadRequestException("sheetName is required");
        }
        if (sheetRow == null) {
            throw new BadRequestException("sheetRow is required");
        }
        try {
            return service.findLineageBySheetRow(connectionRef, sourceFileHash, sheetName, sheetRow, processExecutionId);
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
     * Consola de PAY Conflicts (inbox transversal): lista los conflictos de pago ABIERTOS de <b>todos</b> los
     * sets/ejecuciones (más recientes primero), cada uno con su {@code fragmentSetId} y {@code processExecutionId} para
     * abrir la vista por-set (quarantine) y el lineage. La landing operativa que faltaba: no exige conocer el set de
     * antemano. Mismo gating que {@code /pay-conflicts}.
     */
    @GET
    @Path("/pay-conflicts/open")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public Mt101FragmentLookupService.OpenPayConflictsPage openPayConflicts(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("limit") Integer limit,
            @QueryParam("cursor") String cursor) {
        try {
            return service.openPayConflicts(connectionRef, limit, cursor);
        } catch (IllegalArgumentException error) {
            // Cursor malformado → 400 claro (no 500).
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * A1 (evidencia inline de la consola): confirmación(es) del banco para un {@code :20:} (gatewayReference + último
     * STATUS confirmado), la evidencia de por qué el fragmento quedó en conflicto. Mismo gating que la consola.
     */
    @GET
    @Path("/pay-conflicts/confirmations")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<Mt101FragmentRepository.OpenPayConflictConfirmation> payConflictConfirmations(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("sendersReference") String sendersReference) {
        try {
            return service.payConflictConfirmations(connectionRef, sendersReference);
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
