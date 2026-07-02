package com.integrationhub.platform.api.resource.plugin;

import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.spi.task.PluginConfigSchema;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Expone el schema de configuración de un tipo de tarea para que la UI lo renderice
 * dinámicamente ({@code ih-schema-form}). Es la mitad backend del contrato que permite
 * configurar un tipo contribuido por un plugin sin formulario hardcoded en el frontend.
 */
@Path("/api/plugins/config-schema")
@Produces(MediaType.APPLICATION_JSON)
public class PluginConfigSchemaResource {

    private final TaskProviderRegistry taskProviders;

    @Inject
    public PluginConfigSchemaResource(TaskProviderRegistry taskProviders) {
        this.taskProviders = taskProviders;
    }

    /**
     * Devuelve el schema de configuración de un tipo de tarea. Vacío (200, {@code fields: []}) si
     * el tipo no existe o no declara schema, para que la UI simplemente no muestre formulario.
     */
    @GET
    @Path("/{type}")
    @RolesAllowed({INTEGRATION_ADMIN, PLATFORM_ADMIN, OPERATOR})
    public PluginConfigSchema schemaFor(@PathParam("type") String type) {
        if (type == null || type.isBlank() || !taskProviders.availableTaskTypes().contains(type)) {
            return PluginConfigSchema.empty();
        }
        try {
            return taskProviders.resolve(type).configSchema();
        } catch (RuntimeException ex) {
            return PluginConfigSchema.empty();
        }
    }
}
