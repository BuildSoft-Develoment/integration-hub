package com.integrationhub.platform.service.secret;

// @trace RF-004 (reingenieria: clase que implementa el/los RF en produccion)

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Map;
import java.util.Optional;

// Sin @DefaultBean: los SecretValueProvider no compiten entre si (SecretResolver los recorre y elige
// por supports(source)), son una cadena de fuentes. Con @DefaultBean, ArC eliminaba este bean del
// Instance<SecretValueProvider> por existir beans no-default del mismo tipo (aws/azure/gcp/vault)
// -> "Unsupported secret source: secret" al resolver ${secret:...} en runtime.
@ApplicationScoped
public class FileVaultSecretValueProvider implements SecretValueProvider {

    private final FileVaultSecretClient fileVaultSecretClient;
    private final SecretLocationMapper<FileVaultSecretLocationMapper.FileVaultLocation> locationMapper;

    @Inject
    public FileVaultSecretValueProvider(FileVaultSecretClient fileVaultSecretClient,
                                        SecretLocationMapper<FileVaultSecretLocationMapper.FileVaultLocation> locationMapper) {
        this.fileVaultSecretClient = fileVaultSecretClient;
        this.locationMapper = locationMapper;
    }

    public FileVaultSecretValueProvider(FileVaultSecretClient fileVaultSecretClient,
                                        SecretLocationMapper<FileVaultSecretLocationMapper.FileVaultLocation> locationMapper,
                                        boolean ignored) {
        this.fileVaultSecretClient = fileVaultSecretClient;
        this.locationMapper = locationMapper;
    }

    @Override
    public boolean supports(String source) {
        return "secret".equalsIgnoreCase(source) || "vault".equalsIgnoreCase(source);
    }

    @Override
    public Optional<String> resolve(String reference) {
        var location = locationMapper.map(reference);
        return fileVaultSecretClient.readSecret(location.providerName(), location.alias())
                .flatMap(secret -> resolveField(secret, location.field()));
    }

    private Optional<String> resolveField(Map<String, String> secret, String field) {
        if (field != null && !field.isBlank()) {
            return Optional.ofNullable(secret.get(field));
        }
        if (secret.containsKey("value")) {
            return Optional.ofNullable(secret.get("value"));
        }
        if (secret.size() == 1) {
            return Optional.ofNullable(secret.values().iterator().next());
        }
        return Optional.empty();
    }
}
