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
import java.util.Map;

import static io.restassured.RestAssured.given;

/**
 * #5 (validación temprana de config de reader): {@code POST/PUT /api/reader-definitions} valida la configuración al
 * CREAR/ACTUALIZAR (no diferida a runtime). Un CSV sin campos, o un tipo de reader no soportado, devuelven <b>400</b>
 * claro en la consola en vez de aceptar la definición y reventar recién al ejecutar. La ruta feliz (CSV con campos)
 * sigue devolviendo 200. A través del stack JAX-RS → servicio → registry → provider, con autorización por rol.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class ReaderDefinitionValidationIT {

    @Inject
    DataSource dataSource;

    private static final String CSV_WITH_FIELDS =
            "{\"delimiter\":\",\",\"encoding\":\"UTF-8\",\"fields\":[{\"name\":\"codigo\",\"position\":1}]}";
    private static final String CSV_WITHOUT_FIELDS =
            "{\"delimiter\":\",\",\"encoding\":\"UTF-8\"}";

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("delete from reader_definition where name like 'rdr-v5-%'");
        }
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void rejectsCsvWithoutFieldsWith400() {
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "rdr-v5-nofields", "readerType", "CSV", "active", true,
                        "configurationJson", CSV_WITHOUT_FIELDS))
                .when().post("/api/reader-definitions")
                .then().statusCode(400);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void rejectsUnsupportedReaderTypeWith400() {
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "rdr-v5-unknown", "readerType", "NOPE_UNSUPPORTED", "active", true,
                        "configurationJson", CSV_WITH_FIELDS))
                .when().post("/api/reader-definitions")
                .then().statusCode(400);
    }

    @Test
    @TestSecurity(user = "admin", roles = {"platform-admin"})
    void acceptsValidCsvWith200AndRejectsUpdateThatRemovesFields() {
        // Ruta feliz: CSV con campos → 200.
        Number id = given().contentType(ContentType.JSON)
                .body(Map.of("name", "rdr-v5-ok", "readerType", "CSV", "active", true,
                        "configurationJson", CSV_WITH_FIELDS))
                .when().post("/api/reader-definitions")
                .then().statusCode(200)
                .extract().path("id");

        // La misma validación aplica al ACTUALIZAR: quitar los campos → 400 (no se degrada la definición).
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "rdr-v5-ok", "readerType", "CSV", "active", true,
                        "configurationJson", CSV_WITHOUT_FIELDS))
                .when().put("/api/reader-definitions/" + id)
                .then().statusCode(400);
    }
}
