package com.integrationhub.platform.service.secret;

import io.quarkus.arc.DefaultBean;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Map;
import java.util.Optional;

@ApplicationScoped
@DefaultBean
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
