package com.integrationhub.platform.api.resource.payments;

import com.integrationhub.vertical.swift.mt101.api.response.Mt101FragmentLinkResponse;
import com.integrationhub.vertical.swift.mt101.api.response.Mt101ReprocessResponse;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.vertical.swift.mt101.service.Mt101ReprocessService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;

import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Reproceso quirurgico de fragmentos MT101. Mutación: excluye el rol auditor
 * (solo lectura). Permite revalidar por estado o reprocesar solo las filas
 * afectadas de un lote masivo.
 */
@Path("/api/query/mt101-fragments/reprocess")
@Produces(MediaType.APPLICATION_JSON)
public class Mt101ReprocessResource {

    private final Mt101ReprocessService service;

    public Mt101ReprocessResource(Mt101ReprocessService service) {
        this.service = service;
    }

    /**
     * Transiciona en bloque los fragmentos de un set: p.ej. {@code fromStatus=REJECTED}
     * {@code toStatus=BUILT} para revalidar tras corregir reglas.
     */
    @POST
    @Path("/status")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR})
    public Mt101ReprocessResponse byStatus(@QueryParam("connectionRef") String connectionRef,
                                           @QueryParam("fragmentSetId") String fragmentSetId,
                                           @QueryParam("fromStatus") String fromStatus,
                                           @QueryParam("toStatus") String toStatus,
                                           @QueryParam("reason") String reason,
                                           @QueryParam("ticketRef") String ticketRef,
                                           @Context SecurityContext securityContext) {
        try {
            var affected = service.resetByStatus(connectionRef, fragmentSetId, fromStatus, toStatus,
                    actor(securityContext), reason, ticketRef);
            return new Mt101ReprocessResponse(fragmentSetId, fromStatus, toStatus, affected);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * Reprocesa solo los fragmentos cuyo rango de fila del archivo solapa
     * [recordFrom, recordTo] (1-based), llevandolos a {@code toStatus}. Devuelve los
     * fragmentos afectados para que el operador vea exactamente que filas se tocaron.
     */
    @POST
    @Path("/source-rows")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR})
    public List<Mt101FragmentLinkResponse> bySourceRows(@QueryParam("connectionRef") String connectionRef,
                                                        @QueryParam("fragmentSetId") String fragmentSetId,
                                                        @QueryParam("recordFrom") Long recordFrom,
                                                        @QueryParam("recordTo") Long recordTo,
                                                        @QueryParam("sourceFileHash") String sourceFileHash,
                                                        @QueryParam("toStatus") @DefaultValue("BUILT") String toStatus,
                                                        @QueryParam("reason") String reason,
                                                        @QueryParam("ticketRef") String ticketRef,
                                                        @Context SecurityContext securityContext) {
        if (recordFrom == null) {
            throw new BadRequestException("recordFrom is required");
        }
        if (sourceFileHash == null || sourceFileHash.isBlank()) {
            throw new BadRequestException("sourceFileHash is required");
        }
        var to = recordTo == null ? recordFrom : recordTo;
        try {
            return service.reprocessSourceRows(connectionRef, fragmentSetId, recordFrom, to, sourceFileHash, toStatus,
                            actor(securityContext), reason, ticketRef)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    /**
     * B1': reabre una fila cuyo rebuild correctivo fue rechazado
     * ({@code REBUILD_REJECTED -> QUARANTINED}) para corregir y reconstruir de nuevo.
     */
    @POST
    @Path("/reopen-rejected")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR})
    public Mt101ReprocessResponse reopenRejected(@QueryParam("connectionRef") String connectionRef,
                                                 @QueryParam("fragmentSetId") String fragmentSetId,
                                                 @QueryParam("sourceFileHash") String sourceFileHash,
                                                 @QueryParam("recordNumber") Long recordNumber,
                                                 @QueryParam("stagingId") Long stagingId,
                                                 @QueryParam("reason") String reason,
                                                 @QueryParam("ticketRef") String ticketRef,
                                                 @Context SecurityContext securityContext) {
        if (recordNumber == null) {
            throw new BadRequestException("recordNumber is required");
        }
        if (stagingId == null) {
            throw new BadRequestException("stagingId is required");
        }
        try {
            var affected = service.reopenRejectedRebuild(connectionRef, fragmentSetId, sourceFileHash, recordNumber, stagingId,
                    actor(securityContext), reason, ticketRef);
            return new Mt101ReprocessResponse(fragmentSetId, "REBUILD_REJECTED", "QUARANTINED", affected);
        } catch (IllegalArgumentException error) {
            throw new BadRequestException(error.getMessage(), error);
        }
    }

    private static String actor(SecurityContext securityContext) {
        if (securityContext != null && securityContext.getUserPrincipal() != null) {
            var name = securityContext.getUserPrincipal().getName();
            if (name != null && !name.isBlank()) {
                return name;
            }
        }
        return "unknown";
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
