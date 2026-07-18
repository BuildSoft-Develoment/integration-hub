package com.integrationhub.platform.api.response.source;

public record SourceTestResponse(
        boolean success,
        String message,
        // 003: codigo estable de clasificacion del fallo (PATH_NOT_FOUND, NO_MATCH, AUTH_FAILED,
        // CONNECTION_FAILED, GENERIC, OK) para que el frontend muestre un mensaje localizado.
        String code
) {
}
