package com.integrationhub.platform.api.resource.process;

import com.integrationhub.platform.service.execution.ProcessExecutionResumeService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Callback endpoint para reanudar tareas suspendidas (M-2).
 *
 * <p>Uso tipico (vertical 008-mensajeria-pagos): el gateway bancario envia un
 * push a {@code POST /api/process-executions/resume/{token}} con el resultado
 * del pago (MT900/MT910, pacs.002, camt.054). El body se entrega al provider
 * como {@code externalEvent} dentro del estado de resume.</p>
 *
 * <p>Tambien lo invoca un scheduler periodico interno cuando expira un
 * {@code suspend_expires_at} (modo polling, sin push externo).</p>
 *
 * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
 * @trace spec 008-mensajeria-pagos RF-019
 */
@Path("/api/process-executions/resume")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProcessExecutionResumeResource {

    private final ProcessExecutionResumeService resumeService;

    public ProcessExecutionResumeResource(ProcessExecutionResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @POST
    @Path("/{token}")
    // El callback puede llegar de:
    // - Sistemas bancarios externos: deberian ir por un Resource separado con HMAC verification
    //   (out of scope para esta foundation). Para uso interno autenticado, los roles abajo
    //   son suficientes.
    // - Scheduler periodico interno: usa el rol 'platform-admin' configurado en el job.
    @RolesAllowed({"platform-admin", "integration-admin", "operator", "payments-operator"})
    public Response resume(@PathParam("token") String token, Map<String, Object> externalEvent) {
        try {
            var outcome = resumeService.resume(token, externalEvent);
            var body = new LinkedHashMap<String, Object>();
            body.put("outcome", outcome.outcome().name());
            body.put("processCompleted", outcome.processCompleted());
            body.put("details", outcome.details());
            if (outcome.nextResumeToken() != null) {
                body.put("nextResumeToken", outcome.nextResumeToken());
            }
            if (outcome.outcome() == ProcessExecutionResumeService.Outcome.COMPLETED_NEEDS_REDRIVE) {
                body.put("note",
                        "Task completed but downstream tasks were not auto-executed. "
                                + "Manual re-drive of the process is required (full pipeline "
                                + "continuation from a suspended midpoint is scheduled for a future slice).");
            }
            return Response.ok(body).build();
        } catch (ProcessExecutionResumeService.SuspensionNotFoundException notFound) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", notFound.getMessage()))
                    .build();
        } catch (IllegalStateException illegal) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", illegal.getMessage()))
                    .build();
        }
    }
}
