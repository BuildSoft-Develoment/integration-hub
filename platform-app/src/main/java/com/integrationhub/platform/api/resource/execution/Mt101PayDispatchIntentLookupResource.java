package com.integrationhub.platform.api.resource.execution;

import com.integrationhub.platform.provider.task.payments.swift.Mt101PayDispatchIntentStore;
import com.integrationhub.platform.service.payments.swift.Mt101PayDispatchIntentLookupService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

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

    public Mt101PayDispatchIntentLookupResource(Mt101PayDispatchIntentLookupService service) {
        this.service = service;
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
}
