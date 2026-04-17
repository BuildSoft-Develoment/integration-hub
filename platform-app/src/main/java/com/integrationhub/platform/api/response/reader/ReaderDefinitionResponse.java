package com.integrationhub.platform.api.response.reader;

import com.integrationhub.platform.domain.ReaderType;

public record ReaderDefinitionResponse(
        Long id,
        String name,
        ReaderType readerType,
        boolean active,
        String configurationJson
) {
}
