package com.integrationhub.platform.provider.task.http;

import java.net.URI;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;

/**
 * Construccion compartida de una peticion HTTP saliente para tareas de proceso.
 *
 * <p>Unifica el armado de la peticion (metodo, headers, autenticacion, body y timeout) que antes
 * estaba duplicado entre {@code RestCallTaskProvider} (REST_CALL) y el canal {@code webhook} de
 * {@code NotificationTaskProvider}. Cada tarea conserva su epilogo propio: REST mapea la respuesta
 * a output; el webhook audita y valida 2xx. Ver ADR-005.</p>
 */
public final class HttpRequestSupport {

    private HttpRequestSupport() {
    }

    /**
     * Arma una {@link HttpRequest} a partir de la configuracion de la tarea.
     *
     * @param configuration configuracion de la tarea (para resolver {@code authType} y credenciales)
     * @param method        metodo HTTP (GET/POST/PUT/PATCH/DELETE); {@code null} se trata como POST
     * @param url           URL ya resuelta (base + path + query)
     * @param body          cuerpo ya resuelto (puede ser {@code null})
     * @param timeoutSeconds timeout en segundos
     * @param headers       headers ya resueltos (puede ser {@code null})
     */
    public static HttpRequest build(Map<String, Object> configuration, String method, String url, String body,
            int timeoutSeconds, Map<String, String> headers) {
        String normalizedMethod = method == null || method.isBlank() ? "POST" : method.toUpperCase();

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(timeoutSeconds));

        if (headers != null) {
            headers.forEach(builder::header);
        }
        applyAuthentication(builder, configuration);

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

    private static void applyAuthentication(HttpRequest.Builder builder, Map<String, Object> configuration) {
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
            default -> throw new IllegalArgumentException("Unsupported HTTP task authType: " + authType);
        }
    }

    private static String requireString(Map<String, Object> configuration, String key) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("HTTP task requires '" + key + "'");
        }
        return String.valueOf(value);
    }
}
