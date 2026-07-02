package com.integrationhub.platform.service.secret;

import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class VaultSecretValueProviderTest {

    @Test
    void supportsOnlyTheVaultkvSource() {
        var provider = new VaultSecretValueProvider(mock(VaultSecretClient.class));

        assertTrue(provider.supports("vaultkv"));
        assertTrue(provider.supports("VAULTKV"));
        assertFalse(provider.supports("vault"));
        assertFalse(provider.supports("secret"));
    }

    @Test
    void resolvesTheFieldFromTheKvSecretAtTheLogicalPath() {
        var client = mock(VaultSecretClient.class);
        when(client.readSecret("payments/acme-bank"))
                .thenReturn(Optional.of(Map.of("apiKey", "s3cr3t", "user", "acme")));
        var provider = new VaultSecretValueProvider(client);

        assertEquals(Optional.of("s3cr3t"), provider.resolve("payments/acme-bank/apiKey"));
    }

    @Test
    void returnsEmptyWhenTheFieldIsAbsent() {
        var client = mock(VaultSecretClient.class);
        when(client.readSecret("payments/acme-bank")).thenReturn(Optional.of(Map.of("user", "acme")));
        var provider = new VaultSecretValueProvider(client);

        assertEquals(Optional.empty(), provider.resolve("payments/acme-bank/apiKey"));
    }

    @Test
    void returnsEmptyWhenTheSecretIsMissing() {
        var client = mock(VaultSecretClient.class);
        when(client.readSecret("payments/acme-bank")).thenReturn(Optional.empty());
        var provider = new VaultSecretValueProvider(client);

        assertEquals(Optional.empty(), provider.resolve("payments/acme-bank/apiKey"));
    }

    @Test
    void rejectsAReferenceWithoutAreaResourceFieldSyntax() {
        var provider = new VaultSecretValueProvider(mock(VaultSecretClient.class));

        assertThrows(IllegalArgumentException.class, () -> provider.resolve("apiKey"));
        assertThrows(IllegalArgumentException.class, () -> provider.resolve("payments/"));
    }
}
