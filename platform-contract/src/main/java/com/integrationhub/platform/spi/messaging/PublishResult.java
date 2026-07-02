package com.integrationhub.platform.spi.messaging;

/**
 * Resultado de publicar un {@link OutboundMessage} en un broker.
 *
 * @param accepted  true si el broker confirmo la recepcion
 * @param reference referencia del broker (offset/messageId) si aplica; puede ser null
 * @param error     causa del fallo si {@code accepted == false}; null en exito
 */
public record PublishResult(boolean accepted, String reference, String error) {

    public static PublishResult ok(String reference) {
        return new PublishResult(true, reference, null);
    }

    public static PublishResult failed(String error) {
        return new PublishResult(false, null, error);
    }
}
