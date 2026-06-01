package com.integrationhub.platform.api.mapper.source;

import com.integrationhub.platform.domain.SourceType;
import com.integrationhub.platform.entity.SourceDefinition;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers RF-001 (reingenieria: prueba que cubre el/los RF en produccion)
class SourceApiMapperTest {

    private final SourceApiMapper mapper = new SourceApiMapper();

    @Test
    void toResponseMapsAllFields() {
        var definition = new SourceDefinition();
        definition.id = 3L;
        definition.name = "dropzone-clientes";
        definition.sourceType = SourceType.SFTP;
        definition.active = true;
        definition.configurationJson = "{\"path\":\"/in\"}";

        var response = mapper.toResponse(definition);

        assertEquals(3L, response.id());
        assertEquals("dropzone-clientes", response.name());
        assertEquals(SourceType.SFTP, response.sourceType());
        assertTrue(response.active());
        assertEquals("{\"path\":\"/in\"}", response.configurationJson());
    }

    @Test
    void toResponsePreservesTypeAndInactive() {
        var definition = new SourceDefinition();
        definition.id = 10L;
        definition.name = "api-externa";
        definition.sourceType = SourceType.REST;
        definition.active = false;
        definition.configurationJson = "{}";

        var response = mapper.toResponse(definition);

        assertEquals(SourceType.REST, response.sourceType());
        assertEquals(false, response.active());
    }
}
