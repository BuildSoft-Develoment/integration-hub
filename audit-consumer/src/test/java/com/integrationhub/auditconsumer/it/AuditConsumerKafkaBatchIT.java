package com.integrationhub.auditconsumer.it;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.time.Instant;
import java.util.Map;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * IT real del audit-consumer: produce RECORD + 1 poison a Kafka, el consumidor los
 * toma en LOTE ({@code batch=true}, {@code consume(List)}) y persiste en cold store +
 * DLQ. Valida wiring del conector batch, idempotencia (event_id) y dedup del DLQ.
 */
@QuarkusTest
@QuarkusTestResource(AuditConsumerItResource.class)
class AuditConsumerKafkaBatchIT {

    private static final int RECORD_COUNT = 200;
    private static final String TOPIC = "audit-events";

    @Inject
    ObjectMapper objectMapper;

    @Inject
    DataSource dataSource;

    @Test
    void consumesBatchPersistsRecordsAndDeadLettersPoison() throws Exception {
        produceBatch();                      // N RECORD (event_id fijo) + 1 poison
        awaitCount("audit_record_event", RECORD_COUNT, 60000);
        awaitCount("audit_dead_letter_event", 1, 30000);

        // Reentrega de LOS MISMOS event_id + el mismo poison: idempotencia + dedup DLQ.
        produceBatch();
        Thread.sleep(4000);
        assertEquals(RECORD_COUNT, count("audit_record_event"), "idempotencia por event_id");
        assertEquals(1, count("audit_dead_letter_event"), "dedup del DLQ por payload_hash");
    }

    // event_id fijo ("evt-i") en ambas pasadas para probar idempotencia (ON CONFLICT);
    // el poison es el mismo texto -> mismo payload_hash -> dedup del DLQ.
    private void produceBatch() throws Exception {
        try (var producer = producer()) {
            for (int i = 0; i < RECORD_COUNT; i++) {
                var envelope = new AuditEnvelope(
                        "evt-" + i, "exec-it", "LFLS" + i, AuditLevel.RECORD,
                        "RECORD_SENT", "SENT", 1L, 1L, null, null, Map.of(),
                        Instant.now(), AuditEnvelope.CURRENT_SCHEMA_VERSION);
                producer.send(new ProducerRecord<>(TOPIC, envelope.recordId(),
                        objectMapper.writeValueAsString(envelope)));
            }
            producer.send(new ProducerRecord<>(TOPIC, "poison", "{not a valid envelope"));
            producer.flush();
        }
    }
    private KafkaProducer<String, String> producer() {
        var props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, AuditConsumerItResource.bootstrapServers());
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        return new KafkaProducer<>(props);
    }

    private void awaitCount(String table, int expected, long timeoutMs) throws Exception {
        var deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            if (count(table) >= expected) {
                return;
            }
            Thread.sleep(500);
        }
        assertTrue(count(table) >= expected,
                table + " esperaba >=" + expected + " pero hay " + count(table));
    }

    private int count(String table) throws Exception {
        try (var connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery("select count(*) from " + table)) {
            rs.next();
            return rs.getInt(1);
        }
    }
}
