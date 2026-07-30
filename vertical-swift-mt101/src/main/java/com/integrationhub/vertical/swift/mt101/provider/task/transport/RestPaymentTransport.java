package com.integrationhub.vertical.swift.mt101.provider.task.transport;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.vertical.swift.mt101.provider.Mt101PaymentCorrelation;
import com.integrationhub.vertical.swift.mt101.spi.PaymentMessageTransport;
import com.integrationhub.vertical.swift.mt101.spi.PreDispatchTransportException;
import com.integrationhub.vertical.swift.mt101.spi.TransportResult;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Set;
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

    /** Literales que, en el campo declarado, significan que el banco acepto. Configurable por si no usa booleanos. */
    private static final Set<String> DEFAULT_SUCCESS_VALUES = Set.of("true");
    /** Literales que significan un rechazo REAL del banco (terminal de negocio, no incertidumbre). */
    private static final Set<String> DEFAULT_REJECTED_VALUES = Set.of("false");

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    /**
     * ADR-010 / politica fail-loud. Con {@code true}, un MT101_PAY REST que no declare COMO se prueba la
     * aceptacion se rechaza ANTES de enviar nada. Default {@code false} = modo migracion, para no romper
     * definiciones ya publicadas ni planes correctivos congelados; mismo patron por ambiente que
     * {@code mt101.pay.direct-list.enabled} y {@code mt101.pay.route-sink.strict}.
     */
    private final boolean requireGatewayProof;

    @Inject
    public RestPaymentTransport(ObjectMapper objectMapper,
                                @ConfigProperty(name = "mt101.pay.require-gateway-proof", defaultValue = "false")
                                boolean requireGatewayProof) {
        this.objectMapper = objectMapper;
        this.requireGatewayProof = requireGatewayProof;
        this.httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    /** Compat: modo migracion (no exige prueba declarada). */
    public RestPaymentTransport(ObjectMapper objectMapper) {
        this(objectMapper, false);
    }

    /** Constructor para tests: permite inyectar un HttpClient custom. */
    RestPaymentTransport(HttpClient httpClient, ObjectMapper objectMapper) {
        this(httpClient, objectMapper, false);
    }

    RestPaymentTransport(HttpClient httpClient, ObjectMapper objectMapper, boolean requireGatewayProof) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.requireGatewayProof = requireGatewayProof;
    }

    @Override
    public String transport() {
        return TRANSPORT_ID;
    }

    @Override
    public TransportResult send(Mt101Message message, Map<String, Object> configuration) {
        var restCfg = mapValue(configuration.get("rest"));
        if (restCfg.isEmpty()) {
            throw new PreDispatchTransportException("MT101_PAY transport=REST requires configuration.rest");
        }
        var urlTemplate = stringValue(restCfg.get("url"), "");
        if (urlTemplate.isBlank()) {
            throw new PreDispatchTransportException("MT101_PAY transport=REST requires configuration.rest.url");
        }
        var url = resolveTemplate(urlTemplate, message);
        var method = stringValue(restCfg.get("method"), "POST").toUpperCase();
        var contentType = resolveContentType(restCfg.get("contentType"), message);
        var timeoutSeconds = intValue(restCfg.get("timeoutSeconds"), DEFAULT_TIMEOUT_SECONDS);
        // Idempotency-Key: si la clave NO esta en config, usamos el default ${sendersReference}.
        // Si la clave SI esta pero vacia, el caller pidio explicitamente "no emitir header".
        var idempotencyKey = Mt101PaymentCorrelation.restIdempotencyKey(configuration, message);
        var extraHeaders = configuredHeaders(restCfg.get("extraHeaders"), restCfg.get("extraHeadersJson"));
        var retry = retryPolicy(configuration.get("retryPolicy"));
        var expected = mapValue(configuration.get("expectedGatewayResponse"));
        // Se resuelve ANTES de resolveAuthorizationHeader, que puede hacer I/O de login: un problema de
        // configuracion tiene que fallar cuando todavia es seguro afirmar que no salio nada al banco.
        var proof = resolveAcceptanceProof(expected);

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

        return attemptWithRetry(method, url, headers, message.rawPayload(), timeoutSeconds, retry, expected, proof);
    }

    /** Como se prueba que el banco acepto. Se resuelve una vez por envio, antes de tocar la red. */
    private record AcceptanceProof(String successPath, boolean acceptOn2xx, boolean tolerateUnreadable,
                                   Set<String> successValues, Set<String> rejectedValues) {
    }

    private enum ProofOutcome { ACCEPTED, REJECTED, UNCERTAIN }

    private record ProofVerdict(ProofOutcome outcome, String detail) {
    }

    /**
     * Exige que el MT101_PAY REST declare COMO se prueba la aceptacion: o un campo del cuerpo
     * ({@code expectedGatewayResponse.successField}) o la politica explicita de que cualquier 2xx basta
     * ({@code acceptOn2xx=true}). Exactamente una de las dos.
     *
     * <p>Los fallos de aqui son de CONFIGURACION, y por eso son {@link PreDispatchTransportException}: el
     * provider los mapea a {@code transportFailure} -> {@code INVALIDATED}, o sea que el fragmento vuelve a
     * ser pagable en cuanto se corrija la config. Un problema de configuracion no debe convertirse en dinero
     * en estado ambiguo: para desatascar un {@code UNCERTAIN} hace falta una tarea MT101_STATUS, y podria no
     * haberla.</p>
     */
    private AcceptanceProof resolveAcceptanceProof(Map<String, Object> expected) {
        var rawField = expected.get("successField");
        var declaredField = rawField != null && !String.valueOf(rawField).isBlank();
        // Boolean.parseBoolean convierte cualquier cosa que no sea "true" en false, asi que un acceptOn2xx:"yes"
        // se leeria como "no declarado" y aterrizaria en la rama mas permisiva. Un typo del operador no puede
        // decidir dinero en la direccion permisiva: se exige el literal.
        var rawAcceptOn2xx = expected.get("acceptOn2xx");
        var acceptOn2xxText = rawAcceptOn2xx == null ? "" : String.valueOf(rawAcceptOn2xx).trim().toLowerCase(Locale.ROOT);
        if (!acceptOn2xxText.isEmpty() && !"true".equals(acceptOn2xxText) && !"false".equals(acceptOn2xxText)) {
            throw new PreDispatchTransportException("MT101_PAY expectedGatewayResponse.acceptOn2xx must be true or "
                    + "false (got: \"" + rawAcceptOn2xx + "\"). Nothing was sent.");
        }
        var acceptOn2xx = "true".equals(acceptOn2xxText);
        if (declaredField && acceptOn2xx) {
            throw new PreDispatchTransportException("MT101_PAY expectedGatewayResponse declares BOTH successField "
                    + "and acceptOn2xx=true; declare exactly one. Nothing was sent.");
        }
        if (declaredField) {
            var path = String.valueOf(rawField).trim();
            if (!path.startsWith("$.") || path.length() <= 2) {
                // Antes, un path mal escrito hacia que extractField devolviera null SIEMPRE y, con la regla
                // "ausente = aceptado", el gateway dejaba de poder rechazar un solo pago. Un typo apagaba la
                // comprobacion entera en silencio. Ahora no sale nada al banco hasta corregirlo.
                throw new PreDispatchTransportException("MT101_PAY expectedGatewayResponse.successField must be a "
                        + "JSON path starting with \"$.\" naming a field (got: \"" + path + "\"). A malformed path "
                        + "silently disabled the acceptance check and accepted every payment. Nothing was sent.");
            }
            var successValues = literalSet(expected.get("successValues"), DEFAULT_SUCCESS_VALUES);
            var rejectedValues = literalSet(expected.get("rejectedValues"), DEFAULT_REJECTED_VALUES);
            // successValues se consulta antes que rejectedValues, asi que un literal declarado en AMBAS listas
            // se resolveria en silencio hacia ACEPTADO. Es una ambiguedad de configuracion decidiendo dinero en
            // la direccion permisiva: se rechaza en el canal de configuracion, como el resto de este metodo.
            if (!java.util.Collections.disjoint(successValues, rejectedValues)) {
                throw new PreDispatchTransportException("MT101_PAY expectedGatewayResponse declares the same literal "
                        + "in successValues and rejectedValues; a value cannot mean accepted and rejected at once. "
                        + "Nothing was sent.");
            }
            return new AcceptanceProof(path, false, false, successValues, rejectedValues);
        }
        if (acceptOn2xx) {
            return new AcceptanceProof(null, true, false, Set.of(), Set.of());
        }
        if (requireGatewayProof) {
            throw new PreDispatchTransportException("MT101_PAY transport=REST declares no acceptance proof: set "
                    + "expectedGatewayResponse.successField, or expectedGatewayResponse.acceptOn2xx=true if the "
                    + "gateway really proves nothing beyond the HTTP status. Nothing was sent.");
        }
        // Modo migracion (gate apagado): se conserva el comportamiento historico -campo $.accepted por defecto y
        // "ilegible = aceptado"- para no romper definiciones ya publicadas ni planes correctivos congelados. Es un
        // modo por ambiente, no un fallback: con el gate encendido esta rama no existe.
        return new AcceptanceProof("$.accepted", false, true,
                DEFAULT_SUCCESS_VALUES, DEFAULT_REJECTED_VALUES);
    }

    /**
     * Evalua el campo declarado distinguiendo las causas que antes colapsaban todas en {@code null} -y con ello
     * en "aceptado"-. Solo un literal declarado como rechazo es un rechazo del banco; lo demas es incierto,
     * porque el 2xx ya salio y el dinero pudo moverse.
     */
    private ProofVerdict evaluateProof(String body, AcceptanceProof proof) {
        var unreadable = proof.tolerateUnreadable() ? ProofOutcome.ACCEPTED : ProofOutcome.UNCERTAIN;
        if (body == null || body.isBlank()) {
            return new ProofVerdict(unreadable, "empty response body");
        }
        JsonNode root;
        try {
            root = objectMapper.readTree(body);
        } catch (IOException error) {
            return new ProofVerdict(unreadable, "response body is not JSON");
        }
        var node = locate(root, proof.successPath().substring(2));
        if (node == null || node.isMissingNode()) {
            return new ProofVerdict(unreadable, "field " + proof.successPath() + " is absent");
        }
        if (!node.isValueNode()) {
            return new ProofVerdict(unreadable, "field " + proof.successPath() + " is a container, not a value");
        }
        if (node.isNull()) {
            // Antes: NullNode.asText() = "null" -> parseBoolean = false -> RECHAZO TERMINAL del banco, con
            // sincronizacion del archive incluida. Un null explicito no es un rechazo: es ausencia de respuesta.
            return new ProofVerdict(ProofOutcome.UNCERTAIN, "field " + proof.successPath() + " is explicitly null");
        }
        var literal = node.asText().trim().toLowerCase(Locale.ROOT);
        if (proof.successValues().contains(literal)) {
            return new ProofVerdict(ProofOutcome.ACCEPTED, literal);
        }
        if (proof.rejectedValues().contains(literal)) {
            return new ProofVerdict(ProofOutcome.REJECTED, literal);
        }
        // Antes: "OK", "YES" o 1 -> parseBoolean = false -> RECHAZO TERMINAL sobre dinero que muy probablemente
        // salio. Un valor que no se declaro es desconocido, no un "no".
        return new ProofVerdict(ProofOutcome.UNCERTAIN, "field " + proof.successPath() + " has an undeclared value \""
                + node.asText() + "\" (declare it in expectedGatewayResponse.successValues or rejectedValues)");
    }

    /** Navegacion que DISTINGUE ausente, null y contenedor, cosa que {@link #navigate} colapsa en null. */
    private JsonNode locate(JsonNode node, String path) {
        if (node == null) {
            return null;
        }
        var dot = path.indexOf('.');
        var next = node.path(dot < 0 ? path : path.substring(0, dot));
        if (dot < 0) {
            return next;
        }
        return next.isMissingNode() || next.isNull() || !next.isObject() ? null : locate(next, path.substring(dot + 1));
    }

    private Set<String> literalSet(Object raw, Set<String> defaults) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return defaults;
        }
        return rawList.stream()
                .map(String::valueOf)
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
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
            throw new PreDispatchTransportException("Unsupported MT101_PAY REST authType: " + authType);
        }

        var loginUrl = stringValue(restCfg.get("loginUrl"), "");
        if (loginUrl.isBlank()) {
            throw new PreDispatchTransportException("MT101_PAY REST authType=login-request requires rest.loginUrl");
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
                                             Map<String, Object> expected,
                                             AcceptanceProof proof) {
        var startedAt = System.currentTimeMillis();
        String lastError = null;
        // STICKY: si CUALQUIER intento quedo INCIERTO (la peticion salio y el gateway pudo recibirla), el resultado
        // final NUNCA baja de INCIERTO -> nunca se degrada a re-solicitable (transportFailure) ni a rechazo reusable,
        // ni siquiera si un intento POSTERIOR falla pre-envio (connection refused). "Si alguna vez pudimos enviar, no
        // lo re-pagamos a ciegas" (evita doble pago via la re-solicitud automatica de tanda-4).
        boolean anyUncertain = false;
        String uncertainError = null;
        // D.2: marca si el ultimo fallo fue de TRANSPORTE/conexion ANTES de enviar (el gateway no recibio nada) ->
        // re-solicitable (transportFailure), distinto de un rechazo de negocio (4xx). Solo aplica si NUNCA hubo incierto.
        boolean lastRetriable = false;
        for (int attempt = 1; attempt <= retry.maxRetries() + 1; attempt++) {
            try {
                var request = buildRequest(method, url, headers, body, timeoutSeconds);
                var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                var status = response.statusCode();
                var bodyResponse = response.body() == null ? "" : response.body();

                if (status >= 200 && status < 300) {
                    var gatewayRef = extractField(bodyResponse, expected, "referenceField", "$.gatewayReference");
                    var verdict = proof.acceptOn2xx()
                            ? new ProofVerdict(ProofOutcome.ACCEPTED, "acceptOn2xx")
                            : evaluateProof(bodyResponse, proof);
                    if (verdict.outcome() == ProofOutcome.ACCEPTED) {
                        return TransportResult.accepted(gatewayRef, attempt, System.currentTimeMillis() - startedAt);
                    }
                    if (verdict.outcome() == ProofOutcome.UNCERTAIN) {
                        // El 2xx ya salio: el banco pudo haber ejecutado la orden. No se degrada a rechazo, que es
                        // re-solicitable, porque eso abriria la puerta al doble pago. Se resuelve por STATUS.
                        uncertainError = "gateway returned 2xx but the declared acceptance proof is not conclusive: "
                                + verdict.detail();
                        // Se conserva la referencia que el banco acaba de darnos: el auto-cierre de un UNCERTAIN
                        // correlaciona solo por ${sendersReference}, asi que tirar el acuse aqui deja el caso
                        // resoluble unicamente por referencia. Es la unica evidencia de identidad que tenemos.
                        return TransportResult.uncertain(gatewayRef, attempt,
                                System.currentTimeMillis() - startedAt, uncertainError);
                    }
                    lastError = "gateway returned 2xx and the declared proof says rejected (" + verdict.detail()
                            + "): " + extractField(bodyResponse, expected, "errorMessageField", "$.error.message");
                    if (!retry.shouldRetry("4xx")) {
                        return anyUncertain
                                ? TransportResult.uncertain(attempt, System.currentTimeMillis() - startedAt, uncertainError)
                                : TransportResult.rejected(attempt, System.currentTimeMillis() - startedAt, lastError);
                    }
                } else {
                    lastError = "HTTP " + status + ": " + truncate(bodyResponse, 500);
                    var family = status >= 500 ? "5xx" : "4xx";
                    if (!retry.shouldRetry(family)) {
                        return anyUncertain
                                ? TransportResult.uncertain(attempt, System.currentTimeMillis() - startedAt, uncertainError)
                                : TransportResult.rejected(attempt, System.currentTimeMillis() - startedAt, lastError);
                    }
                }
            } catch (java.net.http.HttpTimeoutException timeoutException) {
                // HttpTimeoutException extiende IOException; va PRIMERO para que el catch
                // generico de IO no lo capture. Timeout de lectura = INCIERTO: la peticion ya
                // salio y el gateway pudo recibirla; no es un rechazo.
                lastError = "timeout: " + timeoutException.getMessage();
                anyUncertain = true;
                uncertainError = lastError;
                if (!retry.shouldRetry("TIMEOUT")) {
                    return TransportResult.uncertain(attempt, System.currentTimeMillis() - startedAt, lastError);
                }
            } catch (ConnectException connectException) {
                // Conexion rechazada ANTES de enviar: el gateway no recibio nada -> re-solicitable (D.2:
                // transportFailure). NO borra un uncertain previo (sticky): si un intento anterior pudo llegar, el
                // agregado sigue INCIERTO y esta salida devuelve uncertain, no transportFailure.
                lastError = "connection refused: " + connectException.getMessage();
                lastRetriable = true;
                if (!retry.shouldRetry("CONNECTION_REFUSED")) {
                    return anyUncertain
                            ? TransportResult.uncertain(attempt, System.currentTimeMillis() - startedAt, uncertainError)
                            : TransportResult.transportFailure(attempt, System.currentTimeMillis() - startedAt, lastError);
                }
            } catch (IOException ioException) {
                // Otro IO (p.ej. conexion cortada tras enviar) = INCIERTO: no sabemos si llego.
                lastError = "IO error: " + ioException.getMessage();
                anyUncertain = true;
                uncertainError = lastError;
                lastRetriable = false;
                if (!retry.shouldRetry("CONNECTION_REFUSED")) {
                    return TransportResult.uncertain(attempt, System.currentTimeMillis() - startedAt, lastError);
                }
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                // Interrumpido a mitad: no sabemos si el envio se completo -> INCIERTO.
                return TransportResult.uncertain(attempt, System.currentTimeMillis() - startedAt,
                        "interrupted: " + interruptedException.getMessage());
            }
            sleepBackoff(retry, attempt);
        }
        // Reintentos agotados: uncertain es STICKY (si alguna vez pudo llegar, NO se reporta como rechazo ni como
        // re-solicitable); si NUNCA hubo incierto y el ultimo fallo fue de transporte (conexion pre-envio), es
        // re-solicitable (D.2); si no, rechazo de negocio.
        if (anyUncertain) {
            return TransportResult.uncertain(retry.maxRetries() + 1, System.currentTimeMillis() - startedAt, uncertainError);
        }
        return lastRetriable
                ? TransportResult.transportFailure(retry.maxRetries() + 1, System.currentTimeMillis() - startedAt, lastError)
                : TransportResult.rejected(retry.maxRetries() + 1, System.currentTimeMillis() - startedAt, lastError);
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
        return Mt101PaymentCorrelation.resolveTemplate(template, message);
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
            throw new PreDispatchTransportException("Invalid JSON in MT101_PAY REST headersJson", error);
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
