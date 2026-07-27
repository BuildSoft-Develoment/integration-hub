package com.integrationhub.platform.api.resource.plugin;

import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.function.Supplier;

import static com.integrationhub.platform.spi.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.spi.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.spi.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Expone el schema de configuración de un tipo (task/source/reader) para que la UI lo renderice
 * dinámicamente ({@code ih-schema-form}). Es la mitad backend del contrato que permite configurar
 * un tipo contribuido por un plugin sin formulario hardcoded en el frontend.
 */
@Path("/api/plugins/config-schema")
@Produces(MediaType.APPLICATION_JSON)
public class PluginConfigSchemaResource {

    private final TaskProviderRegistry taskProviders;
    private final SourceProviderRegistry sourceProviders;
    private final ReaderProviderRegistry readerProviders;

    @Inject
    public PluginConfigSchemaResource(TaskProviderRegistry taskProviders,
                                      SourceProviderRegistry sourceProviders,
                                      ReaderProviderRegistry readerProviders) {
        this.taskProviders = taskProviders;
        this.sourceProviders = sourceProviders;
        this.readerProviders = readerProviders;
    }

    /**
     * Devuelve el schema de configuración de un tipo (busca en task, luego source, luego reader).
     * Vacío (200, {@code fields: []}) si ningún provider lo declara → la UI no muestra formulario.
     */
    @GET
    @Path("/{type}")
    @RolesAllowed({INTEGRATION_ADMIN, PLATFORM_ADMIN, OPERATOR})
    public PluginConfigSchema schemaFor(@PathParam("type") String type) {
        if (type == null || type.isBlank()) {
            return PluginConfigSchema.empty();
        }
        PluginConfigSchema schema = firstNonEmpty(
                () -> taskProviders.resolve(type).configSchema(),
                () -> sourceProviders.resolve(type).configSchema(),
                () -> readerProviders.resolve(type).configSchema());
        return schema != null ? schema : PluginConfigSchema.empty();
    }

    @SafeVarargs
    private static PluginConfigSchema firstNonEmpty(Supplier<PluginConfigSchema>... resolvers) {
        for (Supplier<PluginConfigSchema> resolver : resolvers) {
            try {
                PluginConfigSchema schema = resolver.get();
                if (schema != null && !schema.isEmpty()) {
                    return schema;
                }
            } catch (RuntimeException ignored) {
                // El registry lanza si el tipo no le pertenece; se prueba el siguiente.
            }
        }
        return null;
    }
}
