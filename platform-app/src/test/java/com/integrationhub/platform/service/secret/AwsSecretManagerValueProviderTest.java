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

class AwsSecretManagerValueProviderTest {

    @Test
    void supportsOnlyTheAwssecretSource() {
        var provider = new AwsSecretManagerValueProvider(mock(AwsSecretClient.class));

        assertTrue(provider.supports("awssecret"));
        assertTrue(provider.supports("AWSSECRET"));
        assertFalse(provider.supports("secret"));
        assertFalse(provider.supports("vaultkv"));
    }

    @Test
    void resolvesTheFieldFromTheJsonSecret() {
        var client = mock(AwsSecretClient.class);
        when(client.readSecret("payments/acme-bank"))
                .thenReturn(Optional.of(Map.of("apiKey", "aws-secret", "user", "acme")));
        var provider = new AwsSecretManagerValueProvider(client);

        assertEquals(Optional.of("aws-secret"), provider.resolve("payments/acme-bank/apiKey"));
    }

    @Test
    void returnsEmptyWhenTheFieldOrSecretIsAbsent() {
        var client = mock(AwsSecretClient.class);
        when(client.readSecret("payments/acme-bank")).thenReturn(Optional.of(Map.of("user", "acme")));
        when(client.readSecret("missing/x")).thenReturn(Optional.empty());
        var provider = new AwsSecretManagerValueProvider(client);

        assertEquals(Optional.empty(), provider.resolve("payments/acme-bank/apiKey"));
        assertEquals(Optional.empty(), provider.resolve("missing/x/apiKey"));
    }

    @Test
    void rejectsAReferenceWithoutAreaResourceFieldSyntax() {
        var provider = new AwsSecretManagerValueProvider(mock(AwsSecretClient.class));

        assertThrows(IllegalArgumentException.class, () -> provider.resolve("apiKey"));
        assertThrows(IllegalArgumentException.class, () -> provider.resolve("payments/"));
    }
}
