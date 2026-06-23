package com.integrationhub.platform.api.resource.execution;

import com.integrationhub.platform.api.response.execution.Mt101FailedRecordResponse;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.service.payments.swift.Mt101CorrectiveLifecycleService;
import com.integrationhub.platform.service.payments.swift.Mt101LoteService;
import com.integrationhub.platform.service.payments.swift.Mt101QuarantineService;
import com.integrationhub.platform.service.payments.swift.Mt101RebuildService;
import com.integrationhub.platform.service.payments.swift.Mt101StagingCorrectionService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

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
    private final Mt101CorrectiveLifecycleService correctiveLifecycleService;

    public Mt101QuarantineResource(Mt101QuarantineService service,
                                   Mt101RebuildService rebuildService,
                                   Mt101LoteService loteService,
                                   Mt101StagingCorrectionService correctionService,
                                   Mt101CorrectiveLifecycleService correctiveLifecycleService) {
        this.service = service;
        this.rebuildService = rebuildService;
        this.loteService = loteService;
        this.correctionService = correctionService;
        this.correctiveLifecycleService = correctiveLifecycleService;
    }

    /**
     * Corrige el payload de una fila fallida en staging (paso previo al rebuild),
     * sin tocar la BD a mano. Body = JSON Merge Patch sobre el payload. Mutacion.
     */
    @PATCH
    @Path("/staging-row")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101StagingCorrectionService.CorrectionResult correctRow(@QueryParam("connectionRef") String connectionRef,
                                                                     @QueryParam("fragmentSetId") String fragmentSetId,
                                                                     @QueryParam("sourceFileHash") String sourceFileHash,
                                                                     @QueryParam("recordNumber") Long recordNumber,
                                                                     @QueryParam("stagingId") Long stagingId,
                                                                     @QueryParam("reason") String reason,
                                                                     @QueryParam("ticketRef") String ticketRef,
                                                                     @HeaderParam("If-Match") String ifMatch,
                                                                     String payloadJson,
                                                                     @Context SecurityContext securityContext) {
        if (recordNumber == null) {
            throw new BadRequestException("recordNumber is required");
        }
        if (stagingId == null) {
            throw new BadRequestException("stagingId is required");
        }
        try {
            return correctionService.correctRow(connectionRef, fragmentSetId, sourceFileHash, recordNumber, stagingId, payloadJson,
                    actor(securityContext), parseIfMatch(ifMatch), reason, ticketRef);
        } catch (Mt101StagingCorrectionService.StaleStagingRowException conflict) {
            // Locking optimista: otro operador corrigio la fila desde que la cargaste.
            throw new ClientErrorException(conflict.getMessage(), Response.Status.CONFLICT);
        } catch (Mt101StagingCorrectionService.RowLockedForRebuildException locked) {
            // B2: la fila esta congelada por un rebuild APPROVED/BUILDING (maker-checker).
            throw new ClientErrorException(locked.getMessage(), Response.Status.CONFLICT);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * Payload actual + version (ETag) de una fila en cuarentena, para cargar antes de
     * corregir y reenviar la version en If-Match (locking optimista).
     */
    @GET
    @Path("/staging-row")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public Response stagingRow(@QueryParam("connectionRef") String connectionRef,
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
            var view = correctionService.readRow(connectionRef, fragmentSetId, sourceFileHash, recordNumber, stagingId);
            return Response.ok(view).header("ETag", "\"" + view.version() + "\"").build();
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * Cabecera del lote (archivo + hash + ejecucion + conteos) por fragmentSetId o
     * processExecutionId; entrada de la vista unificada desde la ejecucion.
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

    /** Encola las filas fallidas de un set resolviendo cada :21: a su fila exacta. Mutacion. */
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
                                                @QueryParam("sourceFileHash") String sourceFileHash,
                                                @QueryParam("sourceRecordNumber") Long sourceRecordNumber,
                                                @QueryParam("ruleCode") String ruleCode,
                                                @QueryParam("sendersReference") String sendersReference,
                                                @QueryParam("transactionReference") String transactionReference,
                                                @QueryParam("afterId") @DefaultValue("0") long afterId,
                                                @QueryParam("limit") @DefaultValue("500") int limit) {
        try {
            rebuildService.synchronizeLifecycle(connectionRef, fragmentSetId);
            return service.list(connectionRef, fragmentSetId, status, sourceFileHash, sourceRecordNumber,
                            ruleCode, sendersReference, transactionReference, afterId, limit).stream()
                    .map(this::toResponse)
                    .toList();
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @POST
    @Path("/rebuild-runs/request")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101RebuildService.RebuildRunSummary requestRebuild(@QueryParam("connectionRef") String connectionRef,
                                                                @QueryParam("fragmentSetId") String fragmentSetId,
                                                                @QueryParam("reason") String reason,
                                                                @Context SecurityContext securityContext) {
        try {
            // B1: el correctiveSetId lo genera el servidor (no se acepta del cliente).
            return rebuildService.requestRebuildFromQuarantine(
                    connectionRef, fragmentSetId, actor(securityContext), reason);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @POST
    @Path("/rebuild-runs/request-child")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101RebuildService.RebuildRunSummary requestChildCorrective(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("parentRebuildRunId") String parentRebuildRunId,
            @QueryParam("reason") String reason,
            @Context SecurityContext securityContext) {
        try {
            return rebuildService.requestRebuildFromRejectedCorrective(
                    connectionRef, parentRebuildRunId, actor(securityContext), reason);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @GET
    @Path("/rebuild-runs")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public List<Mt101RebuildService.RebuildRunSummary> rebuildRuns(@QueryParam("connectionRef") String connectionRef,
                                                                    @QueryParam("fragmentSetId") String fragmentSetId,
                                                                    @QueryParam("limit") @DefaultValue("20") int limit) {
        try {
            return rebuildService.listRebuildRuns(connectionRef, fragmentSetId, limit);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @GET
    @Path("/rebuild-runs/detail")
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "auditor"})
    public Mt101RebuildService.RebuildRunSummary rebuildRun(@QueryParam("connectionRef") String connectionRef,
                                                            @QueryParam("rebuildRunId") String rebuildRunId) {
        try {
            return rebuildService.getRebuildRun(connectionRef, rebuildRunId);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @POST
    @Path("/rebuild-runs/approve")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public Mt101RebuildService.RebuildRunSummary approveRebuild(@QueryParam("connectionRef") String connectionRef,
                                                                @QueryParam("rebuildRunId") String rebuildRunId,
                                                                @QueryParam("reason") String reason,
                                                                @Context SecurityContext securityContext) {
        try {
            return rebuildService.approveRebuildRun(connectionRef, rebuildRunId, actor(securityContext), reason);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    @POST
    @Path("/rebuild-runs/execute")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101RebuildService.RebuildResult executeRebuild(@QueryParam("connectionRef") String connectionRef,
                                                            @QueryParam("rebuildRunId") String rebuildRunId,
                                                            @Context SecurityContext securityContext) {
        try {
            return rebuildService.executeApprovedRebuildRun(connectionRef, rebuildRunId, actor(securityContext));
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /** B2': avanza el correctivo BUILT -> VALIDATED -> ARCHIVED (sin enviar; no mueve dinero). */
    @POST
    @Path("/rebuild-runs/advance-corrective")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101CorrectiveLifecycleService.CorrectiveLifecycleResult advanceCorrective(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("rebuildRunId") String rebuildRunId,
            @Context SecurityContext securityContext) {
        try {
            return correctiveLifecycleService.advanceCorrective(connectionRef, rebuildRunId, actor(securityContext));
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /** B2': el maker solicita el envio (PAY) del correctivo, que ya esta ARCHIVED. */
    @POST
    @Path("/rebuild-runs/request-pay")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101CorrectiveLifecycleService.CorrectiveLifecycleResult requestCorrectivePay(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("rebuildRunId") String rebuildRunId,
            @QueryParam("reason") String reason,
            @QueryParam("ticketRef") String ticketRef,
            @Context SecurityContext securityContext) {
        try {
            return correctiveLifecycleService.requestCorrectivePay(
                    connectionRef, rebuildRunId, actor(securityContext), reason, ticketRef);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /** B2': el checker (distinto del maker) aprueba y ejecuta el envio del correctivo (PAY real). */
    @POST
    @Path("/rebuild-runs/approve-pay")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public Mt101CorrectiveLifecycleService.CorrectiveLifecycleResult approveCorrectivePay(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("rebuildRunId") String rebuildRunId,
            @Context SecurityContext securityContext) {
        try {
            return correctiveLifecycleService.approveAndPayCorrective(connectionRef, rebuildRunId, actor(securityContext));
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /** Resuelve PAY_UNCERTAIN consultando MT101_STATUS. No reenvia MT101_PAY. */
    @POST
    @Path("/rebuild-runs/resolve-uncertain-pay")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101CorrectiveLifecycleService.CorrectiveLifecycleResult resolveUncertainPay(
            @QueryParam("connectionRef") String connectionRef,
            @QueryParam("rebuildRunId") String rebuildRunId,
            @QueryParam("reason") String reason,
            @Context SecurityContext securityContext) {
        try {
            return correctiveLifecycleService.resolveUncertainPay(
                    connectionRef, rebuildRunId, actor(securityContext), reason);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /** Parsea el header If-Match (ETag) a la version esperada; obligatorio para mutaciones. */
    private static Long parseIfMatch(String ifMatch) {
        if (ifMatch == null || ifMatch.isBlank()) {
            throw new BadRequestException("If-Match header is required for staging-row corrections");
        }
        var token = ifMatch.trim();
        if (token.startsWith("W/")) {
            token = token.substring(2).trim();
        }
        if (token.length() >= 2 && token.startsWith("\"") && token.endsWith("\"")) {
            token = token.substring(1, token.length() - 1);
        }
        try {
            return Long.parseLong(token.trim());
        } catch (NumberFormatException error) {
            throw new BadRequestException("If-Match must be a numeric version (ETag)");
        }
    }

    /** Actor para auditoria/gobernanza: usuario autenticado del token OIDC, nunca del query. */
    private static String actor(SecurityContext securityContext) {
        if (securityContext != null && securityContext.getUserPrincipal() != null) {
            var name = securityContext.getUserPrincipal().getName();
            if (name != null && !name.isBlank()) {
                return name;
            }
        }
        return "unknown";
    }

    private Mt101FailedRecordResponse toResponse(Mt101FailedRecordRepository.FailedRecord row) {
        return new Mt101FailedRecordResponse(
                row.id(),
                row.fragmentSetId(),
                row.sendersReference(),
                row.transactionReference(),
                row.sourceFileHash(),
                row.sourceRecordNumber(),
                row.stagingId(),
                row.sourceTaskDefinitionId(),
                row.sourceName(),
                row.ruleCode(),
                row.ruleSet(),
                row.severity(),
                row.message(),
                row.status(),
                row.createdAt(),
                row.resolvedAt());
    }
}
