package com.integrationhub.platform.integration;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.service.execution.AuditService;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * E2E real del camino de auditoria a nivel de registro con record-level ACTIVO:
 * {@code AuditService.emitRecords -> audit_spool -> OutboxRelay (claimDue real,
 * scheduler ON) -> Kafka (Testcontainers)}. Verifica que las tramas RECORD fluyen
 * por el spool y el relay las drena al broker sin backlog permanente.
 *
 * <p>Escala moderada (determinista). La corrida 1M completa es un job de CI con
 * Kafka+Postgres reales y el audit-consumer corriendo; la mitad consumidor->cold
 * store esta cubierta por los tests de audit-consumer.</p>
 */
@QuarkusTest
@TestProfile(AuditRelayKafkaE2EIT.AuditRelayProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
@QuarkusTestResource(KafkaTestResource.class)
class AuditRelayKafkaE2EIT {

    private static final int EVENT_COUNT = 300;

    @Inject
    AuditService auditService;

    @Test
    void recordEventsDrainThroughSpoolAndRelayToKafka() {
        var traceId = "exec-77777";
        var envelopes = new ArrayList<AuditEnvelope>(EVENT_COUNT);
        for (int i = 0; i < EVENT_COUNT; i++) {
            envelopes.add(new AuditEnvelope(
                    UUID.randomUUID().toString(),
                    traceId,
                    "LFLS" + i,
                    AuditLevel.RECORD,
                    "RECORD_SENT",
                    "SENT",
                    77777L,
                    1L,
                    null,
                    null,
                    Map.of(),
                    Instant.now(),
                    AuditEnvelope.CURRENT_SCHEMA_VERSION));
        }

        auditService.emitRecords(envelopes);

        // El relay (scheduler ON) reclama PENDING y publica al topic. Contamos eventIds
        // distintos para tolerar la entrega at-least-once.
        Set<String> seen = new HashSet<>();
        try (var consumer = consumer()) {
            consumer.subscribe(List.of("audit-events"));
            var deadline = System.currentTimeMillis() + 60000;
            while (System.currentTimeMillis() < deadline && seen.size() < EVENT_COUNT) {
                var records = consumer.poll(Duration.ofMillis(500));
                for (var record : records) {
                    if (record.value() != null && record.value().contains("\"level\":\"RECORD\"")) {
                        seen.add(record.value());
                    }
                }
            }
        }
        assertTrue(seen.size() >= EVENT_COUNT,
                "el relay debe drenar las " + EVENT_COUNT + " tramas RECORD a Kafka; llegaron " + seen.size());
    }

    private KafkaConsumer<String, String> consumer() {
        var props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaTestResource.bootstrapServers());
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "audit-relay-e2e-it");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        return new KafkaConsumer<>(props);
    }

    public static class AuditRelayProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "quarkus.oidc.enabled", "false",
                    "quarkus.scheduler.enabled", "true",
                    "quarkus.otel.traces.exporter", "none",
                    "quarkus.flyway.migrate-at-start", "true",
                    "quarkus.devservices.enabled", "false",
                    "audit.record-level.enabled", "true",
                    "audit.relay.enabled", "true",
                    "audit.relay.every", "500ms");
        }
    }
}
