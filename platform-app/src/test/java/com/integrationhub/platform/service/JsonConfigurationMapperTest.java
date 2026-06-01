package com.integrationhub.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.secret.ConfigSecretValueProvider;
import com.integrationhub.platform.service.secret.EnvironmentSecretValueProvider;
import com.integrationhub.platform.service.secret.FileVaultSecretClient;
import com.integrationhub.platform.service.secret.FileVaultSecretLocationMapper;
import com.integrationhub.platform.service.secret.FileVaultSecretValueProvider;
import com.integrationhub.platform.service.secret.SecretLocationMapper;
import com.integrationhub.platform.service.secret.SecretResolver;
import com.integrationhub.platform.service.secret.SecretValueProvider;
import org.eclipse.microprofile.config.ConfigProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

// @covers RF-003 (reingenieria: prueba que cubre el/los RF en produccion)
class JsonConfigurationMapperTest {

    private final JsonConfigurationMapper mapper = mapper();

    @AfterEach
    void clearSecrets() {
        System.clearProperty("integrationhub.rest.token");
        System.clearProperty("SFTP_PASSWORD");
        System.clearProperty("integrationhub.secrets.file-vault.default-provider");
    }

    @Test
    void resolvesConfigEnvAndLogicalSecretPlaceholdersRecursively() {
        System.setProperty("integrationhub.rest.token", "token-123");
        System.setProperty("SFTP_PASSWORD", "sftp-pass");
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");

        Map<String, Object> result = mapper.toMap("""
                {
                  "auth": "Bearer ${secret:connections/db/conexion1/password}",
                  "password": "${env:SFTP_PASSWORD}",
                  "nested": {
                    "header": "Token ${config:integrationhub.rest.token}"
                  },
                  "items": [
                    "${vault:connections/db/conexion1/password}",
                    "fixed"
                  ],
                  "bodyTemplate": "{\\"codigo\\":\\"${codigo}\\"}"
                }
                """);

        assertEquals("Bearer token-file-vault", result.get("auth"));
        assertEquals("sftp-pass", result.get("password"));
        assertEquals("Token token-123", ((Map<?, ?>) result.get("nested")).get("header"));
        assertEquals(List.of("token-file-vault", "fixed"), result.get("items"));
        assertEquals("{\"codigo\":\"${codigo}\"}", result.get("bodyTemplate"));
    }

    @Test
    void rejectsReferenceWithoutLogicalPathAndField() {
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");
        var error = assertThrows(IllegalArgumentException.class,
                () -> mapper.toMap("{\"legacy\":\"${secret:integrationhub.rest.token}\"}"));

        assertEquals("Secret reference must use logical path syntax area/resource/field: integrationhub.rest.token", error.getMessage());
    }

    private JsonConfigurationMapper mapper() {
        var config = ConfigProvider.getConfig();
        ConfigSecretValueProvider configProvider = new ConfigSecretValueProvider(config);
        SecretValueProvider envProvider = new EnvironmentSecretValueProvider(config);
        FileVaultSecretClient fileVaultSecretClient = (providerName, alias) -> {
            if ("dev".equals(providerName) && "connections/db/conexion1".equals(alias)) {
                return Optional.of(Map.of("password", "token-file-vault"));
            }
            return Optional.empty();
        };
        SecretLocationMapper<FileVaultSecretLocationMapper.FileVaultLocation> mapper = new FileVaultSecretLocationMapper(config, true);
        SecretValueProvider vaultProvider = new FileVaultSecretValueProvider(fileVaultSecretClient, mapper, true);
        SecretResolver secretResolver = new SecretResolver(List.of(envProvider, configProvider, vaultProvider));
        return new JsonConfigurationMapper(new ObjectMapper(), secretResolver, true);
    }
}

