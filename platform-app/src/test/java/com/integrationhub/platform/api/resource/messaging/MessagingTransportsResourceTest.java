package com.integrationhub.platform.api.resource.messaging;

import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MessagingTransportsResourceTest {

    @Test
    void transportsReturnsRegisteredBrokerTypes() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of("KAFKA", "RABBITMQ"));

        var resource = new MessagingTransportsResource(brokers, false);

        assertEquals(List.of("KAFKA", "RABBITMQ"), resource.transports());
    }

    @Test
    void asyncStatusReflectsTheExecutionFeatureFlag() {
        var brokers = mock(MessageBrokerRegistry.class);

        assertFalse(new MessagingTransportsResource(brokers, false).asyncStatus().executionEnabled());
        assertTrue(new MessagingTransportsResource(brokers, true).asyncStatus().executionEnabled());
    }
}
