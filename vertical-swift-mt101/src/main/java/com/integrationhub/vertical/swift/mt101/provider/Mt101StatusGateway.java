package com.integrationhub.vertical.swift.mt101.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Colaborador del gateway de estado: encapsula la consulta HTTP al banco y la
 * extraccion de campos por JSON-path. Es la unica razon de cambio "protocolo de
 * consulta" del flujo {@code MT101_STATUS}; el provider orquesta los modos
 * (query/callback/poll) y delega aqui la I/O.
 *
 * <p>Stateless y reusable: {@code Mt101StatusTaskProvider} lo construye con su
 * {@link HttpClient}/{@link ObjectMapper} (o inyectado por CDI).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-005, T-013
 * @trace ADR-009
 */
public final class Mt101StatusGateway {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public Mt101StatusGateway(HttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    /** Respuesta de la consulta: cuerpo crudo o {@code error} (nunca ambos null util). */
    public record GatewayResponse(String body, String error) {
    }

    public GatewayResponse query(String method, String url, int timeoutSeconds) {
        try {
            var request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .method(method, HttpRequest.BodyPublishers.noBody())
                    .build();
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            var status = response.statusCode();
            if (status >= 200 && status < 300) {
                return new GatewayResponse(response.body(), null);
            }
            return new GatewayResponse(response.body(),
                    "HTTP " + status + ": " + truncate(response.body(), 200));
        } catch (IOException error) {
            return new GatewayResponse(null, "IO error: " + error.getMessage());
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return new GatewayResponse(null, "interrupted: " + error.getMessage());
        }
    }

    /** Extrae un valor escalar por JSON-path estilo {@code $.data.state}. */
    public String extractField(String body, String jsonPath) {
        if (body == null || body.isBlank() || jsonPath == null || !jsonPath.startsWith("$.")) {
            return null;
        }
        try {
            var node = objectMapper.readTree(body);
            return navigate(node, jsonPath.substring(2));
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

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max) + "...";
    }
}
