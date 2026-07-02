package com.integrationhub.platform.service.secret;

import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SdkAwsSecretClientTest {

    @SuppressWarnings("unchecked")
    @Test
    void parsesTheJsonSecretStringWhenEnabled() {
        var sm = mock(SecretsManagerClient.class);
        when(sm.getSecretValue(any(Consumer.class)))
                .thenReturn(GetSecretValueResponse.builder()
                        .secretString("{\"apiKey\":\"aws-secret\",\"user\":\"acme\"}")
                        .build());
        Instance<SecretsManagerClient> instance = mock(Instance.class);
        when(instance.isUnsatisfied()).thenReturn(false);
        when(instance.get()).thenReturn(sm);
        var client = new SdkAwsSecretClient(true, instance);

        var secret = client.readSecret("payments/acme-bank");

        assertTrue(secret.isPresent());
        assertEquals("aws-secret", secret.get().get("apiKey"));
        assertEquals("acme", secret.get().get("user"));
    }

    @SuppressWarnings("unchecked")
    @Test
    void returnsEmptyWhenDisabledWithoutTouchingTheClient() {
        Instance<SecretsManagerClient> instance = mock(Instance.class);
        var client = new SdkAwsSecretClient(false, instance);

        assertTrue(client.readSecret("payments/acme-bank").isEmpty());
        verify(instance, never()).get();
    }

    @SuppressWarnings("unchecked")
    @Test
    void returnsEmptyWhenTheClientIsUnsatisfied() {
        Instance<SecretsManagerClient> instance = mock(Instance.class);
        when(instance.isUnsatisfied()).thenReturn(true);
        var client = new SdkAwsSecretClient(true, instance);

        assertTrue(client.readSecret("payments/acme-bank").isEmpty());
    }

    @SuppressWarnings("unchecked")
    @Test
    void returnsEmptyWhenTheSecretStringIsNotAJsonObject() {
        var sm = mock(SecretsManagerClient.class);
        when(sm.getSecretValue(any(Consumer.class)))
                .thenReturn(GetSecretValueResponse.builder().secretString("plain-value").build());
        Instance<SecretsManagerClient> instance = mock(Instance.class);
        when(instance.isUnsatisfied()).thenReturn(false);
        when(instance.get()).thenReturn(sm);
        var client = new SdkAwsSecretClient(true, instance);

        assertTrue(client.readSecret("payments/acme-bank").isEmpty());
    }
}
