package com.integrationhub.vertical.swift.mt101.api.resource;

import com.integrationhub.vertical.swift.mt101.api.mapper.PaymentValidationRuleApiMapper;
import com.integrationhub.vertical.swift.mt101.api.request.PaymentValidationRuleImportRequest;
import com.integrationhub.vertical.swift.mt101.api.request.PaymentValidationRuleRequest;
import com.integrationhub.platform.spi.api.PageResponse;
import com.integrationhub.vertical.swift.mt101.api.response.PaymentValidationRuleImportResponse;
import com.integrationhub.vertical.swift.mt101.api.response.PaymentValidationRuleResponse;
import com.integrationhub.vertical.swift.mt101.service.PaymentValidationRuleCatalogService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

import static com.integrationhub.platform.spi.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * API del catalogo de reglas de pago.
 *
 * @trace spec 008-mensajeria-pagos RF-023 (las seis operaciones que exige el requisito estan aqui:
 *     listar {@code GET /}, exportar {@code GET /export}, crear {@code POST /}, editar
 *     {@code PUT /{ruleId}}, activar/desactivar {@code POST /{ruleId}/activation/{active}} e
 *     importar {@code POST /import}. Las reglas reales viven como datos del ambiente, no aqui.)
 */
@Path("/api/payment-validation-rules")
@Produces(MediaType.APPLICATION_JSON)
public class PaymentValidationRuleResource {

    private final PaymentValidationRuleCatalogService service;
    private final PaymentValidationRuleApiMapper mapper;

    public PaymentValidationRuleResource(PaymentValidationRuleCatalogService service,
                                         PaymentValidationRuleApiMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public PageResponse<PaymentValidationRuleResponse> list(
            @QueryParam("ruleSet") String ruleSet,
            @QueryParam("q") String queryText,
            @QueryParam("standard") String standard,
            @QueryParam("appliesTo") String appliesTo,
            @QueryParam("status") String status,
            @DefaultValue("0") @QueryParam("page") int page,
            @DefaultValue("20") @QueryParam("size") int size
    ) {
        var result = service.list(ruleSet, queryText, standard, appliesTo, status, page, size);
        return new PageResponse<>(result.total(), result.items().stream().map(mapper::toResponse).toList());
    }

    @GET
    @Path("/export")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public List<PaymentValidationRuleResponse> exportRuleSet(@QueryParam("ruleSet") String ruleSet) {
        return service.exportRuleSet(ruleSet).stream().map(mapper::toResponse).toList();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public PaymentValidationRuleResponse create(PaymentValidationRuleRequest request) {
        return mapper.toResponse(service.create(request));
    }

    @PUT
    @Path("/{ruleId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public PaymentValidationRuleResponse update(@PathParam("ruleId") Long ruleId,
                                                PaymentValidationRuleRequest request) {
        return mapper.toResponse(service.update(ruleId, request));
    }

    @POST
    @Path("/{ruleId}/activation/{active}")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public PaymentValidationRuleResponse setActive(@PathParam("ruleId") Long ruleId,
                                                   @PathParam("active") boolean active) {
        return mapper.toResponse(service.setActive(ruleId, active));
    }

    @POST
    @Path("/import")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public PaymentValidationRuleImportResponse importRules(PaymentValidationRuleImportRequest request) {
        var result = service.importRules(request);
        return new PaymentValidationRuleImportResponse(
                result.ruleSet(),
                result.importedCount(),
                result.replacedExisting());
    }
}
