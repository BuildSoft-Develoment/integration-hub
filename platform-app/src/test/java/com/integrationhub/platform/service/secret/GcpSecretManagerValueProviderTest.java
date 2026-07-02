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

class GcpSecretManagerValueProviderTest {

    @Test
    void supportsOnlyTheGcpsecretSource() {
        var provider = new GcpSecretManagerValueProvider(mock(GcpSecretClient.class));

        assertTrue(provider.supports("gcpsecret"));
        assertTrue(provider.supports("GCPSECRET"));
        assertFalse(provider.supports("awssecret"));
        assertFalse(provider.supports("secret"));
    }

    @Test
    void resolvesTheFieldFromTheJsonSecret() {
        var client = mock(GcpSecretClient.class);
        when(client.readSecret("acme-bank")).thenReturn(Optional.of(Map.of("apiKey", "gcp-secret")));
        var provider = new GcpSecretManagerValueProvider(client);

        assertEquals(Optional.of("gcp-secret"), provider.resolve("acme-bank/apiKey"));
    }

    @Test
    void returnsEmptyWhenAbsent() {
        var client = mock(GcpSecretClient.class);
        when(client.readSecret("acme-bank")).thenReturn(Optional.empty());
        var provider = new GcpSecretManagerValueProvider(client);

        assertEquals(Optional.empty(), provider.resolve("acme-bank/apiKey"));
    }

    @Test
    void rejectsAMalformedReference() {
        var provider = new GcpSecretManagerValueProvider(mock(GcpSecretClient.class));

        assertThrows(IllegalArgumentException.class, () -> provider.resolve("apiKey"));
    }
}
