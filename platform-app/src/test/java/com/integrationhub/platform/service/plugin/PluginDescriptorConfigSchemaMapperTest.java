package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.provider.task.remote.RemoteTaskProvider;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PluginDescriptorConfigSchemaMapperTest {

    private final PluginDescriptorCatalogMapper mapper = new PluginDescriptorCatalogMapper(new ObjectMapper());

    private PluginDescriptor entity(String configSchemasJson) {
        PluginDescriptor descriptor = new PluginDescriptor();
        descriptor.id = "acme";
        descriptor.version = "1.0.0";
        descriptor.spiVersion = "1";
        descriptor.providedTypesJson = "[\"ACME_DO\"]";
        descriptor.providedSourceTypesJson = "[]";
        descriptor.providedReaderTypesJson = "[]";
        descriptor.transport = "GRPC";
        descriptor.trusted = true;
        descriptor.configSchemasJson = configSchemasJson;
        return descriptor;
    }

    @Test
    void carriesTheConfigSchemaDeclaredByAnExternalPlugin() {
        String json = "{\"ACME_DO\":{\"fields\":[{\"key\":\"endpoint\",\"type\":\"text\",\"required\":true}]}}";
        RemotePluginDescriptor descriptor = mapper.toRemoteDescriptor(entity(json));

        PluginConfigSchema schema = descriptor.configSchemaFor("ACME_DO");
        assertFalse(schema.isEmpty());
        assertEquals("endpoint", schema.fields().get(0).key());

        // Un tipo sin schema declarado devuelve vacío.
        assertTrue(descriptor.configSchemaFor("OTHER").isEmpty());

        // Y el RemoteTaskProvider lo expone por su type() (lo consume el endpoint config-schema).
        RemoteTaskProvider provider = new RemoteTaskProvider("ACME_DO", descriptor, null, null);
        assertEquals("endpoint", provider.configSchema().fields().get(0).key());
    }

    @Test
    void missingOrInvalidConfigSchemasJsonYieldsEmpty() {
        assertTrue(mapper.toRemoteDescriptor(entity(null)).configSchemaFor("ACME_DO").isEmpty());
        assertTrue(mapper.toRemoteDescriptor(entity("not-json")).configSchemaFor("ACME_DO").isEmpty());
    }
}
