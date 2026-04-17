package com.integrationhub.platform.api.mapper.source;

import com.integrationhub.platform.api.response.source.SourceDefinitionResponse;
import com.integrationhub.platform.entity.SourceDefinition;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SourceApiMapper {

    public SourceDefinitionResponse toResponse(SourceDefinition definition) {
        return new SourceDefinitionResponse(
                definition.id,
                definition.name,
                definition.sourceType,
                definition.active,
                definition.configurationJson
        );
    }
}
