package com.integrationhub.platform.api.request.reader;

import com.integrationhub.platform.domain.ReaderType;

public record ReaderDefinitionRequest(
        String name,
        ReaderType readerType,
        boolean active,
        String configurationJson
) {
}
