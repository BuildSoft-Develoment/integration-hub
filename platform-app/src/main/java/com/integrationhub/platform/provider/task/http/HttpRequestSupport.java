package com.integrationhub.platform.provider.task.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Construccion compartida de una peticion HTTP saliente para tareas de proceso.
 *
 * <p>Unifica el armado de la peticion (metodo, headers, autenticacion, body y timeout) que antes
 * estaba duplicado entre {@code RestCallTaskProvider} (REST_CALL) y el canal {@code webhook} de
 * {@code NotificationTaskProvider}. Cada tarea conserva su epilogo propio: REST mapea la respuesta
 * a output; el webhook audita y valida 2xx. Ver ADR-005.</p>
 *
 * <p>Soporta {@code authType}: {@code none}/{@code basic}/{@code bearer} y {@code login-request}
 * (autenticacion en dos pasos: pide un token a un endpoint de login —p.ej. AWS STS, Google OAuth,
 * Azure AD— y lo inyecta como {@code Authorization: Bearer} en la peticion al servicio destino).</p>
 */
public final class HttpRequestSupport {

    private HttpRequestSupport() {
    }

    /**
     * Variante sin cliente: solo soporta auth {@code none}/{@code basic}/{@code bearer}. Para
     * {@code login-request} usar {@link #build(HttpClient, ObjectMapper, Map, String, String, String, int, Map)}.
     */
    public static HttpRequest build(Map<String, Object> configuration, String method, String url, String body,
            int timeoutSeconds, Map<String, String> headers) {
        return build(null, null, configuration, method, url, body, timeoutSeconds, headers);
    }

    /**
     * Arma una {@link HttpRequest} a partir de la configuracion de la tarea.
     *
     * @param client        cliente HTTP usado para resolver el token de {@code login-request} (puede ser {@code null} si no se usa ese authType)
     * @param mapper        Jackson para extraer el token de la respuesta de login (puede ser {@code null} si no se usa)
     * @param configuration configuracion de la tarea (resuelve {@code authType} y credenciales)
     * @param method        metodo HTTP (GET/POST/PUT/PATCH/DELETE); {@code null} se trata como POST
     * @param url           URL ya resuelta (base + path + query)
     * @param body          cuerpo ya resuelto (puede ser {@code null})
     * @param timeoutSeconds timeout en segundos
     * @param headers       headers ya resueltos (puede ser {@code null})
     */
    public static HttpRequest build(HttpClient client, ObjectMapper mapper, Map<String, Object> configuration,
            String method, String url, String body, int timeoutSeconds, Map<String, String> headers) {
        String normalizedMethod = method == null || method.isBlank() ? "POST" : method.toUpperCase();

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(timeoutSeconds));

        if (headers != null) {
            headers.forEach(builder::header);
        }
        applyAuthentication(builder, configuration, client, mapper);

        boolean carriesBody = !"GET".equals(normalizedMethod);
        if (carriesBody && (headers == null || !headers.containsKey("Content-Type"))) {
            builder.header("Content-Type", "application/json");
        }

        return switch (normalizedMethod) {
            case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
            case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
            case "PATCH" ->
                builder.method("PATCH", HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
            case "DELETE" ->
                builder.method("DELETE", HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
            default -> builder.GET().build();
        };
    }

    private static void applyAuthentication(HttpRequest.Builder builder, Map<String, Object> configuration,
            HttpClient client, ObjectMapper mapper) {
        if (configuration == null) {
            return;
        }
        Object rawAuthType = configuration.get("authType");
        String authType = rawAuthType == null ? null : String.valueOf(rawAuthType);
        if (authType == null || authType.isBlank()) {
            return;
        }

        switch (authType.toLowerCase()) {
            case "basic" -> {
                String username = requireString(configuration, "username");
                String password = requireString(configuration, "password");
                String token = Base64.getEncoder()
                        .encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
                builder.header("Authorization", "Basic " + token);
            }
            case "bearer" -> builder.header("Authorization", "Bearer " + requireString(configuration, "token"));
            case "login-request" -> builder.header("Authorization", "Bearer " + resolveLoginToken(client, mapper, configuration));
            default -> throw new IllegalArgumentException("Unsupported HTTP task authType: " + authType);
        }
    }

    /**
     * Realiza la peticion de login (paso 1) y extrae el token de la respuesta segun {@code tokenPath}.
     * El {@code Content-Type} del login lo controla {@code loginHeaders} (default JSON); si se usa
     * {@code application/x-www-form-urlencoded}, el {@code loginBodyTemplate} debe traer el cuerpo
     * en ese formato.
     */
    private static String resolveLoginToken(HttpClient client, ObjectMapper mapper, Map<String, Object> configuration) {
        if (client == null || mapper == null) {
            throw new IllegalStateException("login-request requires an HTTP client and JSON mapper");
        }
        String loginUrl = requireString(configuration, "loginUrl");
        String loginMethod = String.valueOf(configuration.getOrDefault("loginMethod", "POST")).toUpperCase();
        String loginBody = configuration.get("loginBodyTemplate") == null ? "" : String.valueOf(configuration.get("loginBodyTemplate"));
        String tokenPath = String.valueOf(configuration.getOrDefault("tokenPath", "$.access_token"));
        int loginTimeout = optionalInt(configuration, "loginTimeoutSeconds", 20);
        Map<String, String> loginHeaders = stringMap(configuration, "loginHeaders");

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(loginUrl))
                .timeout(Duration.ofSeconds(loginTimeout));
        loginHeaders.forEach(builder::header);
        boolean carriesBody = !"GET".equals(loginMethod);
        if (carriesBody && !loginHeaders.containsKey("Content-Type")) {
            builder.header("Content-Type", "application/json");
        }

        HttpRequest request = switch (loginMethod) {
            case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofString(loginBody)).build();
            case "PATCH" -> builder.method("PATCH", HttpRequest.BodyPublishers.ofString(loginBody)).build();
            case "GET" -> builder.GET().build();
            default -> builder.POST(HttpRequest.BodyPublishers.ofString(loginBody)).build();
        };

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Login token request returned status " + response.statusCode());
            }
            return extractToken(mapper, response.body(), tokenPath);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Login token request interrupted", e);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot obtain login token from " + loginUrl, e);
        }
    }

    /**
     * Extrae el token de un JSON via un JSON-path simple por puntos: {@code $.access_token},
     * {@code $.data.token}, {@code access_token}. No soporta arreglos ni wildcards.
     */
    static String extractToken(ObjectMapper mapper, String responseBody, String tokenPath) {
        try {
            JsonNode node = mapper.readTree(responseBody == null ? "" : responseBody);
            String path = tokenPath == null || tokenPath.isBlank() ? "access_token" : tokenPath.trim();
            if (path.startsWith("$.")) {
                path = path.substring(2);
            } else if (path.startsWith("$")) {
                path = path.substring(1);
            }
            for (String segment : path.split("\\.")) {
                if (segment.isBlank()) {
                    continue;
                }
                if (node == null) {
                    break;
                }
                node = node.get(segment);
            }
            if (node == null || node.isNull() || !node.isValueNode()) {
                throw new IllegalStateException("Token not found at path '" + tokenPath + "' in login response");
            }
            return node.asText();
        } catch (IOException e) {
            throw new IllegalStateException("Login response is not valid JSON", e);
        }
    }

    private static String requireString(Map<String, Object> configuration, String key) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("HTTP task requires '" + key + "'");
        }
        return String.valueOf(value);
    }

    private static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> stringMap(Map<String, Object> configuration, String key) {
        Object value = configuration.get(key);
        if (!(value instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        Map<String, String> result = new LinkedHashMap<>();
        rawMap.forEach((mapKey, mapValue) -> result.put(String.valueOf(mapKey), mapValue == null ? "" : String.valueOf(mapValue)));
        return result;
    }
}
