package com.integrationhub.platform.service.secret;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

/**
 * {@link SecretValueProvider} backed by GCP Secret Manager via {@link GcpSecretClient}.
 * Bound to the {@code gcpsecret} source: {@code ${gcpsecret:secret-name/field}} resolves
 * {@code field} from the JSON secret {@code secret-name}.
 */
@ApplicationScoped
public class GcpSecretManagerValueProvider implements SecretValueProvider {

    static final String SOURCE = "gcpsecret";

    private final GcpSecretClient client;

    @Inject
    public GcpSecretManagerValueProvider(GcpSecretClient client) {
        this.client = client;
    }

    @Override
    public boolean supports(String source) {
        return SOURCE.equalsIgnoreCase(source);
    }

    @Override
    public Optional<String> resolve(String reference) {
        var sanitized = reference == null ? "" : reference.strip();
        int lastSlash = sanitized.lastIndexOf('/');
        if (lastSlash <= 0 || lastSlash == sanitized.length() - 1) {
            throw new IllegalArgumentException(
                    "GCP secret reference must use secret/field syntax: " + reference);
        }
        var secretId = sanitized.substring(0, lastSlash);
        var field = sanitized.substring(lastSlash + 1);
        return client.readSecret(secretId).map(values -> values.get(field));
    }
}
