package com.integrationhub.platform.service.secret;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

/**
 * {@link SecretValueProvider} backed by a corporate secret manager (HashiCorp Vault /
 * OpenBao KV v2) via {@link VaultSecretClient}. Bound to the {@code vaultkv} source so it
 * coexists with the local file-vault ({@code secret}/{@code vault}) without collision:
 * {@code ${vaultkv:area/resource/field}} resolves {@code field} from the KV secret at
 * {@code area/resource}.
 */
@ApplicationScoped
public class VaultSecretValueProvider implements SecretValueProvider {

    static final String SOURCE = "vaultkv";

    private final VaultSecretClient client;

    @Inject
    public VaultSecretValueProvider(VaultSecretClient client) {
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
                    "Vault secret reference must use area/resource/field syntax: " + reference);
        }
        var secretPath = sanitized.substring(0, lastSlash);
        var field = sanitized.substring(lastSlash + 1);
        return client.readSecret(secretPath).map(values -> values.get(field));
    }
}
