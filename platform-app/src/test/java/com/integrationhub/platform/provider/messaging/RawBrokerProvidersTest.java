package com.integrationhub.platform.provider.messaging;

import com.integrationhub.platform.provider.messaging.jms.JmsMessageBrokerProvider;
import com.integrationhub.platform.provider.messaging.rabbitmq.RabbitMqMessageBrokerProvider;
import com.integrationhub.platform.provider.messaging.redis.RedisMessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Contrato de los conectores raw del SPI: exponen su type() y, ante un broker
 * inalcanzable, publish() devuelve un PublishResult fallido (no lanza) -> el relay
 * deja la trama PENDING y reintenta (cero perdida). El roundtrip real por broker se
 * valida en su propio entorno (Testcontainers), no aqui.
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
    void redisExposesTypeAndFailsGracefully() {
        var provider = new RedisMessageBrokerProvider("localhost", 6390);
        assertEquals("REDIS", provider.type());
        assertFalse(provider.publisher().publish(MSG).accepted());
    }

    @Test
    void jmsExposesTypeAndFailsGracefully() {
        var provider = new JmsMessageBrokerProvider("tcp://localhost:61617", "", "");
        assertEquals("JMS", provider.type());
        assertFalse(provider.publisher().publish(MSG).accepted());
    }
}
