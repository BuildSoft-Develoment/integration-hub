package com.integrationhub.platform.api.mapper.reader;

import com.integrationhub.platform.domain.ReaderType;
import com.integrationhub.platform.entity.ReaderDefinition;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers RF-001 (reingenieria: prueba que cubre el/los RF en produccion)
class ReaderApiMapperTest {

    private final ReaderApiMapper mapper = new ReaderApiMapper();

    @Test
    void toResponseMapsAllFields() {
        var definition = new ReaderDefinition();
        definition.id = 5L;
        definition.name = "csv-clientes";
        definition.readerType = ReaderType.CSV;
        definition.active = true;
        definition.configurationJson = "{\"delimiter\":\",\"}";

        var response = mapper.toResponse(definition);

        assertEquals(5L, response.id());
        assertEquals("csv-clientes", response.name());
        assertEquals(ReaderType.CSV, response.readerType());
        assertTrue(response.active());
        assertEquals("{\"delimiter\":\",\"}", response.configurationJson());
    }

    @Test
    void toResponsePreservesTypeAndInactive() {
        var definition = new ReaderDefinition();
        definition.id = 8L;
        definition.name = "xlsx-inventario";
        definition.readerType = ReaderType.XLSX;
        definition.active = false;
        definition.configurationJson = "{}";

        var response = mapper.toResponse(definition);

        assertEquals(ReaderType.XLSX, response.readerType());
        assertEquals(false, response.active());
    }
}
