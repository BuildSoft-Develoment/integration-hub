package com.integrationhub.platform.spi.source;

import java.time.Instant;

public record SelectedSourceFile(
        String name,
        String location,
        String mediaType,
        Long size,
        Instant lastModified
) {
}
