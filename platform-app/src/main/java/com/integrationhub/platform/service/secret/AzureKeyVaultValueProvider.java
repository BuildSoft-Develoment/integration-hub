package com.integrationhub.platform.service.secret;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

/**
 * {@link SecretValueProvider} backed by Azure Key Vault via {@link AzureSecretClient}.
 * Bound to the {@code azuresecret} source: {@code ${azuresecret:secret-name/field}}
 * resolves {@code field} from the JSON secret {@code secret-name}.
 */
@ApplicationScoped
public class AzureKeyVaultValueProvider implements SecretValueProvider {

    static final String SOURCE = "azuresecret";

    private final AzureSecretClient client;

    @Inject
    public AzureKeyVaultValueProvider(AzureSecretClient client) {
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
                    "Azure secret reference must use secret/field syntax: " + reference);
        }
        var secretName = sanitized.substring(0, lastSlash);
        var field = sanitized.substring(lastSlash + 1);
        return client.readSecret(secretName).map(values -> values.get(field));
    }
}
