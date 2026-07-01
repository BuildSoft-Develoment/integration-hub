package com.integrationhub.platform.api.response.reader;

public record ReaderDefinitionResponse(
        Long id,
        String name,
        String readerType,
        boolean active,
        String configurationJson
) {
}
