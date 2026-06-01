package com.integrationhub.platform.api.mapper.connection;

import com.integrationhub.platform.api.response.connection.ConnectionDefinitionResponse;
import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.entity.ConnectionDefinition;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConnectionApiMapperTest {

    private final ConnectionApiMapper mapper = new ConnectionApiMapper();

    @Test
    void toResponseMapsAllFields() {
        ConnectionDefinition definition = new ConnectionDefinition();
        definition.id = 7L;
        definition.name = "dwh-oracle";
        definition.connectionType = ConnectionType.ORACLE;
        definition.active = true;
        definition.configurationJson = "{\"url\":\"jdbc:oracle:thin:@db:1521/orcl\"}";

        ConnectionDefinitionResponse response = mapper.toResponse(definition);

        assertEquals(7L, response.id());
        assertEquals("dwh-oracle", response.name());
        assertEquals(ConnectionType.ORACLE, response.connectionType());
        assertTrue(response.active());
        assertEquals("{\"url\":\"jdbc:oracle:thin:@db:1521/orcl\"}", response.configurationJson());
    }

    @Test
    void toResponsePreservesInactiveAndType() {
        ConnectionDefinition definition = new ConnectionDefinition();
        definition.id = 99L;
        definition.name = "mongo-eventos";
        definition.connectionType = ConnectionType.MONGODB;
        definition.active = false;
        definition.configurationJson = "{}";

        ConnectionDefinitionResponse response = mapper.toResponse(definition);

        assertEquals(ConnectionType.MONGODB, response.connectionType());
        assertEquals(false, response.active());
        assertEquals("mongo-eventos", response.name());
    }
}
