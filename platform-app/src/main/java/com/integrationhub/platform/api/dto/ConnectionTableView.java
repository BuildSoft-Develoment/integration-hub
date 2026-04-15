package com.integrationhub.platform.api.dto;

public record ConnectionTableView(
        String schema,
        String name,
        String qualifiedName
) {
}

