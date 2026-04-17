package com.integrationhub.platform.api.mapper.connection;

import com.integrationhub.platform.api.response.connection.ConnectionDefinitionResponse;
import com.integrationhub.platform.entity.ConnectionDefinition;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ConnectionApiMapper {

    public ConnectionDefinitionResponse toResponse(ConnectionDefinition definition) {
        return new ConnectionDefinitionResponse(
                definition.id,
                definition.name,
                definition.connectionType,
                definition.active,
                definition.configurationJson
        );
    }
}
