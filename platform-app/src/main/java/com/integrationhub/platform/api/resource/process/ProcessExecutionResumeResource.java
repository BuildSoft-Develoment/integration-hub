package com.integrationhub.platform.api.resource.process;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.execution.ProcessExecutionResumeService;
import com.integrationhub.platform.service.execution.ResumeCallbackSignatureVerifier;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.LinkedHashMap;
import java.util.Map;

import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Callback endpoint para reanudar tareas suspendidas (M-2).
 *
 * <p>Uso tipico (vertical 008-mensajeria-pagos): el gateway bancario envia un
 * push a {@code POST /api/process-executions/resume/{token}} con el resultado
 * del pago (MT900/MT910, pacs.002, camt.054). El body se entrega al provider
 * como {@code externalEvent} dentro del estado de resume.</p>
 *
 * <p>Tambien lo invoca {@code SuspensionExpiryScheduler} cuando vence
 * {@code suspend_expires_at} (modo polling, sin push externo).</p>
 *
 * <p><b>Seguridad</b>: ademas de los roles, con
 * {@code integrationhub.resume.hmac.enabled=true} el caller debe firmar el body
 * crudo con HMAC-SHA256 (header {@code X-Signature}, secreto compartido via
 * {@code integrationhub.resume.hmac.secret}). Firma ausente/invalida = 401.
 * El token es de un solo uso, asi que el replay de un request capturado
 * produce 404.</p>
 *
 * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
 * @trace spec 008-mensajeria-pagos RF-019
 */
@Path("/api/process-executions/resume")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProcessExecutionResumeResource {

    private static final TypeReference<Map<String, Object>> EVENT_TYPE = new TypeReference<>() {
    };

    private final ProcessExecutionResumeService resumeService;
    private final ResumeCallbackSignatureVerifier signatureVerifier;
    private final ObjectMapper objectMapper;

    public ProcessExecutionResumeResource(ProcessExecutionResumeService resumeService,
                                          ResumeCallbackSignatureVerifier signatureVerifier,
                                          ObjectMapper objectMapper) {
        this.resumeService = resumeService;
        this.signatureVerifier = signatureVerifier;
        this.objectMapper = objectMapper;
    }

    @POST
    @Path("/{token}")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR})
    public Response resume(@PathParam("token") String token,
                           @HeaderParam("X-Signature") String signature,
                           String rawBody) {
        // El body se recibe crudo (String) para que el HMAC se calcule sobre los
        // bytes exactos que firmo el emisor, no sobre una re-serializacion.
        if (signatureVerifier.enabled() && !signatureVerifier.verify(rawBody, signature)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "invalid or missing X-Signature"))
                    .build();
        }
        Map<String, Object> externalEvent;
        try {
            externalEvent = rawBody == null || rawBody.isBlank()
                    ? Map.of()
                    : objectMapper.readValue(rawBody, EVENT_TYPE);
        } catch (JsonProcessingException invalidJson) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "request body is not valid JSON"))
                    .build();
        }
        try {
            var outcome = resumeService.resume(token, externalEvent);
            var body = new LinkedHashMap<String, Object>();
            body.put("outcome", outcome.outcome().name());
            body.put("processCompleted", outcome.processCompleted());
            body.put("details", outcome.details());
            if (outcome.nextResumeToken() != null) {
                body.put("nextResumeToken", outcome.nextResumeToken());
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
