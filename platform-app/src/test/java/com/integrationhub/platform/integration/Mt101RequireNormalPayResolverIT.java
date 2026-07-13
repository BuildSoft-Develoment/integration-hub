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
 * #1 (resolveNormalPay obligatorio por ambiente) E2E vía REST, con {@code mt101.pay.require-normal-pay-resolver=true}:
 * al PUBLICAR (active=true) un proceso con MT101_PAY, ese ambiente EXIGE un MT101_STATUS(resolveNormalPay=true)
 * POSTERIOR; si falta, 400. Con el resolutor + continueOnFailure, 200. A través del stack JAX-RS →
 * ProcessCatalogService → validador.
 */
@QuarkusTest
@TestProfile(RequireNormalPayResolverTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101RequireNormalPayResolverIT {

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void rejectsActivePayWithoutDownstreamResolverWhenEnvRequiresIt() {
        given().contentType(ContentType.JSON)
                .body(definition("req-reject", true, List.of(
                        payTask(1, "{\"taskRef\":\"pay\",\"transport\":\"REST\",\"continueOnFailure\":true}"),
                        statusTask(2, "{\"taskRef\":\"status\",\"mode\":\"query\"}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(400);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void acceptsActivePayWithDownstreamResolverAndContinueOnFailure() {
        given().contentType(ContentType.JSON)
                .body(definition("req-accept", true, List.of(
                        payTask(1, "{\"taskRef\":\"pay\",\"transport\":\"REST\",\"continueOnFailure\":true}"),
                        statusTask(2, "{\"taskRef\":\"status\",\"mode\":\"query\",\"resolveNormalPay\":true}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(200);
    }

    private Map<String, Object> definition(String name, boolean active, List<Map<String, Object>> tasks) {
        return Map.of("name", name, "description", "require-resolver test", "active", active,
                "scheduled", false, "scheduleEvery", "", "tasks", tasks);
    }

    private Map<String, Object> payTask(int order, String configJson) {
        return Map.of("taskOrder", order, "taskType", "MT101_PAY", "configurationJson", configJson);
    }

    private Map<String, Object> statusTask(int order, String configJson) {
        return Map.of("taskOrder", order, "taskType", "MT101_STATUS", "configurationJson", configJson);
    }
}
