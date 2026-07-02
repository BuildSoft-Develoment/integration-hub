package com.integrationhub.platform.integration;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

/**
 * @covers spec 008-mensajeria-pagos RF-011, RF-023
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class PaymentValidationRuleResourceIT {

    @Inject
    DataSource dataSource;

    @BeforeEach
    void cleanDatabase() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE TABLE payment_validation_rule RESTART IDENTITY CASCADE");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void adminCanImportListExportAndDisablePaymentRules() {
        var payload = Map.of(
                "ruleSet", "bank:BCP",
                "replaceExisting", true,
                "rules", List.of(
                        Map.of(
                                "ruleSet", "ignored-by-import",
                                "code", "BCP.CURRENCY",
                                "standard", "SWIFT",
                                "appliesTo", "MT101",
                                "severity", "E",
                                "predicateKind", "CURRENCY_ALLOWED",
                                "predicateBody", "{\"allowed\":[\"PEN\",\"USD\"]}",
                                "active", true
                        )
                )
        );

        given()
                .contentType(ContentType.JSON)
                .body(payload)
        .when()
                .post("/api/payment-validation-rules/import")
        .then()
                .statusCode(200)
                .body("ruleSet", equalTo("bank:BCP"))
                .body("importedCount", equalTo(1))
                .body("replacedExisting", equalTo(true));

        Integer ruleId =
                given()
                        .queryParam("ruleSet", "bank:BCP")
                .when()
                        .get("/api/payment-validation-rules")
                .then()
                        .statusCode(200)
                        .body("total", equalTo(1))
                        .body("items[0].code", equalTo("BCP.CURRENCY"))
                        .body("items[0].ruleSet", equalTo("bank:BCP"))
                        .extract()
                        .path("items[0].id");

        given()
        .when()
                .post("/api/payment-validation-rules/{ruleId}/activation/{active}", ruleId, false)
        .then()
                .statusCode(200)
                .body("active", equalTo(false));

        given()
                .queryParam("ruleSet", "bank:BCP")
        .when()
                .get("/api/payment-validation-rules/export")
        .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].active", equalTo(false));
    }

    @Test
    @TestSecurity(user = "payments-operator", roles = {"payments-operator"})
    void paymentsOperatorCannotEditBankProfiles() {
        given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "ruleSet", "bank:BCP",
                        "code", "BCP.CURRENCY",
                        "standard", "SWIFT",
                        "appliesTo", "MT101",
                        "severity", "E",
                        "predicateKind", "CURRENCY_ALLOWED",
                        "predicateBody", "{\"allowed\":[\"PEN\"]}",
                        "active", true
                ))
        .when()
                .post("/api/payment-validation-rules")
        .then()
                .statusCode(403);
    }
}
