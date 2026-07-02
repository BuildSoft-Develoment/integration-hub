package com.integrationhub.platform.provider.task.http;

/**
 * Sennala un fallo del servidor remoto (HTTP 5xx) en una llamada saliente.
 *
 * <p>La lanza {@link ResilientHttpSender} para que el circuit breaker contabilice
 * el 5xx como fallo de infraestructura. Por contrato de {@code @Retry}
 * ({@code retryOn = IOException}) NO se reintenta: reintentar un 5xx en un POST no
 * idempotente podria duplicar el efecto. Los 4xx no la lanzan: son error de cliente
 * y los interpreta cada provider sin alimentar el breaker.</p>
 */
public class RemoteServerException extends RuntimeException {

    private final int statusCode;

    public RemoteServerException(int statusCode) {
        super("Remote server returned status " + statusCode);
        this.statusCode = statusCode;
    }

    public int statusCode() {
        return statusCode;
    }
}
