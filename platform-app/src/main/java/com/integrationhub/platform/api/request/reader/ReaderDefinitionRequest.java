package com.integrationhub.platform.api.request.reader;

public record ReaderDefinitionRequest(
        String name,
        String readerType,
        boolean active,
        String configurationJson
) {
}
