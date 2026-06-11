package com.integrationhub.platform.api.resource.payments;

import com.integrationhub.platform.api.mapper.payments.PaymentValidationRuleApiMapper;
import com.integrationhub.platform.api.request.payments.PaymentValidationRuleImportRequest;
import com.integrationhub.platform.api.request.payments.PaymentValidationRuleRequest;
import com.integrationhub.platform.api.response.common.PageResponse;
import com.integrationhub.platform.api.response.payments.PaymentValidationRuleImportResponse;
import com.integrationhub.platform.api.response.payments.PaymentValidationRuleResponse;
import com.integrationhub.platform.service.payments.PaymentValidationRuleCatalogService;
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
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
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
    @RolesAllowed({"platform-admin", "integration-admin", "auditor"})
    public List<PaymentValidationRuleResponse> exportRuleSet(@QueryParam("ruleSet") String ruleSet) {
        return service.exportRuleSet(ruleSet).stream().map(mapper::toResponse).toList();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"platform-admin", "integration-admin"})
    public PaymentValidationRuleResponse create(PaymentValidationRuleRequest request) {
        return mapper.toResponse(service.create(request));
    }

    @PUT
    @Path("/{ruleId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"platform-admin", "integration-admin"})
    public PaymentValidationRuleResponse update(@PathParam("ruleId") Long ruleId,
                                                PaymentValidationRuleRequest request) {
        return mapper.toResponse(service.update(ruleId, request));
    }

    @POST
    @Path("/{ruleId}/activation/{active}")
    @RolesAllowed({"platform-admin", "integration-admin"})
    public PaymentValidationRuleResponse setActive(@PathParam("ruleId") Long ruleId,
                                                   @PathParam("active") boolean active) {
        return mapper.toResponse(service.setActive(ruleId, active));
    }

    @POST
    @Path("/import")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"platform-admin", "integration-admin"})
    public PaymentValidationRuleImportResponse importRules(PaymentValidationRuleImportRequest request) {
        var result = service.importRules(request);
        return new PaymentValidationRuleImportResponse(
                result.ruleSet(),
                result.importedCount(),
                result.replacedExisting());
    }
}
