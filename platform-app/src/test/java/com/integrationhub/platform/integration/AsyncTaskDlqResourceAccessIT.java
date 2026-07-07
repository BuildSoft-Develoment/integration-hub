package com.integrationhub.platform.integration;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

/**
 * Gating de la API DLQ (paso 0 de la UI de operaciones async): los <b>reads</b> de salud
 * (summary/dead/stalled) están abiertos a los 5 roles de lectura — igual que /overview-summary y
 * /progress — para que la consola DLQ y el tile de overview no den 403 a payments-operator ni auditor.
 * Las acciones <b>mutantes</b> (redrive) siguen restringidas a admin.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncTaskDlqResourceAccessIT {

    @Test
    @TestSecurity(user = "aud", roles = {"auditor"})
    void auditorCanReadDlqSummary() {
        given().when().get("/api/query/tasks-dlq/summary").then().statusCode(200);
    }

    @Test
    @TestSecurity(user = "pay", roles = {"payments-operator"})
    void paymentsOperatorCanReadDeadAndStalled() {
        given().when().get("/api/query/tasks-dlq/dead").then().statusCode(200);
        given().when().get("/api/query/tasks-dlq/stalled").then().statusCode(200);
    }

    @Test
    @TestSecurity(user = "aud", roles = {"auditor"})
    void auditorCannotRedriveOutbox() {
        given().when().post("/api/query/tasks-dlq/outbox/redrive").then().statusCode(403);
    }

    @Test
    @TestSecurity(user = "pay", roles = {"payments-operator"})
    void paymentsOperatorCannotRequeueSuspension() {
        given().when().post("/api/query/tasks-dlq/suspensions/1/1/requeue").then().statusCode(403);
    }
}
