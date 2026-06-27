package com.integrationhub.platform.provider.task.http;

import jakarta.enterprise.context.ApplicationScoped;

import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.faulttolerance.Timeout;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.temporal.ChronoUnit;

/**
 * Bean CDI que ejecuta peticiones HTTP salientes con politicas de resiliencia
 * (timeout, reintentos con backoff y circuit breaker).
 *
 * <p>Aisla la red externa (REST_CALL, webhooks de notificacion) del hilo de
 * ejecucion del proceso: cuando un destino empieza a fallar de forma sostenida el
 * breaker abre y corta de inmediato, en lugar de dejar peticiones colgadas que
 * agoten el pool de ejecucion. Ver hallazgo de resiliencia en la revision de
 * arquitectura (sin tolerancia a fallos en proveedores externos).</p>
 *
 * <p>Las anotaciones MicroProfile Fault Tolerance solo se aplican sobre
 * invocaciones a traves del proxy CDI; por eso el envio se aisla en este bean y
 * no en un metodo privado del provider (la auto-invocacion no se intercepta).</p>
 */
@ApplicationScoped
public class ResilientHttpSender {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    /**
     * Envia la peticion con timeout, reintentos sobre fallos de E/S y un circuit
     * breaker compartido. No interpreta el codigo de estado: el epilogo (2xx vs
     * error de negocio) queda en cada provider.
     *
     * @throws IOException          fallo de red tras agotar reintentos (alimenta el breaker)
     * @throws InterruptedException el hilo fue interrumpido (no se reintenta)
     */
    @Timeout(value = 35, unit = ChronoUnit.SECONDS)
    @Retry(maxRetries = 2, delay = 250, jitter = 150, retryOn = IOException.class, abortOn = InterruptedException.class)
    @CircuitBreaker(requestVolumeThreshold = 8, failureRatio = 0.5, delay = 10, delayUnit = ChronoUnit.SECONDS, successThreshold = 2)
    public HttpResponse<String> send(HttpRequest request) throws IOException, InterruptedException {
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        throwIfServerError(response.statusCode());
        return response;
    }

    /**
     * Promueve un 5xx a fallo de infraestructura para que el circuit breaker lo
     * contabilice. Los 4xx no se promueven: son error de cliente y los interpreta
     * el provider. No se reintenta (ver {@link RemoteServerException}).
     */
    static void throwIfServerError(int statusCode) {
        if (statusCode >= 500) {
            throw new RemoteServerException(statusCode);
        }
    }
}
