package com.integrationhub.platform.api.mapper.reader;

import com.integrationhub.platform.api.response.reader.ReaderDefinitionResponse;
import com.integrationhub.platform.entity.ReaderDefinition;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ReaderApiMapper {

    public ReaderDefinitionResponse toResponse(ReaderDefinition definition) {
        return new ReaderDefinitionResponse(
                definition.id,
                definition.name,
                definition.readerType,
                definition.active,
                definition.configurationJson
        );
    }
}
