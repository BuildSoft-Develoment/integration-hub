package com.integrationhub.platform.api.resource.payments;

import com.integrationhub.vertical.swift.mt101.provider.Mt101PayDispatchIntentStore;
import com.integrationhub.platform.service.payments.swift.Mt101PayDispatchIntentLookupService;
import com.integrationhub.platform.service.payments.swift.Mt101PayDispatchIntentReconcileService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * D1 (visibilidad): expone el ledger de intención de dispatch del <b>PAY directo por lista</b>
 * ({@code mt101_pay_dispatch_intent}). Un dispatch que queda {@code UNCERTAIN} (o {@code DISPATCHING} colgado por un
 * crash) bloquea el reenvío del pago "hasta conciliar", pero hasta ahora no tenía superficie de lectura. Estos
 * endpoints lo hacen observable para el operador (espejo de {@code Mt101FragmentLookupResource} para el camino de
 * lista). Solo lectura; auth-gated con los mismos roles que el lookup de fragmentos.
 */
@Path("/api/query/mt101-pay-dispatch-intents")
@Produces(MediaType.APPLICATION_JSON)
public class Mt101PayDispatchIntentLookupResource {

    private final Mt101PayDispatchIntentLookupService service;
    private final Mt101PayDispatchIntentReconcileService reconcileService;

    public Mt101PayDispatchIntentLookupResource(Mt101PayDispatchIntentLookupService service,
                                                Mt101PayDispatchIntentReconcileService reconcileService) {
        this.service = service;
        this.reconcileService = reconcileService;
    }

    /** Resumen del ledger: conteo por estado + total + atascados (UNCERTAIN/DISPATCHING) para la alerta de un vistazo. */
    @GET
    @Path("/summary")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public Map<String, Object> summary() {
        var counts = service.statusCounts();
        var byStatus = new LinkedHashMap<String, Long>();
        long total = 0;
        for (var entry : counts) {
            byStatus.put(entry.status(), entry.count());
            total += entry.count();
        }
        return Map.of("total", total, "byStatus", byStatus, "stuck", service.stuckIntentCount());
    }

    /**
     * Intenciones atascadas (UNCERTAIN / DISPATCHING), más antiguas primero: exigen conciliación manual y bloquean el
     * reenvío. La UI las lista para que el operador actúe.
     */
    @GET
    @Path("/stuck")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<Mt101PayDispatchIntentStore.DispatchIntentRow> stuck(@QueryParam("limit") Integer limit) {
        return service.stuckIntents(limit);
    }

    /**
     * D2 (gobernado): reconcilia una intención atascada leyendo el terminal ya clasificado del {@code mt101_archive}
     * (que STATUS dejó al confirmar el pago inline). Transiciona el intent a SENT/REJECTED sin re-consultar el gateway
     * ni re-despachar; sin ejecución/match/terminal → no-op (queda manual). {@code reason} obligatorio (evidencia).
     * Roles de operación (sin AUDITOR): es una escritura sobre el money-path.
     */
    @POST
    @Path("/reconcile")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR})
    public Map<String, Object> reconcile(@QueryParam("dispatchKey") String dispatchKey,
                                         @QueryParam("reason") String reason,
                                         @Context SecurityContext securityContext) {
        try {
            var result = reconcileService.reconcile(dispatchKey, actor(securityContext), reason);
            var response = new LinkedHashMap<String, Object>();
            response.put("outcome", result.outcome().name());
            response.put("newStatus", result.newStatus());
            return response;
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
}
