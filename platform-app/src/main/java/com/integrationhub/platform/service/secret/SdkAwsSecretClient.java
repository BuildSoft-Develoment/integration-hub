package com.integrationhub.platform.service.secret;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Production adapter to AWS Secrets Manager via the AWS SDK. Disabled by default; the SDK
 * client is injected lazily ({@link Instance}) and only resolved when enabled, so the
 * client bean (and its AWS config) is never required at startup unless the adapter is
 * turned on. Reads the JSON {@code SecretString} of a secret and returns its fields. Any
 * error or a non-JSON/absent secret yields empty (fail-safe).
 */
@ApplicationScoped
public class SdkAwsSecretClient implements AwsSecretClient {

    private final boolean enabled;
    private final Instance<SecretsManagerClient> client;
    private final ObjectMapper mapper = new ObjectMapper();

    @Inject
    public SdkAwsSecretClient(
            @ConfigProperty(name = "integrationhub.secrets.aws.enabled", defaultValue = "false") boolean enabled,
            Instance<SecretsManagerClient> client) {
        this.enabled = enabled;
        this.client = client;
    }

    @Override
    public Optional<Map<String, String>> readSecret(String secretId) {
        if (!enabled || secretId == null || secretId.isBlank() || client.isUnsatisfied()) {
            return Optional.empty();
        }
        try {
            var response = client.get().getSecretValue(request -> request.secretId(secretId.trim()));
            var secretString = response.secretString();
            if (secretString == null || secretString.isBlank()) {
                return Optional.empty();
            }
            var node = mapper.readTree(secretString);
            if (!node.isObject()) {
                return Optional.empty();
            }
            Map<String, String> values = new HashMap<>();
            node.fields().forEachRemaining(entry -> values.put(entry.getKey(), asText(entry.getValue())));
            return Optional.of(values);
        } catch (Exception error) {
            return Optional.empty();
        }
    }

    private static String asText(JsonNode node) {
        return node.isValueNode() ? node.asText() : node.toString();
    }
}
