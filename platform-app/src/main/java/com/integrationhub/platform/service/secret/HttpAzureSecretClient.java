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
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Production adapter to Azure Key Vault over its REST API:
 * {@code GET {vault}/secrets/{name}?api-version=7.4} with an {@code Authorization: Bearer
 * <token>} header. The {@code value} is parsed as a JSON object. Disabled by default; any
 * error yields empty (fail-safe).
 *
 * <p>The AAD access token is supplied via config. Azure tokens are short-lived, so
 * production should refresh it out-of-band (token-supplier/sidecar) or migrate this client
 * to the Azure Identity SDK for automatic credential refresh.
 */
@ApplicationScoped
public class HttpAzureSecretClient implements AzureSecretClient {

    private static final String API_VERSION = "7.4";

    private final boolean enabled;
    private final String vaultUrl;
    private final String token;
    private final HttpClient httpClient;
    private final ObjectMapper mapper = new ObjectMapper();

    @Inject
    public HttpAzureSecretClient(
            @ConfigProperty(name = "integrationhub.secrets.azure.enabled", defaultValue = "false") boolean enabled,
            @ConfigProperty(name = "integrationhub.secrets.azure.vault-url") Optional<String> vaultUrl,
            @ConfigProperty(name = "integrationhub.secrets.azure.token") Optional<String> token) {
        this(enabled, vaultUrl.orElse(""), token.orElse(""));
    }

    public HttpAzureSecretClient(boolean enabled, String vaultUrl, String token) {
        this.enabled = enabled;
        this.vaultUrl = vaultUrl == null ? "" : stripTrailingSlash(vaultUrl.trim());
        this.token = token == null ? "" : token.trim();
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    @Override
    public Optional<Map<String, String>> readSecret(String secretName) {
        if (!enabled || vaultUrl.isEmpty() || token.isEmpty() || secretName == null || secretName.isBlank()) {
            return Optional.empty();
        }
        try {
            var uri = URI.create(vaultUrl + "/secrets/" + secretName.trim() + "?api-version=" + API_VERSION);
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
            var valueNode = mapper.readTree(response.body()).path("value");
            if (!valueNode.isTextual()) {
                return Optional.empty();
            }
            var json = mapper.readTree(valueNode.asText());
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
