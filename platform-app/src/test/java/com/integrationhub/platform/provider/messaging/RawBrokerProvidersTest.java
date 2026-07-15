package com.integrationhub.platform.provider.messaging;

import com.integrationhub.platform.provider.messaging.jms.JmsMessageBrokerProvider;
import com.integrationhub.platform.provider.messaging.rabbitmq.RabbitMqMessageBrokerProvider;
import com.integrationhub.platform.provider.messaging.redis.RedisMessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.stream.StreamCommands;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Contrato de los conectores del SPI de mensajeria: exponen su type() y, ante un broker
 * inalcanzable/error, publish() devuelve un PublishResult fallido (no lanza) -> el relay
 * deja la trama PENDING y reintenta (cero perdida). RabbitMQ/JMS se prueban con su cliente
 * apuntando a un puerto muerto; Redis (via extension quarkus-redis-client) se prueba con un
 * RedisDataSource mockeado cuyo XADD lanza. El roundtrip real por broker se valida en su
 * propio entorno (Testcontainers), no aqui.
 */
class RawBrokerProvidersTest {

    private static final OutboundMessage MSG = OutboundMessage.of("audit-events", "trace-1", "{}");

    @Test
    void rabbitMqExposesTypeAndFailsGracefully() {
        var provider = new RabbitMqMessageBrokerProvider("localhost", 5673, "guest", "guest");
        assertEquals("RABBITMQ", provider.type());
        assertFalse(provider.publisher().publish(MSG).accepted());
    }

    @Test
    @SuppressWarnings("unchecked")
    void redisExposesTypeAndFailsGracefully() {
        StreamCommands<String, String, String> streams = mock(StreamCommands.class);
        when(streams.xadd(anyString(), anyMap())).thenThrow(new RuntimeException("unreachable"));
        RedisDataSource redis = mock(RedisDataSource.class);
        when(redis.stream(String.class, String.class, String.class)).thenReturn(streams);

        var provider = new RedisMessageBrokerProvider(redis);
        assertEquals("REDIS", provider.type());
        assertFalse(provider.publisher().publish(MSG).accepted());
    }

    @Test
    void jmsExposesTypeAndFailsGracefully() {
        var provider = new JmsMessageBrokerProvider("tcp://localhost:61617", Optional.empty(), Optional.empty());
        assertEquals("JMS", provider.type());
        assertFalse(provider.publisher().publish(MSG).accepted());
    }
}
