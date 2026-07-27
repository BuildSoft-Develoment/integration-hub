package com.integrationhub.platform.api.response.payments;

/** Resultado de una transicion de reproceso por estado de fragmentos MT101. */
public record Mt101ReprocessResponse(
        String fragmentSetId,
        String fromStatus,
        String toStatus,
        int affected
) {
}
