package com.integrationhub.platform.service.secret;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.Config;

@ApplicationScoped
public class FileVaultSecretLocationMapper implements SecretLocationMapper<FileVaultSecretLocationMapper.FileVaultLocation> {

    private static final String DEFAULT_PROVIDER_KEY = "integrationhub.secrets.file-vault.default-provider";
    private final Config config;

    @Inject
    public FileVaultSecretLocationMapper(Config config) {
        this.config = config;
    }

    public FileVaultSecretLocationMapper(Config config, boolean ignored) {
        this.config = config;
    }

    @Override
    public FileVaultLocation map(String reference) {
        var parsed = LogicalSecretReference.parse(reference);
        if (!parsed.isLogicalSecret()) {
            throw new IllegalArgumentException("Secret reference must use logical path syntax area/resource/field: " + reference);
        }
        String provider = config.getOptionalValue(DEFAULT_PROVIDER_KEY, String.class)
                .orElseThrow(() -> new IllegalArgumentException("Missing config value: " + DEFAULT_PROVIDER_KEY));
        return new FileVaultLocation(provider, parsed.secretPath(), parsed.field());
    }

    public static record FileVaultLocation(String providerName, String alias, String field) {
    }

    record LogicalSecretReference(String secretPath, String field) {

        static LogicalSecretReference parse(String reference) {
            String sanitized = reference == null ? "" : reference.strip();
            int lastSlash = sanitized.lastIndexOf('/');
            if (lastSlash <= 0 || lastSlash == sanitized.length() - 1) {
                return new LogicalSecretReference(sanitized, null);
            }
            return new LogicalSecretReference(sanitized.substring(0, lastSlash), sanitized.substring(lastSlash + 1));
        }

        boolean isLogicalSecret() {
            return secretPath != null && !secretPath.isBlank() && field != null && !field.isBlank() && secretPath.contains("/");
        }
    }
}

