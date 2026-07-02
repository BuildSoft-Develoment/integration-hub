package com.integrationhub.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.secret.ConfigSecretValueProvider;
import com.integrationhub.platform.service.secret.EnvironmentSecretValueProvider;
import com.integrationhub.platform.service.secret.FileVaultSecretClient;
import com.integrationhub.platform.service.secret.FileVaultSecretLocationMapper;
import com.integrationhub.platform.service.secret.FileVaultSecretValueProvider;
import com.integrationhub.platform.service.secret.SecretLocationMapper;
import com.integrationhub.platform.service.secret.AwsSecretClient;
import com.integrationhub.platform.service.secret.AwsSecretManagerValueProvider;
import com.integrationhub.platform.service.secret.AzureKeyVaultValueProvider;
import com.integrationhub.platform.service.secret.AzureSecretClient;
import com.integrationhub.platform.service.secret.GcpSecretClient;
import com.integrationhub.platform.service.secret.GcpSecretManagerValueProvider;
import com.integrationhub.platform.service.secret.SecretResolver;
import com.integrationhub.platform.service.secret.SecretValueProvider;
import com.integrationhub.platform.service.secret.VaultSecretClient;
import com.integrationhub.platform.service.secret.VaultSecretValueProvider;
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
    void resolvesVaultKvCorporateSecretReferencesThroughTheMapper() {
        // Proves the SECRET_PATTERN captures the "vaultkv" scheme (not just "vault") and
        // that the full chain routes to the corporate Vault provider.
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");

        Map<String, Object> result = mapper.toMap("""
                {
                  "apiKey": "${vaultkv:payments/acme-bank/apiKey}",
                  "fileVault": "${secret:connections/db/conexion1/password}"
                }
                """);

        assertEquals("kv-secret", result.get("apiKey"));
        // The pre-existing file-vault scheme still resolves independently.
        assertEquals("token-file-vault", result.get("fileVault"));
    }

    @Test
    void resolvesAwsSecretsManagerReferencesThroughTheMapper() {
        // Proves SECRET_PATTERN captures "awssecret" and routes to the AWS provider,
        // coexisting with vaultkv and the file-vault without collision.
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");

        Map<String, Object> result = mapper.toMap("""
                {
                  "aws": "${awssecret:payments/acme-bank/apiKey}",
                  "vault": "${vaultkv:payments/acme-bank/apiKey}"
                }
                """);

        assertEquals("aws-secret", result.get("aws"));
        assertEquals("kv-secret", result.get("vault"));
    }

    @Test
    void resolvesGcpAndAzureSecretReferencesThroughTheMapper() {
        // Proves SECRET_PATTERN captures gcpsecret/azuresecret and routes to each provider.
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");

        Map<String, Object> result = mapper.toMap("""
                {
                  "gcp": "${gcpsecret:acme-bank/apiKey}",
                  "azure": "${azuresecret:acme-bank/apiKey}"
                }
                """);

        assertEquals("gcp-secret", result.get("gcp"));
        assertEquals("azure-secret", result.get("azure"));
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
        VaultSecretClient vaultKvClient = path ->
                "payments/acme-bank".equals(path) ? Optional.of(Map.of("apiKey", "kv-secret")) : Optional.empty();
        SecretValueProvider vaultKvProvider = new VaultSecretValueProvider(vaultKvClient);
        AwsSecretClient awsClient = secretId ->
                "payments/acme-bank".equals(secretId) ? Optional.of(Map.of("apiKey", "aws-secret")) : Optional.empty();
        SecretValueProvider awsProvider = new AwsSecretManagerValueProvider(awsClient);
        GcpSecretClient gcpClient = secretId ->
                "acme-bank".equals(secretId) ? Optional.of(Map.of("apiKey", "gcp-secret")) : Optional.empty();
        SecretValueProvider gcpProvider = new GcpSecretManagerValueProvider(gcpClient);
        AzureSecretClient azureClient = secretName ->
                "acme-bank".equals(secretName) ? Optional.of(Map.of("apiKey", "azure-secret")) : Optional.empty();
        SecretValueProvider azureProvider = new AzureKeyVaultValueProvider(azureClient);
        SecretResolver secretResolver = new SecretResolver(List.of(
                envProvider, configProvider, vaultProvider, vaultKvProvider, awsProvider, gcpProvider, azureProvider));
        return new JsonConfigurationMapper(new ObjectMapper(), secretResolver, true);
    }
}

