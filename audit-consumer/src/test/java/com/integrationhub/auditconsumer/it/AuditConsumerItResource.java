package com.integrationhub.auditconsumer.it;

import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.kafka.KafkaContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;

/**
 * Postgres + Kafka reales para el IT del audit-consumer. Crea las tablas que el
 * consumidor escribe (el consumidor no corre Flyway) y enchufa el canal audit-in al
 * conector smallrye-kafka contra el Kafka del contenedor.
 */
public class AuditConsumerItResource implements QuarkusTestResourceLifecycleManager {

    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("audit_consumer_it")
            .withUsername("postgres")
            .withPassword("postgres");
    private static final KafkaContainer KAFKA = new KafkaContainer("apache/kafka:3.7.0");

    public static String bootstrapServers() {
        return KAFKA.getBootstrapServers();
    }

    @Override
    public Map<String, String> start() {
        if (!POSTGRES.isRunning()) {
            POSTGRES.start();
        }
        if (!KAFKA.isRunning()) {
            KAFKA.start();
        }
        createSchema();

        Map<String, String> config = new HashMap<>();
        config.put("quarkus.datasource.jdbc.url", POSTGRES.getJdbcUrl());
        config.put("quarkus.datasource.username", POSTGRES.getUsername());
        config.put("quarkus.datasource.password", POSTGRES.getPassword());
        config.put("kafka.bootstrap.servers", KAFKA.getBootstrapServers());
        config.put("mp.messaging.incoming.audit-in.connector", "smallrye-kafka");
        config.put("quarkus.devservices.enabled", "false");
        return config;
    }

    private void createSchema() {
        try (Connection connection = DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             Statement statement = connection.createStatement()) {
            statement.execute("""
                    create table if not exists audit_record_event (
                        id bigserial primary key,
                        event_id varchar(64) not null,
                        trace_id varchar(120),
                        record_id varchar(512),
                        stage varchar(80) not null,
                        status varchar(30),
                        process_execution_id bigint,
                        task_definition_id bigint,
                        message text,
                        payload_json text,
                        standard varchar(20),
                        message_type varchar(30),
                        source_file_name varchar(255),
                        source_file_hash char(64),
                        record_number bigint,
                        business_key varchar(120),
                        business_key_hash char(64),
                        payment_reference varchar(40),
                        transaction_reference varchar(40),
                        uetr varchar(36),
                        archive_id bigint,
                        gateway_reference varchar(120),
                        event_ts timestamp not null,
                        ingested_at timestamp not null default current_timestamp)""");
            statement.execute("create unique index if not exists ux_arce on audit_record_event (event_id)");
            statement.execute("""
                    create table if not exists audit_dead_letter_event (
                        id bigserial primary key,
                        event_id varchar(64),
                        broker_type varchar(30),
                        topic varchar(160),
                        payload text not null,
                        error_message text not null,
                        payload_hash char(64),
                        created_at timestamp not null default current_timestamp)""");
            statement.execute("create unique index if not exists ux_adle_hash on audit_dead_letter_event (payload_hash)");
        } catch (Exception error) {
            throw new IllegalStateException("Cannot create audit-consumer IT schema", error);
        }
    }

    @Override
    public void stop() {
        // Contenedores estaticos: se reutilizan; Ryuk los limpia al final del build.
    }
}
