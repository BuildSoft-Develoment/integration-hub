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
 * #2 (cobertura de rutas) E2E vía REST: al PUBLICAR (active=true) un proceso con MT101_ROUTE (rutas declaradas) y un
 * MT101_STATUS route-aware (routeQuery), routeQuery debe cubrir todas las rutas declaradas; si falta alguna, 400
 * (fail-loud al guardar en vez de fallar en runtime). A través del stack JAX-RS → ProcessCatalogService → validador.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class Mt101StatusRouteCoverageValidatorIT {

    private static final String ROUTE_TWO = "{\"rules\":["
            + "{\"name\":\"a\",\"predicate\":\"x==1\",\"routeTo\":\"REST_A\"},"
            + "{\"name\":\"b\",\"predicate\":\"x==2\",\"routeTo\":\"SFTP_B\"}],\"defaultRoute\":\"UNROUTED\"}";

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void rejectsRouteAwareStatusMissingADeclaredRoute() {
        given().contentType(ContentType.JSON)
                .body(definition("rc-reject", true, List.of(
                        routeTask(1, ROUTE_TWO),
                        statusTask(2, "{\"mode\":\"query\",\"routeQuery\":{\"REST_A\":{\"url\":\"https://a\"}}}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(400);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void acceptsRouteAwareStatusCoveringAllDeclaredRoutes() {
        given().contentType(ContentType.JSON)
                .body(definition("rc-accept", true, List.of(
                        routeTask(1, ROUTE_TWO),
                        statusTask(2, "{\"mode\":\"query\",\"routeQuery\":{"
                                + "\"REST_A\":{\"url\":\"https://a\"},\"SFTP_B\":{\"url\":\"sftp://b\"}}}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(200);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void acceptsNonRouteAwareStatus() {
        // Sin routeQuery el STATUS usa query.url único: no se exige cobertura por ruta.
        given().contentType(ContentType.JSON)
                .body(definition("rc-single", true, List.of(
                        routeTask(1, ROUTE_TWO),
                        statusTask(2, "{\"mode\":\"query\",\"query\":{\"url\":\"https://single\"}}"))))
                .when().post("/api/process-definitions")
                .then().statusCode(200);
    }

    private Map<String, Object> definition(String name, boolean active, List<Map<String, Object>> tasks) {
        return Map.of("name", name, "description", "route-coverage test", "active", active,
                "scheduled", false, "scheduleEvery", "", "tasks", tasks);
    }

    private Map<String, Object> routeTask(int order, String configJson) {
        return Map.of("taskOrder", order, "taskType", "MT101_ROUTE", "configurationJson", configJson);
    }

    private Map<String, Object> statusTask(int order, String configJson) {
        return Map.of("taskOrder", order, "taskType", "MT101_STATUS", "configurationJson", configJson);
    }
}
