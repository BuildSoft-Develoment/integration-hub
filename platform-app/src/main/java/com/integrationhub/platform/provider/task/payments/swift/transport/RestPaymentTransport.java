package com.integrationhub.platform.provider.task.payments.swift.transport;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.task.payments.PaymentMessageTransport;
import com.integrationhub.platform.spi.task.payments.TransportResult;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Transporte REST para {@code MT101_PAY}.
 *
 * <p>Envia el {@code rawPayload} ya formateado al gateway del banco como cuerpo HTTP.
 * Aplica idempotencia via header {@code Idempotency-Key} (template), retry con
 * backoff exponencial (configurable), y parsea la respuesta del gateway segun
 * JSON-paths declarados en {@code expectedGatewayResponse}.</p>
 *
 * <p>No reutiliza {@code HttpRequestSupport} de {@code REST_CALL} para mantener este
 * transporte independiente del task type generico; el contrato de SWIFT pay (cuerpo
 * pre-formateado + idempotencia + retry) difiere lo suficiente.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-004, RF-016, T-009
 * @trace ADR-009
 */
@ApplicationScoped
public class RestPaymentTransport implements PaymentMessageTransport {

    public static final String TRANSPORT_ID = "REST";
    private static final int DEFAULT_TIMEOUT_SECONDS = 60;
    private static final int DEFAULT_MAX_RETRIES = 5;
    private static final long DEFAULT_INITIAL_BACKOFF_SECONDS = 30L;
    private static final long DEFAULT_MAX_BACKOFF_SECONDS = 900L;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Inject
    public RestPaymentTransport(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    /** Constructor para tests: permite inyectar un HttpClient custom. */
    RestPaymentTransport(HttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String transport() {
        return TRANSPORT_ID;
    }

    @Override
    public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
        var restCfg = mapValue(configuration.get("rest"));
        if (restCfg.isEmpty()) {
            throw new IllegalArgumentException("MT101_PAY transport=REST requires configuration.rest");
        }
        var urlTemplate = stringValue(restCfg.get("url"), "");
        if (urlTemplate.isBlank()) {
            throw new IllegalArgumentException("MT101_PAY transport=REST requires configuration.rest.url");
        }
        var url = resolveTemplate(urlTemplate, message);
        var method = stringValue(restCfg.get("method"), "POST").toUpperCase();
        var contentType = resolveContentType(restCfg.get("contentType"), message);
        var timeoutSeconds = intValue(restCfg.get("timeoutSeconds"), DEFAULT_TIMEOUT_SECONDS);
        // Idempotency-Key: si la clave NO esta en config, usamos el default ${sendersReference}.
        // Si la clave SI esta pero vacia, el caller pidio explicitamente "no emitir header".
        String idempotencyTemplate;
        if (configuration.containsKey("idempotencyKeyTemplate")) {
            var raw = configuration.get("idempotencyKeyTemplate");
            idempotencyTemplate = raw == null ? "" : String.valueOf(raw);
        } else {
            idempotencyTemplate = "${sendersReference}";
        }
        var idempotencyKey = resolveTemplate(idempotencyTemplate, message);
        var extraHeaders = configuredHeaders(restCfg.get("extraHeaders"), restCfg.get("extraHeadersJson"));
        var retry = retryPolicy(configuration.get("retryPolicy"));
        var expected = mapValue(configuration.get("expectedGatewayResponse"));

        var headers = new LinkedHashMap<String, String>();
        headers.put("Content-Type", contentType);
        if (!idempotencyKey.isBlank()) {
            headers.put("Idempotency-Key", idempotencyKey);
        }
        var authorization = resolveAuthorizationHeader(restCfg, timeoutSeconds);
        if (!authorization.isBlank()) {
            headers.put("Authorization", authorization);
        }
        headers.putAll(extraHeaders);

        return attemptWithRetry(method, url, headers, message.rawPayload(), timeoutSeconds, retry, expected);
    }

    /**
     * Content-Type explicito en config manda. Si esta vacio o es {@code auto},
     * se deriva del formato del mensaje: un FIN enviado como
     * {@code application/json} suele ser rechazado o malinterpretado por el
     * gateway bancario.
     */
    private String resolveContentType(Object configured, Mt101Message message) {
        var value = stringValue(configured, "");
        if (!value.isBlank() && !"auto".equalsIgnoreCase(value)) {
            return value;
        }
        var format = message == null || message.format() == null ? "" : message.format().toUpperCase();
        if (format.startsWith("FIN")) {
            return "text/plain; charset=utf-8";
        }
        if (format.startsWith("XML") || format.startsWith("PAIN001")) {
            return "application/xml";
        }
        return "application/json";
    }

    private String resolveAuthorizationHeader(Map<String, Object> restCfg, int timeoutSeconds) {
        var authType = stringValue(restCfg.get("authType"), "").toLowerCase();
        if (authType.isBlank()) {
            return "";
        }
        if ("bearer".equals(authType)) {
            var token = stringValue(restCfg.get("token"), "");
            return token.isBlank() ? "" : "Bearer " + token;
        }
        if (!"login-request".equals(authType)) {
            throw new IllegalArgumentException("Unsupported MT101_PAY REST authType: " + authType);
        }

        var loginUrl = stringValue(restCfg.get("loginUrl"), "");
        if (loginUrl.isBlank()) {
            throw new IllegalArgumentException("MT101_PAY REST authType=login-request requires rest.loginUrl");
        }
        var loginMethod = stringValue(restCfg.get("loginMethod"), "POST").toUpperCase();
        var loginBody = stringValue(restCfg.get("loginBodyTemplate"), "");
        var tokenPath = stringValue(restCfg.get("tokenPath"), "$.access_token");
        var loginHeaders = configuredHeaders(restCfg.get("loginHeaders"), restCfg.get("loginHeadersJson"));
        var token = requestLoginToken(loginMethod, loginUrl, loginHeaders, loginBody, timeoutSeconds, tokenPath);
        return token.isBlank() ? "" : "Bearer " + token;
    }

    private String requestLoginToken(String method,
                                     String url,
                                     Map<String, String> headers,
                                     String body,
                                     int timeoutSeconds,
                                     String tokenPath) {
        try {
            var builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(timeoutSeconds));
            if (!hasHeader(headers, "Content-Type")) {
                builder.header("Content-Type", "application/x-www-form-urlencoded");
            }
            headers.forEach(builder::header);
            var request = builder
                    .method(method, body.isBlank()
                            ? HttpRequest.BodyPublishers.noBody()
                            : HttpRequest.BodyPublishers.ofString(body))
                    .build();
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("login-request failed with HTTP " + response.statusCode());
            }
            var token = extractJsonPath(response.body(), tokenPath);
            if (token == null || token.isBlank()) {
                throw new IllegalStateException("login-request response did not contain token at " + tokenPath);
            }
            return token;
        } catch (IOException error) {
            throw new IllegalStateException("login-request IO error: " + error.getMessage(), error);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("login-request interrupted: " + error.getMessage(), error);
        }
    }

    private boolean hasHeader(Map<String, String> headers, String headerName) {
        return headers.keySet().stream().anyMatch(key -> key.equalsIgnoreCase(headerName));
    }

    private TransportResult attemptWithRetry(String method,
                                             String url,
                                             Map<String, String> headers,
                                             String body,
                                             int timeoutSeconds,
                                             RetryPolicy retry,
                                             Map<String, Object> expected) {
        var startedAt = System.currentTimeMillis();
        String lastError = null;
        for (int attempt = 1; attempt <= retry.maxRetries() + 1; attempt++) {
            try {
                var request = buildRequest(method, url, headers, body, timeoutSeconds);
                var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                var status = response.statusCode();
                var bodyResponse = response.body() == null ? "" : response.body();

                if (status >= 200 && status < 300) {
                    var gatewayRef = extractField(bodyResponse, expected, "referenceField", "$.gatewayReference");
                    var successFlag = extractField(bodyResponse, expected, "successField", "$.accepted");
                    var declaredOk = successFlag == null || Boolean.parseBoolean(successFlag);
                    if (declaredOk) {
                        return TransportResult.accepted(gatewayRef, attempt, System.currentTimeMillis() - startedAt);
                    }
                    lastError = "gateway returned 2xx but successField is false: "
                            + extractField(bodyResponse, expected, "errorMessageField", "$.error.message");
                    if (!retry.shouldRetry("4xx")) {
                        return TransportResult.rejected(attempt, System.currentTimeMillis() - startedAt, lastError);
                    }
                } else {
                    lastError = "HTTP " + status + ": " + truncate(bodyResponse, 500);
                    var family = status >= 500 ? "5xx" : "4xx";
                    if (!retry.shouldRetry(family)) {
                        return TransportResult.rejected(attempt, System.currentTimeMillis() - startedAt, lastError);
                    }
                }
            } catch (java.net.http.HttpTimeoutException timeoutException) {
                // HttpTimeoutException extiende IOException; va PRIMERO para que el catch
                // generico de IO no lo capture.
                lastError = "timeout: " + timeoutException.getMessage();
                if (!retry.shouldRetry("TIMEOUT")) {
                    return TransportResult.rejected(attempt, System.currentTimeMillis() - startedAt, lastError);
                }
            } catch (IOException ioException) {
                lastError = "IO error: " + ioException.getMessage();
                if (!retry.shouldRetry("CONNECTION_REFUSED")) {
                    return TransportResult.rejected(attempt, System.currentTimeMillis() - startedAt, lastError);
                }
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                return TransportResult.rejected(attempt, System.currentTimeMillis() - startedAt,
                        "interrupted: " + interruptedException.getMessage());
            }
            sleepBackoff(retry, attempt);
        }
        return TransportResult.rejected(retry.maxRetries() + 1, System.currentTimeMillis() - startedAt, lastError);
    }

    private HttpRequest buildRequest(String method, String url, Map<String, String> headers,
                                     String body, int timeoutSeconds) {
        var builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(timeoutSeconds));
        headers.forEach(builder::header);
        var bodyPublisher = body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body);
        return builder.method(method, bodyPublisher).build();
    }

    private void sleepBackoff(RetryPolicy retry, int attempt) {
        if (attempt > retry.maxRetries()) {
            return;
        }
        var seconds = retry.backoffSeconds(attempt);
        try {
            Thread.sleep(seconds * 1000L);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    private String extractField(String body, Map<String, Object> expected, String key, String defaultPath) {
        if (body == null || body.isBlank()) {
            return null;
        }
        var path = stringValue(expected.get(key), defaultPath);
        if (path == null || path.isBlank() || !path.startsWith("$.")) {
            return null;
        }
        try {
            var node = objectMapper.readTree(body);
            return navigate(node, path.substring(2));
        } catch (IOException error) {
            return null;
        }
    }

    private String extractJsonPath(String body, String path) {
        if (body == null || body.isBlank() || path == null || !path.startsWith("$.")) {
            return null;
        }
        try {
            var node = objectMapper.readTree(body);
            return navigate(node, path.substring(2));
        } catch (IOException error) {
            return null;
        }
    }

    private String navigate(JsonNode node, String path) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        var dot = path.indexOf('.');
        var head = dot < 0 ? path : path.substring(0, dot);
        var tail = dot < 0 ? null : path.substring(dot + 1);
        var next = node.path(head);
        return tail == null ? (next.isValueNode() ? next.asText() : null) : navigate(next, tail);
    }

    private String resolveTemplate(String template, Mt101Message message) {
        if (template == null || template.isBlank()) {
            return template;
        }
        var sendersReference = message.sequenceA() != null ? message.sequenceA().sendersReference() : "";
        var uetr = message.envelope() != null ? message.envelope().uetr() : "";
        return template
                .replace("${sendersReference}", sendersReference == null ? "" : sendersReference)
                .replace("${uetr}", uetr == null ? "" : uetr);
    }

    @SuppressWarnings("unchecked")
    private RetryPolicy retryPolicy(Object raw) {
        var cfg = mapValue(raw);
        var maxRetries = intValue(cfg.get("maxRetries"), DEFAULT_MAX_RETRIES);
        var strategy = stringValue(cfg.get("backoffStrategy"), "exponential");
        var initial = longValue(cfg.get("initialBackoffSeconds"), DEFAULT_INITIAL_BACKOFF_SECONDS);
        var max = longValue(cfg.get("maxBackoffSeconds"), DEFAULT_MAX_BACKOFF_SECONDS);
        var retryOnRaw = cfg.get("retryOn");
        List<String> retryOn = retryOnRaw instanceof List<?> rawList
                ? rawList.stream().map(String::valueOf).map(String::toUpperCase).toList()
                : List.of("TIMEOUT", "5XX", "CONNECTION_REFUSED");
        return new RetryPolicy(maxRetries, strategy, initial, max, retryOn);
    }

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max) + "...";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Object raw) {
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> stringMap(Object raw) {
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, String>();
        rawMap.forEach((key, value) -> result.put(String.valueOf(key), value == null ? "" : String.valueOf(value)));
        return result;
    }

    private Map<String, String> configuredHeaders(Object rawHeaders, Object rawHeadersJson) {
        var direct = stringMap(rawHeaders);
        if (!direct.isEmpty()) {
            return direct;
        }
        if (!(rawHeadersJson instanceof String text) || text.isBlank()) {
            return Map.of();
        }
        try {
            var node = objectMapper.readTree(text);
            if (!node.isObject()) {
                return Map.of();
            }
            var result = new LinkedHashMap<String, String>();
            node.fields().forEachRemaining(entry -> result.put(entry.getKey(), entry.getValue().asText()));
            return result;
        } catch (IOException error) {
            throw new IllegalArgumentException("Invalid JSON in MT101_PAY REST headersJson", error);
        }
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw);
        return value.isBlank() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
    }

    private long longValue(Object raw, long defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Long.parseLong(String.valueOf(raw));
    }

    /** Politica de reintentos resuelta. */
    record RetryPolicy(int maxRetries, String backoffStrategy, long initialBackoffSeconds,
                       long maxBackoffSeconds, List<String> retryOnFamilies) {

        boolean shouldRetry(String family) {
            if (retryOnFamilies == null || retryOnFamilies.isEmpty()) {
                return false;
            }
            var upper = family.toUpperCase();
            for (var entry : retryOnFamilies) {
                if (entry.equalsIgnoreCase(upper) || entry.equalsIgnoreCase(family)) {
                    return true;
                }
            }
            return false;
        }

        long backoffSeconds(int attempt) {
            if ("constant".equalsIgnoreCase(backoffStrategy)) {
                return Math.min(initialBackoffSeconds, maxBackoffSeconds);
            }
            // exponential por defecto: initial * 2^(attempt-1).
            var base = initialBackoffSeconds * (1L << Math.max(0, attempt - 1));
            return Math.min(base, maxBackoffSeconds);
        }
    }
}
