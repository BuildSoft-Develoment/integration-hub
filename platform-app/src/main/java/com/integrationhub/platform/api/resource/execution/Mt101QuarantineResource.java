package com.integrationhub.platform.api.resource.execution;

import com.integrationhub.platform.api.response.execution.Mt101FailedRecordResponse;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.service.payments.swift.Mt101LoteService;
import com.integrationhub.platform.service.payments.swift.Mt101QuarantineService;
import com.integrationhub.platform.service.payments.swift.Mt101RebuildService;
import com.integrationhub.platform.service.payments.swift.Mt101StagingCorrectionService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;

/**
 * Cuarentena por fila de MT101: construye la cola de filas fallidas (con su fila
 * exacta del archivo) desde los issues de validacion, y la lista para que el
 * operador corrija y reprocese solo esas filas.
 */
@Path("/api/query/mt101-quarantine")
@Produces(MediaType.APPLICATION_JSON)
public class Mt101QuarantineResource {

    private final Mt101QuarantineService service;
    private final Mt101RebuildService rebuildService;
    private final Mt101LoteService loteService;
    private final Mt101StagingCorrectionService correctionService;

    public Mt101QuarantineResource(Mt101QuarantineService service,
                                   Mt101RebuildService rebuildService,
                                   Mt101LoteService loteService,
                                   Mt101StagingCorrectionService correctionService) {
        this.service = service;
        this.rebuildService = rebuildService;
        this.loteService = loteService;
        this.correctionService = correctionService;
    }

    /**
     * Corrige el payload de una fila fallida en staging (paso previo al rebuild),
     * sin tocar la BD a mano. Body = payload JSON corregido. Mutación.
     */
    @PATCH
    @Path("/staging-row")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101StagingCorrectionService.CorrectionResult correctRow(@QueryParam("connectionRef") String connectionRef,
                                                                     @QueryParam("fragmentSetId") String fragmentSetId,
                                                                     @QueryParam("recordNumber") Long recordNumber,
                                                                     String payloadJson) {
        if (recordNumber == null) {
            throw new BadRequestException("recordNumber is required");
        }
        try {
            return correctionService.correctRow(connectionRef, fragmentSetId, recordNumber, payloadJson);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * Cabecera del lote (archivo + hash + ejecución + conteos) por fragmentSetId o
     * processExecutionId — entrada de la vista unificada desde la ejecución.
     */
    @GET
    @Path("/lote")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public Mt101LoteService.LoteHeader lote(@QueryParam("connectionRef") String connectionRef,
                                            @QueryParam("fragmentSetId") String fragmentSetId,
                                            @QueryParam("processExecutionId") Long processExecutionId) {
        try {
            return loteService.header(connectionRef, fragmentSetId, processExecutionId);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /** Encola las filas fallidas de un set resolviendo cada :21: a su fila exacta. Mutación. */
    @POST
    @Path("/build")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Map<String, Object> build(@QueryParam("connectionRef") String connectionRef,
                                     @QueryParam("fragmentSetId") String fragmentSetId,
                                     @QueryParam("issueTable") String issueTable) {
        try {
            var quarantined = service.quarantineFromIssues(connectionRef, fragmentSetId, issueTable);
            return Map.of("fragmentSetId", fragmentSetId == null ? "" : fragmentSetId, "quarantined", quarantined);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /** Lista las filas en cuarentena de un set (la fila exacta que fallo, regla, :20:/:21:). */
    @GET
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public List<Mt101FailedRecordResponse> list(@QueryParam("connectionRef") String connectionRef,
                                                @QueryParam("fragmentSetId") String fragmentSetId,
                                                @QueryParam("status") String status,
                                                @QueryParam("limit") @DefaultValue("500") int limit) {
        try {
            return service.list(connectionRef, fragmentSetId, status, limit).stream()
                    .map(this::toResponse)
                    .toList();
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * Cierra el ciclo: re-construye SOLO las filas en cuarentena (corregidas en staging)
     * en {@code correctiveSetId} y supersede los fragmentos originales. Mutación.
     */
    @POST
    @Path("/rebuild")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101RebuildService.RebuildResult rebuild(@QueryParam("connectionRef") String connectionRef,
                                                     @QueryParam("fragmentSetId") String fragmentSetId,
                                                     @QueryParam("correctiveSetId") String correctiveSetId) {
        try {
            return rebuildService.rebuildFromQuarantine(connectionRef, fragmentSetId, correctiveSetId);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    private Mt101FailedRecordResponse toResponse(Mt101FailedRecordRepository.FailedRecord row) {
        return new Mt101FailedRecordResponse(
                row.id(),
                row.fragmentSetId(),
                row.sendersReference(),
                row.transactionReference(),
                row.sourceFileHash(),
                row.sourceRecordNumber(),
                row.ruleCode(),
                row.ruleSet(),
                row.severity(),
                row.message(),
                row.status(),
                row.createdAt(),
                row.resolvedAt());
    }
}
