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
 * G2 (acotado) E2E vía REST: al PUBLICAR (active=true) un proceso con MT101_PAY seguido de
 * MT101_STATUS(resolveNormalPay=true), el MT101_PAY debe llevar continueOnFailure=true; si no, 400 (fail-loud). No
 * exige resolutor (PAY solo = 200). A través del stack JAX-RS → ProcessCatalogService → validador.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101PayResolutionValidatorIT {

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void rejectsActivePayWithDownstreamResolverButNoContinueOnFailure() {
        given().contentType(ContentType.JSON)
                .body(definition("g2-reject", true, List.of(
                        payTask(1, "{\"taskRef\":\"pay\",\"transport\":\"REST\"}"),
                        statusTask(2, "{\"taskRef\":\"status\",\"mode\":\"query\",\"resolveNormalPay\":true}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(400);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void acceptsActivePayWithDownstreamResolverAndContinueOnFailure() {
        given().contentType(ContentType.JSON)
                .body(definition("g2-accept", true, List.of(
                        payTask(1, "{\"taskRef\":\"pay\",\"transport\":\"REST\",\"continueOnFailure\":true}"),
                        statusTask(2, "{\"taskRef\":\"status\",\"mode\":\"query\",\"resolveNormalPay\":true}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(200);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void allowsBadWiringAsDraftButRejectsOnActivation() {
        // Un BORRADOR (active=false) con el cableado malo se guarda libre (no se valida hasta publicar/activar).
        var id = given().contentType(ContentType.JSON)
                .body(definition("g2-draft", false, List.of(
                        payTask(1, "{\"taskRef\":\"pay\",\"transport\":\"REST\"}"),
                        statusTask(2, "{\"taskRef\":\"status\",\"mode\":\"query\",\"resolveNormalPay\":true}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(200)
                .extract().jsonPath().getLong("id");

        // Activarlo (publicar) valida el cableado persistido -> 400 (el auto-resolutor quedaría muerto).
        given().contentType(ContentType.JSON)
                .when().post("/api/process-definitions/{id}/activation/{active}", id, true)
                .then().statusCode(400);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void acceptsActivePayWithoutInProcessResolver() {
        // Topología correcta: el UNCERTAIN se resuelve en una ejecución SEPARADA. No se exige resolutor in-process.
        given().contentType(ContentType.JSON)
                .body(definition("g2-pay-only", true, List.of(
                        payTask(1, "{\"taskRef\":\"pay\",\"transport\":\"REST\"}"),
                        statusTask(2, "{\"taskRef\":\"status\",\"mode\":\"query\"}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(200);
    }

    private Map<String, Object> definition(String name, boolean active, List<Map<String, Object>> tasks) {
        return Map.of("name", name, "description", "g2 test", "active", active,
                "scheduled", false, "scheduleEvery", "", "tasks", tasks);
    }

    private Map<String, Object> payTask(int order, String configJson) {
        return Map.of("taskOrder", order, "taskType", "MT101_PAY", "configurationJson", configJson);
    }

    private Map<String, Object> statusTask(int order, String configJson) {
        return Map.of("taskOrder", order, "taskType", "MT101_STATUS", "configurationJson", configJson);
    }
}
