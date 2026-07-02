package com.integrationhub.platform.integration;

import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;
import org.testcontainers.kafka.KafkaContainer;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka real (Testcontainers) para el IT E2E del productor. Determinista (no
 * dev-services): fija kafka.bootstrap.servers y enchufa el canal audit-out al
 * conector smallrye-kafka.
 */
public class KafkaTestResource implements QuarkusTestResourceLifecycleManager {

    private static final KafkaContainer KAFKA = new KafkaContainer("apache/kafka:3.7.0");

    public static String bootstrapServers() {
        return KAFKA.getBootstrapServers();
    }

    @Override
    public Map<String, String> start() {
        if (!KAFKA.isRunning()) {
            KAFKA.start();
        }
        Map<String, String> properties = new HashMap<>();
        properties.put("kafka.bootstrap.servers", KAFKA.getBootstrapServers());
        properties.put("mp.messaging.outgoing.audit-out.connector", "smallrye-kafka");
        return properties;
    }

    @Override
    public void stop() {
        if (KAFKA.isRunning()) {
            KAFKA.stop();
        }
    }
}
