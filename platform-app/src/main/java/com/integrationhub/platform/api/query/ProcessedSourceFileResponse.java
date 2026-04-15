package com.integrationhub.platform.api.query;

import java.time.Instant;

public record ProcessedSourceFileResponse(
        Long id,
        String fileName,
        String filePath,
        String mediaType,
        Long fileSize,
        Instant lastModified,
        String status,
        Integer recordCount,
        Integer skippedCount,
        Integer writtenCount,
        String errorMessage
) {
}
