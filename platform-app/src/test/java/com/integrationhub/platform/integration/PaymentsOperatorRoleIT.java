package com.integrationhub.platform.integration;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;

/**
 * Verifica el rol {@code payments-operator} introducido por spec 008 RF-019 y ADR-009.
 *
 * <p>El rol cumple dos condiciones:</p>
 * <ul>
 *   <li><b>PUEDE</b> ejecutar procesos via {@code POST /api/process-executions/&lt;id&gt;}.
 *       El test no requiere que el proceso exista (acepta 4xx que no sea 403):
 *       lo unico que importa es que el filtro de seguridad permita la llamada.</li>
 *   <li><b>NO PUEDE</b> editar catalogos del motor: el endpoint de creacion de
 *       sources retorna 403 cuando el caller solo tiene {@code payments-operator}.</li>
 * </ul>
 *
 * @covers spec 008-mensajeria-pagos RF-019
 * @covers ADR-009
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class PaymentsOperatorRoleIT {

    @Test
    @TestSecurity(user = "payments-operator", roles = {"payments-operator"})
    void paymentsOperatorCanReachExecuteEndpoint() {
        // El proceso 99999 no existe; lo importante es que el filtro de seguridad
        // PERMITE la llamada (no devuelve 401/403). El servicio responde con 4xx
        // de dominio (typicamente 404/400) que es lo esperable.
        int statusCode =
                given()
                        .contentType(ContentType.JSON)
                        .body(Map.of("executionVariables", Map.of()))
                        .when()
                        .post("/api/process-executions/{processDefinitionId}", 99999L)
                        .then()
                        .extract()
                        .statusCode();

        org.junit.jupiter.api.Assertions.assertNotEquals(401, statusCode,
                "payments-operator no debe recibir 401 en el endpoint de ejecucion");
        org.junit.jupiter.api.Assertions.assertNotEquals(403, statusCode,
                "payments-operator no debe recibir 403 en el endpoint de ejecucion");
    }

    @Test
    @TestSecurity(user = "payments-operator", roles = {"payments-operator"})
    void paymentsOperatorCannotEditMotorCatalogs() {
        // POST a source-definitions exige integration-admin o platform-admin (no
        // incluye payments-operator). El framework debe retornar 403.
        given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "should-be-forbidden",
                        "sourceType", "FILESYSTEM",
                        "active", true,
                        "configurationJson", "{}"
                ))
                .when()
                .post("/api/source-definitions")
                .then()
                .statusCode(403);
    }

    @Test
    @TestSecurity(user = "operator", roles = {"operator"})
    void existingOperatorRoleStillWorksAfterAddingPaymentsOperator() {
        // Regresion: el rol operator legacy NO debe romper al agregar payments-operator.
        int statusCode =
                given()
                        .contentType(ContentType.JSON)
                        .body(Map.of("executionVariables", Map.of()))
                        .when()
                        .post("/api/process-executions/{processDefinitionId}", 99999L)
                        .then()
                        .extract()
                        .statusCode();

        org.junit.jupiter.api.Assertions.assertNotEquals(401, statusCode);
        org.junit.jupiter.api.Assertions.assertNotEquals(403, statusCode);
    }
}
