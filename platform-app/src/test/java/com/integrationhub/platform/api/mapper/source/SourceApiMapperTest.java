package com.integrationhub.platform.api.mapper.source;

import com.integrationhub.platform.entity.SourceDefinition;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers spec 001-catalogo-fuentes RF-001 (representacion de la fuente por tipo, con su estado)
class SourceApiMapperTest {

    private final SourceApiMapper mapper = new SourceApiMapper();

    @Test
    void toResponseMapsAllFields() {
        var definition = new SourceDefinition();
        definition.id = 3L;
        definition.name = "dropzone-clientes";
        definition.sourceType = "SFTP";
        definition.active = true;
        definition.configurationJson = "{\"path\":\"/in\"}";

        var response = mapper.toResponse(definition);

        assertEquals(3L, response.id());
        assertEquals("dropzone-clientes", response.name());
        assertEquals("SFTP", response.sourceType());
        assertTrue(response.active());
        assertEquals("{\"path\":\"/in\"}", response.configurationJson());
    }

    @Test
    void toResponsePreservesTypeAndInactive() {
        var definition = new SourceDefinition();
        definition.id = 10L;
        definition.name = "api-externa";
        definition.sourceType = "REST";
        definition.active = false;
        definition.configurationJson = "{}";

        var response = mapper.toResponse(definition);

        assertEquals("REST", response.sourceType());
        assertEquals(false, response.active());
    }
}
