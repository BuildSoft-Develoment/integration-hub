package com.integrationhub.platform.service.secret;

import org.eclipse.microprofile.config.ConfigProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers spec 001-catalogo-fuentes RF-004 (reingenieria: prueba que cubre el/los RF en produccion)
class FileVaultSecretValueProviderTest {

    @AfterEach
    void clearDefaults() {
        System.clearProperty("integrationhub.secrets.file-vault.default-provider");
    }

    @Test
    void resolvesExplicitFieldFromLogicalSecretPath() {
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");
        var provider = provider(Map.of("dev:connections/db/conexion1", Map.of("password", "vault-pass", "user", "vault-user")));

        assertEquals(Optional.of("vault-pass"), provider.resolve("connections/db/conexion1/password"));
    }

    @Test
    void resolvesDefaultValueFieldAndSingleValueSecrets() {
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");
        var provider = provider(Map.of(
                "dev:erp/token", Map.of("value", "abc123"),
                "dev:erp/one-field", Map.of("apiKey", "xyz789")
        ));

        assertEquals(Optional.of("abc123"), provider.resolve("erp/token/value"));
        assertEquals(Optional.of("xyz789"), provider.resolve("erp/one-field/apiKey"));
    }

    @Test
    void rejectsNonLogicalSecretReference() {
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");
        var provider = provider(Map.of());

        var error = assertThrows(IllegalArgumentException.class, () -> provider.resolve("legacy.secret"));
        assertEquals("Secret reference must use logical path syntax area/resource/field: legacy.secret", error.getMessage());
    }

    @Test
    void returnsEmptyWhenSecretDoesNotExposeResolvableField() {
        System.setProperty("integrationhub.secrets.file-vault.default-provider", "dev");
        var provider = provider(Map.of("dev:erp/multi", Map.of("a", "1", "b", "2")));

        assertTrue(provider.resolve("erp/multi/value").isEmpty());
    }

    private FileVaultSecretValueProvider provider(Map<String, Map<String, String>> secrets) {
        FileVaultSecretClient client = (providerName, alias) -> Optional.ofNullable(secrets.get(providerName + ":" + alias));
        var mapper = new FileVaultSecretLocationMapper(ConfigProvider.getConfig(), true);
        return new FileVaultSecretValueProvider(client, mapper, true);
    }
}

