package com.integrationhub.platform.api.resource.messaging;

import com.integrationhub.platform.service.messaging.AsyncAvailabilityService;
import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MessagingTransportsResourceTest {

    private MessagingTransportsResource resource(MessageBrokerRegistry brokers,
                                                 boolean execution, boolean dispatch, boolean consumer) {
        return new MessagingTransportsResource(brokers,
                new AsyncAvailabilityService(brokers, execution, dispatch, consumer));
    }

    @Test
    void transportsReturnsRegisteredBrokerTypes() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of("KAFKA", "RABBITMQ"));

        assertEquals(List.of("KAFKA", "RABBITMQ"), resource(brokers, false, false, false).transports());
    }

    @Test
    void asyncStatusDelegatesTheCompositeAvailability() {
        var brokers = mock(MessageBrokerRegistry.class);
        when(brokers.availableTypes()).thenReturn(List.of("KAFKA"));

        // execution off -> DISABLED (y executionEnabled=false conservado, backward-compatible).
        var disabled = resource(brokers, false, true, true).asyncStatus();
        assertFalse(disabled.executionEnabled());
        assertEquals(AsyncAvailabilityService.State.DISABLED, disabled.state());

        // los tres gates on + broker registrado -> READY.
        var ready = resource(brokers, true, true, true).asyncStatus();
        assertTrue(ready.executionEnabled());
        assertEquals(AsyncAvailabilityService.State.READY, ready.state());
    }
}
