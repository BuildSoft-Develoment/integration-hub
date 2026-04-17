package com.integrationhub.platform.api.response.common;

import java.util.List;

public record PageResponse<T>(
        long total,
        List<T> items
) {
}
