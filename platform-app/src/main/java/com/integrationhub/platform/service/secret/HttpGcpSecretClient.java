package com.integrationhub.platform.service.secret;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Production adapter to GCP Secret Manager over its REST API:
 * {@code GET {base}/v1/projects/{project}/secrets/{id}/versions/latest:access} with an
 * {@code Authorization: Bearer <token>} header. The base64 {@code payload.data} is decoded
 * and parsed as a JSON object. Disabled by default; any error yields empty (fail-safe).
 *
 * <p>The access token is supplied via config. GCP OAuth tokens are short-lived, so
 * production should refresh it out-of-band (token-supplier/sidecar) or migrate this client
 * to the GCP SDK for automatic credential refresh.
 */
@ApplicationScoped
public class HttpGcpSecretClient implements GcpSecretClient {

    private final boolean enabled;
    private final String baseUrl;
    private final String project;
    private final String token;
    private final HttpClient httpClient;
    private final ObjectMapper mapper = new ObjectMapper();

    @Inject
    public HttpGcpSecretClient(
            @ConfigProperty(name = "integrationhub.secrets.gcp.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "integrationhub.secrets.gcp.base-url",
                    defaultValue = "https://secretmanager.googleapis.com") String baseUrl,
            @ConfigProperty(name = "integrationhub.secrets.gcp.project") Optional<String> project,
            @ConfigProperty(name = "integrationhub.secrets.gcp.token") Optional<String> token) {
        this(enabled, baseUrl, project.orElse(""), token.orElse(""));
    }

    public HttpGcpSecretClient(boolean enabled, String baseUrl, String project, String token) {
        this.enabled = enabled;
        this.baseUrl = baseUrl == null || baseUrl.isBlank() ? "https://secretmanager.googleapis.com"
                : stripTrailingSlash(baseUrl.trim());
        this.project = project == null ? "" : project.trim();
        this.token = token == null ? "" : token.trim();
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    @Override
    public Optional<Map<String, String>> readSecret(String secretId) {
        if (!enabled || project.isEmpty() || token.isEmpty() || secretId == null || secretId.isBlank()) {
            return Optional.empty();
        }
        try {
            var uri = URI.create(baseUrl + "/v1/projects/" + project + "/secrets/"
                    + secretId.trim() + "/versions/latest:access");
            var request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(5))
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return Optional.empty();
            }
            var dataNode = mapper.readTree(response.body()).path("payload").path("data");
            if (!dataNode.isTextual()) {
                return Optional.empty();
            }
            var decoded = new String(Base64.getDecoder().decode(dataNode.asText()), StandardCharsets.UTF_8);
            var json = mapper.readTree(decoded);
            if (!json.isObject()) {
                return Optional.empty();
            }
            Map<String, String> values = new HashMap<>();
            json.fields().forEachRemaining(entry -> values.put(entry.getKey(), asText(entry.getValue())));
            return Optional.of(values);
        } catch (Exception error) {
            return Optional.empty();
        }
    }

    private static String asText(JsonNode node) {
        return node.isValueNode() ? node.asText() : node.toString();
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
