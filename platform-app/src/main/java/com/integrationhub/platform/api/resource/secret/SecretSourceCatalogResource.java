package com.integrationhub.platform.api.resource.secret;

// @trace ADR-031 D1, QA-006 (la interfaz deja de recomendar un prefijo que este despliegue no resuelve)

import com.integrationhub.platform.api.response.secret.SecretEntryResponse;
import com.integrationhub.platform.api.response.secret.SecretEnumerationResponse;
import com.integrationhub.platform.api.response.secret.SecretSourceCatalogResponse;
import com.integrationhub.platform.api.response.secret.SecretSourceResponse;
import com.integrationhub.platform.service.secret.SecretEnumerationService;
import com.integrationhub.platform.service.secret.SecretSourceCatalogService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;
import org.jboss.logging.Logger;

import static com.integrationhub.platform.spi.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Que fuentes de secreto resuelve este despliegue. La UI lo usa para ofrecer el prefijo correcto en
 * los campos de credencial de fuentes, conexiones y tareas, en vez de recomendar siempre
 * {@code ${secret:...}} -- que en la VM no existe y falla en ejecucion (ADR-031, hecho 3).
 *
 * <p><b>No es el endpoint sensible.</b> Devuelve nombres de prefijo, no rutas ni valores: saber que
 * esta maquina resuelve {@code vaultkv} no dice nada de que secretos hay dentro. Enumerar rutas
 * -ADR-031 D5- si es otra cosa, y llevara su propio RBAC y su auditoria.</p>
 */
@Path("/api/secret-sources")
@Produces(MediaType.APPLICATION_JSON)
public class SecretSourceCatalogResource {

    private static final Logger LOG = Logger.getLogger(SecretSourceCatalogResource.class);

    private final SecretSourceCatalogService catalogService;

    private final SecretEnumerationService enumerationService;

    public SecretSourceCatalogResource(
            SecretSourceCatalogService catalogService, SecretEnumerationService enumerationService) {
        this.catalogService = catalogService;
        this.enumerationService = enumerationService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public SecretSourceCatalogResponse list() {
        return new SecretSourceCatalogResponse(catalogService.catalogo().stream()
                .map(fuente -> new SecretSourceResponse(fuente.source(), fuente.enumerable()))
                .toList());
    }

    /**
     * Los secretos que existen en una fuente: rutas y nombres de campo, jamas valores.
     *
     * <p><b>Por que este SI es sensible, y el catalogo no.</b> Una ruta no es un secreto, pero
     * {@code connections/banco-XXX/sftp} dice con quien operas y cuantos son. De ahi el RBAC de
     * EDITAR conexiones —{@code PLATFORM_ADMIN} e {@code INTEGRATION_ADMIN}, sin {@code AUDITOR}, a
     * diferencia del catalogo— y de ahi la traza: en un sistema del camino del dinero, enumerar las
     * credenciales existentes merece dejar rastro (ADR-031 D5).</p>
     *
     * <p><b>La traza no lleva las rutas.</b> Escribirlas en el log volveria a poner en un fichero
     * -que se rota, se copia y se lee con otros permisos- justo lo que este endpoint protege. Queda
     * quien, cuando y cuantas, que es lo que permite ver un patron raro sin filtrar el inventario.
     * Un registro de auditoria propio para actos administrativos no existe todavia: {@code
     * AuditEnvelope} esta modelado sobre ejecuciones -traceId, recordId, processExecutionId- y
     * meter esto ahi lo pintaria en el historico de ejecuciones como una fila sin ejecucion. Eso
     * merece su decision, no colarse aqui.</p>
     */
    @GET
    @Path("/{source}/entries")
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public SecretEnumerationResponse entries(
            @PathParam("source") String source, @Context SecurityContext securityContext) {
        var enumeracion = enumerationService.enumerar(source);
        LOG.infof(
                "Enumeracion de secretos: usuario=%s fuente=%s entradas=%d completa=%s",
                nombreDe(securityContext), source, enumeracion.entries().size(), enumeracion.complete());
        return new SecretEnumerationResponse(
                source,
                enumeracion.entries().stream()
                        .map(entrada -> new SecretEntryResponse(entrada.path(), entrada.fields()))
                        .toList(),
                enumeracion.complete());
    }

    private static String nombreDe(SecurityContext securityContext) {
        var principal = securityContext == null ? null : securityContext.getUserPrincipal();
        return principal == null ? "desconocido" : principal.getName();
    }
}
