package com.integrationhub.platform.integration;

import io.quarkus.test.junit.QuarkusTestProfile;

import java.util.Map;

public class IntegrationTestProfile implements QuarkusTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        return Map.of(
                "quarkus.oidc.enabled", "false",
                "quarkus.scheduler.enabled", "false",
                "quarkus.flyway.migrate-at-start", "true",
                "quarkus.otel.traces.exporter", "none",
                // El datasource viene de PostgresTestResource (no dev service). Apagar dev services
                // evita que las extensiones cloud (s3/gcs/azure-storage-blob) levanten emuladores
                // (Azurite/LocalStack) en cada @QuarkusTest.
                "quarkus.devservices.enabled", "false",
                "quarkus.kafka.devservices.enabled", "false",
                // La auditoria a nivel de registro a 1M genera ~1M tramas: se apaga en
                // los IT (su volumen lo cubren tests unitarios) para no inflar el spool.
                "audit.record-level.enabled", "false"
        );
    }
}
