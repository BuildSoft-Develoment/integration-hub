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
                "quarkus.otel.traces.exporter", "none"
        );
    }
}