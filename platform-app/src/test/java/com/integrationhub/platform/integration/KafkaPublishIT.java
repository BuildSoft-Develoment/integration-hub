// @covers RF-006 (reingenieria: prueba que cubre el/los RF en produccion — observabilidad-y-auditoria: publicacion al backbone de auditoria)
package com.integrationhub.platform.integration;

import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import com.integrationhub.platform.spi.messaging.OutboundMessage;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E del productor contra un Kafka real (Testcontainers): el SPI KAFKA publica al
 * topic audit-events y un consumidor crudo recupera la trama con su clave (traceId).
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
@QuarkusTestResource(value = KafkaTestResource.class, restrictToAnnotatedClass = true)
class KafkaPublishIT {

    @Inject
    MessageBrokerRegistry brokerRegistry;

    @Test
    void publishesEnvelopeToKafka() {
        var publisher = brokerRegistry.resolve("KAFKA").publisher();
        var payload = "{\"eventId\":\"evt-1\",\"hello\":\"kafka\"}";

        var result = publisher.publish(new OutboundMessage("audit-events", "exec-99", payload, Map.of()));
        assertTrue(result.accepted(), "el broker debe confirmar la publicacion");

        try (var consumer = consumer()) {
            consumer.subscribe(List.of("audit-events"));
            var deadline = System.currentTimeMillis() + 15000;
            String value = null;
            String key = null;
            while (System.currentTimeMillis() < deadline && value == null) {
                var records = consumer.poll(Duration.ofMillis(500));
                for (var record : records) {
                    value = record.value();
                    key = record.key();
                }
            }
            assertEquals("exec-99", key, "la clave de particion debe ser el traceId");
            assertTrue(value != null && value.contains("\"hello\":\"kafka\""), "el payload debe llegar intacto");
        }
    }

    private KafkaConsumer<String, String> consumer() {
        var props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaTestResource.bootstrapServers());
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "kafka-publish-it");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        return new KafkaConsumer<>(props);
    }
}
