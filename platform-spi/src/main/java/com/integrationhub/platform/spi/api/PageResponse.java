package com.integrationhub.platform.spi.api;

import java.util.List;

public record PageResponse<T>(
        long total,
        List<T> items
) {
}
