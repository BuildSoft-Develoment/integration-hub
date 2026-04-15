package com.integrationhub.platform.api.query;

import java.util.List;

public record QueryPageResponse<T>(
        long total,
        List<T> items
) {
}
