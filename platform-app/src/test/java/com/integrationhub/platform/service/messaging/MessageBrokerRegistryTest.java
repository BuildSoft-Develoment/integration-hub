package com.integrationhub.platform.service.messaging;

import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MessageBrokerRegistryTest {

    @Test
    void listsRegisteredBrokerTypesSortedAndDistinct() {
        MessageBrokerProvider kafka = mock(MessageBrokerProvider.class);
        MessageBrokerProvider jms = mock(MessageBrokerProvider.class);
        when(kafka.type()).thenReturn("KAFKA");
        when(jms.type()).thenReturn("JMS");

        @SuppressWarnings("unchecked")
        Instance<MessageBrokerProvider> providers = mock(Instance.class);
        when(providers.stream()).thenReturn(Stream.of(kafka, jms));

        MessageBrokerRegistry registry = new MessageBrokerRegistry(providers);

        assertEquals(List.of("JMS", "KAFKA"), registry.availableTypes());
    }
}
