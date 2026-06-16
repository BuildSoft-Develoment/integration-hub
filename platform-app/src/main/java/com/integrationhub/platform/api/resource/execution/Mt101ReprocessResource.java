package com.integrationhub.platform.api.resource.execution;

import com.integrationhub.platform.api.response.execution.Mt101FragmentLinkResponse;
import com.integrationhub.platform.api.response.execution.Mt101ReprocessResponse;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.service.payments.swift.Mt101ReprocessService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

/**
 * Reproceso quirurgico de fragmentos MT101. Mutación: excluye el rol auditor
 * (solo lectura). Permite revalidar/reenviar por estado o reprocesar solo las
 * filas afectadas de un lote masivo.
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
     * {@code toStatus=BUILT} para revalidar tras corregir reglas, o
     * {@code fromStatus=SENT} {@code toStatus=ARCHIVED} para reenviar.
     */
    @POST
    @Path("/status")
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public Mt101ReprocessResponse byStatus(@QueryParam("connectionRef") String connectionRef,
                                           @QueryParam("fragmentSetId") String fragmentSetId,
                                           @QueryParam("fromStatus") String fromStatus,
                                           @QueryParam("toStatus") String toStatus) {
        try {
            var affected = service.resetByStatus(connectionRef, fragmentSetId, fromStatus, toStatus);
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
    @RolesAllowed({"platform-admin", "integration-admin", "operator"})
    public List<Mt101FragmentLinkResponse> bySourceRows(@QueryParam("connectionRef") String connectionRef,
                                                        @QueryParam("fragmentSetId") String fragmentSetId,
                                                        @QueryParam("recordFrom") Long recordFrom,
                                                        @QueryParam("recordTo") Long recordTo,
                                                        @QueryParam("sourceFileHash") String sourceFileHash,
                                                        @QueryParam("toStatus") @DefaultValue("BUILT") String toStatus) {
        if (recordFrom == null) {
            throw new BadRequestException("recordFrom is required");
        }
        var to = recordTo == null ? recordFrom : recordTo;
        try {
            return service.reprocessSourceRows(connectionRef, fragmentSetId, recordFrom, to, sourceFileHash, toStatus)
                    .stream()
                    .map(this::toResponse)
                    .toList();
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
