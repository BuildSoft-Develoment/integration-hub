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

class AzureKeyVaultValueProviderTest {

    @Test
    void supportsOnlyTheAzuresecretSource() {
        var provider = new AzureKeyVaultValueProvider(mock(AzureSecretClient.class));

        assertTrue(provider.supports("azuresecret"));
        assertTrue(provider.supports("AZURESECRET"));
        assertFalse(provider.supports("gcpsecret"));
        assertFalse(provider.supports("vault"));
    }

    @Test
    void resolvesTheFieldFromTheJsonSecret() {
        var client = mock(AzureSecretClient.class);
        when(client.readSecret("acme-bank")).thenReturn(Optional.of(Map.of("apiKey", "azure-secret")));
        var provider = new AzureKeyVaultValueProvider(client);

        assertEquals(Optional.of("azure-secret"), provider.resolve("acme-bank/apiKey"));
    }

    @Test
    void returnsEmptyWhenAbsent() {
        var client = mock(AzureSecretClient.class);
        when(client.readSecret("acme-bank")).thenReturn(Optional.empty());
        var provider = new AzureKeyVaultValueProvider(client);

        assertEquals(Optional.empty(), provider.resolve("acme-bank/apiKey"));
    }

    @Test
    void rejectsAMalformedReference() {
        var provider = new AzureKeyVaultValueProvider(mock(AzureSecretClient.class));

        assertThrows(IllegalArgumentException.class, () -> provider.resolve("apiKey"));
    }
}
