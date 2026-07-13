package com.integrationhub.platform.integration;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;

/**
 * #2 (extensión — cobertura de conexión) E2E vía REST: al PUBLICAR (active=true) un proceso con un MT101_PAY seguido de
 * un MT101_STATUS(resolveNormalPay=true), el STATUS debe usar el mismo connectionRef que el PAY; si difiere, 400
 * (fail-loud: si no, el resolutor leería un ledger distinto y cerraría el proceso con dinero incierto). A través del
 * stack JAX-RS → ProcessCatalogService → validador.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101PayStatusConnectionCoverageValidatorIT {

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void rejectsResolverOnADifferentConnection() {
        given().contentType(ContentType.JSON)
                .body(definition("cc-reject", true, List.of(
                        payTask(1, "{\"connectionRef\":\"12\",\"continueOnFailure\":true}"),
                        statusTask(2, "{\"mode\":\"query\",\"resolveNormalPay\":true,\"connectionRef\":\"99\"}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(400);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void acceptsResolverOnTheSameConnection() {
        given().contentType(ContentType.JSON)
                .body(definition("cc-accept", true, List.of(
                        payTask(1, "{\"connectionRef\":\"12\",\"continueOnFailure\":true}"),
                        statusTask(2, "{\"mode\":\"query\",\"resolveNormalPay\":true,\"connectionRef\":\"12\"}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(200);
    }

    private Map<String, Object> definition(String name, boolean active, List<Map<String, Object>> tasks) {
        return Map.of("name", name, "description", "connection-coverage test", "active", active,
                "scheduled", false, "scheduleEvery", "", "tasks", tasks);
    }

    private Map<String, Object> payTask(int order, String configJson) {
        return Map.of("taskOrder", order, "taskType", "MT101_PAY", "configurationJson", configJson);
    }

    private Map<String, Object> statusTask(int order, String configJson) {
        return Map.of("taskOrder", order, "taskType", "MT101_STATUS", "configurationJson", configJson);
    }
}
