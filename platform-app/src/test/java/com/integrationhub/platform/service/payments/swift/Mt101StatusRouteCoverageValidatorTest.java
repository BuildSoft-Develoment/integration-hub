package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * #2 (cobertura de rutas): un MT101_STATUS route-aware (routeQuery) debe cubrir todas las rutas declaradas
 * (rules[].routeTo) por un MT101_ROUTE upstream; si falta alguna, 400 al publicar (no fallo ruidoso en runtime).
 */
class Mt101StatusRouteCoverageValidatorTest {

    private final Mt101StatusRouteCoverageValidator validator =
            new Mt101StatusRouteCoverageValidator(new ObjectMapper());

    private static final String ROUTE_TWO = "{\"rules\":["
            + "{\"name\":\"a\",\"predicate\":\"x==1\",\"routeTo\":\"REST_A\"},"
            + "{\"name\":\"b\",\"predicate\":\"x==2\",\"routeTo\":\"SFTP_B\"}],\"defaultRoute\":\"UNROUTED\"}";

    @Test
    void routeAwareStatusMissingADeclaredRouteIsRejected() {
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_ROUTE", 1, ROUTE_TWO),
                new ProcessTaskView("MT101_STATUS", 2, "{\"routeQuery\":{\"REST_A\":{\"url\":\"https://a\"}}}"))));
        assertTrue(error.getMessage().contains("SFTP_B"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void routeAwareStatusCoveringAllDeclaredRoutesIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_ROUTE", 1, ROUTE_TWO),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"routeQuery\":{\"REST_A\":{\"url\":\"https://a\"},\"SFTP_B\":{\"url\":\"sftp://b\"}}}"))));
    }

    @Test
    void statusWithoutRouteQueryIsNotRouteAwareSoAccepted() {
        // Sin routeQuery: query.url único (caso aceptado); no se exige cobertura por ruta.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_ROUTE", 1, ROUTE_TWO),
                new ProcessTaskView("MT101_STATUS", 2, "{\"query\":{\"url\":\"https://single\"}}"))));
    }

    @Test
    void routeAwareStatusWithoutUpstreamRouteIsAccepted() {
        // Sin MT101_ROUTE upstream no se conocen rutas → no se inventa exigencia.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_STATUS", 1, "{\"routeQuery\":{\"REST_A\":{\"url\":\"https://a\"}}}"))));
    }

    @Test
    void defaultRouteIsNotRequiredInRouteQuery() {
        // El defaultRoute (bucket "no matcheó ninguna regla") no es un destino nombrado: no se exige cubrirlo.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_ROUTE", 1,
                        "{\"rules\":[{\"name\":\"a\",\"predicate\":\"x==1\",\"routeTo\":\"REST_A\"}],"
                        + "\"defaultRoute\":\"UNROUTED\"}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"routeQuery\":{\"REST_A\":{\"url\":\"https://a\"}}}"))));
    }

    @Test
    void routeDeclaredAfterStatusDoesNotCount() {
        // Un MT101_ROUTE con orden mayor que el STATUS no es upstream → no aporta rutas exigibles.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_STATUS", 1, "{\"routeQuery\":{\"REST_A\":{\"url\":\"https://a\"}}}"),
                new ProcessTaskView("MT101_ROUTE", 2, ROUTE_TWO))));
    }

    @Test
    void emptyOrNullIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of()));
        assertDoesNotThrow(() -> validator.validate(null));
    }
}
