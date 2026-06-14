package com.integrationhub.platform.spi.task.payments;

/**
 * Resultado del despacho de un mensaje al gateway via {@link PaymentMessageTransport}.
 *
 * @param accepted true si el gateway acepto el mensaje (200..299 + flag de exito).
 * @param gatewayReference identificador devuelto por el gateway, o {@code null}.
 * @param attempts cantidad de intentos efectuados (1 si no hubo retry).
 * @param durationMs duracion total del intento (incluyendo retries).
 * @param lastError mensaje del ultimo error, {@code null} si acepto a la primera.
 *
 * @trace spec 008-mensajeria-pagos RF-004, T-009
 * @trace ADR-009
 */
public record TransportResult(
        boolean accepted,
        String gatewayReference,
        int attempts,
        long durationMs,
        String lastError
) {

    public static TransportResult accepted(String gatewayReference, int attempts, long durationMs) {
        return new TransportResult(true, gatewayReference, attempts, durationMs, null);
    }

    public static TransportResult rejected(int attempts, long durationMs, String lastError) {
        return new TransportResult(false, null, attempts, durationMs, lastError);
    }
}
