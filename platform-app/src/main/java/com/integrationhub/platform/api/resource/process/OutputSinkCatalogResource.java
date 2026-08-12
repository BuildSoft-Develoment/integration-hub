package com.integrationhub.platform.api.resource.process;

import com.integrationhub.platform.api.response.process.OutputSinkCatalogResponse;
import com.integrationhub.platform.service.task.sink.OutputSinkRegistry;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import static com.integrationhub.platform.spi.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Tipos de fuente a los que se sabe ENTREGAR de verdad.
 *
 * <p>El catalogo de {@code /sources} admite 8 tipos de entrada y la salida solo entrega a 2, asi que
 * el selector de destino de {@code FILE_DELIVER} necesita saber cuales para no ofrecer un destino que
 * fallaria al ejecutar. Sin este dato el front no puede distinguirlos: {@code direction} dice si la
 * fuente <em>quiere</em> ser destino, no si el motor <em>puede</em> escribir en ella.</p>
 */
@Path("/api/output-sinks")
@Produces(MediaType.APPLICATION_JSON)
public class OutputSinkCatalogResource {

    private final OutputSinkRegistry sinks;

    public OutputSinkCatalogResource(OutputSinkRegistry sinks) {
        this.sinks = sinks;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, AUDITOR})
    public OutputSinkCatalogResponse list() {
        return new OutputSinkCatalogResponse(sinks.availableTypes());
    }
}
