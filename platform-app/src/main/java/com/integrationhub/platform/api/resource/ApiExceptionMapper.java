package com.integrationhub.platform.api.resource;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.util.LinkedHashMap;

@Provider
public class ApiExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOG = Logger.getLogger(ApiExceptionMapper.class);

    @Context
    UriInfo uriInfo;

    @Override
    public Response toResponse(Throwable exception) {
        var status = resolveStatus(exception);
        var path = uriInfo == null ? "<unknown>" : uriInfo.getRequestUri().getPath();
        var details = exception.getMessage() == null || exception.getMessage().isBlank()
                ? "Unexpected error"
                : exception.getMessage();

        if (status >= 500) {
            LOG.errorv(exception, "Unhandled API exception. status={0}, path={1}, details={2}", status, path, details);
        } else {
            LOG.warnv(exception, "API exception. status={0}, path={1}, details={2}", status, path, details);
        }

        var payload = new LinkedHashMap<String, Object>();
        payload.put("status", status);
        payload.put("path", path);
        payload.put("message", details);
        payload.put("details", details);

        return Response.status(status)
                .entity(payload)
                .build();
    }

    private int resolveStatus(Throwable exception) {
        if (exception instanceof WebApplicationException webApplicationException) {
            return webApplicationException.getResponse().getStatus();
        }
        // Validacion de entrada del cliente (p.ej. campo requerido vacio, tipo/JSON invalido) -> 400, no 500.
        // Los servicios lanzan IllegalArgumentException para estos casos; sin esto caian a 500 (fail feo).
        if (exception instanceof IllegalArgumentException) {
            return Response.Status.BAD_REQUEST.getStatusCode();
        }
        return Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();
    }
}
