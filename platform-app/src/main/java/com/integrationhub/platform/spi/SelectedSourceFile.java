package com.integrationhub.platform.spi;

import java.time.Instant;

public record SelectedSourceFile(
        String name,
        String location,
        String mediaType,
        Long size,
        Instant lastModified
) {
}
