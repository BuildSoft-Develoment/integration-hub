package com.integrationhub.platform.api.mapper.reader;

import com.integrationhub.platform.entity.ReaderDefinition;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers spec 002-catalogo-readers RF-001 (representacion del reader por formato, con su estado)
class ReaderApiMapperTest {

    private final ReaderApiMapper mapper = new ReaderApiMapper();

    @Test
    void toResponseMapsAllFields() {
        var definition = new ReaderDefinition();
        definition.id = 5L;
        definition.name = "csv-clientes";
        definition.readerType = "CSV";
        definition.active = true;
        definition.configurationJson = "{\"delimiter\":\",\"}";

        var response = mapper.toResponse(definition);

        assertEquals(5L, response.id());
        assertEquals("csv-clientes", response.name());
        assertEquals("CSV", response.readerType());
        assertTrue(response.active());
        assertEquals("{\"delimiter\":\",\"}", response.configurationJson());
    }

    @Test
    void toResponsePreservesTypeAndInactive() {
        var definition = new ReaderDefinition();
        definition.id = 8L;
        definition.name = "xlsx-inventario";
        definition.readerType = "XLSX";
        definition.active = false;
        definition.configurationJson = "{}";

        var response = mapper.toResponse(definition);

        assertEquals("XLSX", response.readerType());
        assertEquals(false, response.active());
    }
}
