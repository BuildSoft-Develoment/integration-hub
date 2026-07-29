package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.vertical.swift.mt101.service.Mt101PayStatusConnectionCoverageValidator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * #2 (extensión — cobertura de conexión): un MT101_STATUS(resolveNormalPay=true) posterior a un MT101_PAY debe usar el
 * mismo connectionRef; si no, leería el set de fragmentos desde otro ledger y cerraría el proceso con dinero incierto.
 */
class Mt101PayStatusConnectionCoverageValidatorTest {

    private final Mt101PayStatusConnectionCoverageValidator validator =
            new Mt101PayStatusConnectionCoverageValidator(new ObjectMapper());

    @Test
    void resolverWithSameConnectionIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"connectionRef\":\"12\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true,\"connectionRef\":\"12\"}"))));
    }

    @Test
    void resolverWithDifferentConnectionIsRejected() {
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"connectionRef\":\"12\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true,\"connectionRef\":\"99\"}"))));
        assertTrue(error.getMessage().contains("connectionRef"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void bothOnDefaultConnectionIsAccepted() {
        // Ambos sin connectionRef → conexión por defecto en los dos → coinciden.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true}"))));
    }

    @Test
    void payWithConnectionAndResolverOnDefaultIsRejected() {
        // PAY escribe en la conexión '12'; el resolutor lee el default → set vacío → rechazado.
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"connectionRef\":\"12\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true}"))));
        assertTrue(error.getMessage().contains("<default>"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void blankConnectionEqualsDefault() {
        // connectionRef en blanco normaliza a default → coincide con un PAY sin connectionRef.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"connectionRef\":\"   \",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true,\"connectionRef\":\"\"}"))));
    }

    @Test
    void confirmationStatusIsNotConstrained() {
        // Un STATUS de confirmación (sin resolveNormalPay) no es el resolutor in-process → no se exige misma conexión.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"connectionRef\":\"12\"}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"mode\":\"query\",\"connectionRef\":\"99\"}"))));
    }

    @Test
    void resolverBeforePayDoesNotCount() {
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_STATUS", 1, "{\"resolveNormalPay\":true,\"connectionRef\":\"99\"}"),
                new ProcessTaskView("MT101_PAY", 2, "{\"connectionRef\":\"12\"}"))));
    }

    @Test
    void emptyOrNullIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of()));
        assertDoesNotThrow(() -> validator.validate(null));
    }

    @Test
    void multiplePaysWithExplicitPairingIsAccepted() {
        // Dos bancos: cada STATUS declara resolvesPayTaskRef → se compara solo con SU PAY. Antes daba falso positivo
        // (comparaba PAY_A contra STATUS_B).
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"taskRef\":\"pay-a\",\"connectionRef\":\"A\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_PAY", 2, "{\"taskRef\":\"pay-b\",\"connectionRef\":\"B\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 3, "{\"resolveNormalPay\":true,\"resolvesPayTaskRef\":\"pay-a\",\"connectionRef\":\"A\"}"),
                new ProcessTaskView("MT101_STATUS", 4, "{\"resolveNormalPay\":true,\"resolvesPayTaskRef\":\"pay-b\",\"connectionRef\":\"B\"}"))));
    }

    @Test
    void multiplePaysWithoutPairingIsAmbiguous() {
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"taskRef\":\"pay-a\",\"connectionRef\":\"A\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_PAY", 2, "{\"taskRef\":\"pay-b\",\"connectionRef\":\"B\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 3, "{\"resolveNormalPay\":true,\"connectionRef\":\"A\"}"))));
        assertTrue(error.getMessage().contains("resolvesPayTaskRef"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void resolvesPayTaskRefToNonexistentPayIsRejected() {
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"taskRef\":\"pay-a\",\"connectionRef\":\"A\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true,\"resolvesPayTaskRef\":\"pay-ZZZ\",\"connectionRef\":\"A\"}"))));
        assertTrue(error.getMessage().contains("no earlier MT101_PAY"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void multiplePaysExplicitPairingDetectsWrongConnection() {
        // pay-b está en conexión B pero su STATUS lee A → debe rechazarse (leería el ledger equivocado).
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"taskRef\":\"pay-a\",\"connectionRef\":\"A\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_PAY", 2, "{\"taskRef\":\"pay-b\",\"connectionRef\":\"B\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 3, "{\"resolveNormalPay\":true,\"resolvesPayTaskRef\":\"pay-b\",\"connectionRef\":\"A\"}"))));
        assertTrue(error.getMessage().contains("connectionRef"), () -> "mensaje: " + error.getMessage());
    }

    // ===== ADR-017: la conexion BANCARIA por ruta (sinkRef), no solo el ledger =====

    private static final String PAY_ROUTES_A11_B22 =
            "{\"taskRef\":\"pay\",\"connectionRef\":\"12\",\"routeTransports\":{"
            + "\"BANCO_A\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":11}},"
            + "\"BANCO_B\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":22}}}}";

    @Test
    void acceptsWhenEachRouteQueriesTheSameBankSinkItDispatchedTo() {
        validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, PAY_ROUTES_A11_B22),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"resolveNormalPay\":true,\"connectionRef\":\"12\",\"routeQuery\":{"
                        + "\"BANCO_A\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":11}},"
                        + "\"BANCO_B\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":22}}}}")));
    }

    @Test
    void rejectsWhenARouteIsPaidToOneBankAndQueriedAgainstAnother() {
        // El pago de BANCO_A sale al sink 11 y su confirmacion se busca en el 33: el ACK no aparece nunca,
        // el fragmento se queda UNCERTAIN y en pantalla es indistinguible de un banco caido.
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, PAY_ROUTES_A11_B22),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"resolveNormalPay\":true,\"connectionRef\":\"12\",\"routeQuery\":{"
                        + "\"BANCO_A\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":33}}}}"))));

        assertTrue(error.getMessage().contains("BANCO_A"), () -> "mensaje: " + error.getMessage());
        assertTrue(error.getMessage().contains("UNCERTAIN"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void acceptsARouteThatOnlyOneSideDeclaresBySinkRef() {
        // BANCO_B no declara sinkRef en el STATUS (sigue inline o se consulta por REST): no hay nada que
        // cotejar. Exigirlo rechazaria la migracion gradual, que es como esto se adopta en la practica.
        validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, PAY_ROUTES_A11_B22),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"resolveNormalPay\":true,\"connectionRef\":\"12\",\"routeQuery\":{"
                        + "\"BANCO_A\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":11}},"
                        + "\"BANCO_B\":{\"transport\":\"SFTP\",\"sftp\":{\"host\":\"legacy\"}}}}")));
    }

    @Test
    void acceptsFullyInlineConfigurationsBecauseThereIsNothingComparable() {
        // Sin ningun sinkRef la regla no aplica. Es el caso de todos los procesos anteriores a ADR-017:
        // no se puede comparar host/credenciales sin falsos positivos, y por eso esto no se validaba.
        validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1,
                        "{\"connectionRef\":\"12\",\"routeTransports\":{\"BANCO_A\":{\"sftp\":{\"host\":\"a\"}}}}"),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"resolveNormalPay\":true,\"connectionRef\":\"12\","
                        + "\"routeQuery\":{\"BANCO_A\":{\"sftp\":{\"host\":\"b\"}}}}")));
    }

    @Test
    void rejectsADivergentRouteSinkEvenWhenTheStatusDoesNotResolveTheNormalPay() {
        // Este test aseveraba lo contrario: que sin `resolveNormalPay` no se miraban los sinks. Era un hueco,
        // no una decision — y el peor posible, porque el formulario no expone ese flag, asi que TODO proceso
        // armado desde la UI caia por aqui con la comprobacion apagada. El STATUS consulta BANCO_A contra el
        // sink 33 mientras el PAY lo despacha al 11: se paga en un banco y se pregunta en otro.
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, PAY_ROUTES_A11_B22),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"connectionRef\":\"12\",\"routeQuery\":{"
                        + "\"BANCO_A\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":33}}}}"))));
        assertTrue(error.getMessage().contains("BANCO_A"), () -> "mensaje: " + error.getMessage());
        assertTrue(error.getMessage().contains("UNCERTAIN"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void acceptsANonResolvingStatusThatQueriesTheSameSinkThePayDispatchesTo() {
        // La contraparte: sin conciliar, pero apuntando al mismo banco. No hay nada que objetar.
        validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, PAY_ROUTES_A11_B22),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"connectionRef\":\"12\",\"routeQuery\":{"
                        + "\"BANCO_A\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":11}}}}")));
    }

    @Test
    void acceptsMultiBankGraphsWhereEachPayServesItsOwnRoute() {
        // Sin `resolvesPayTaskRef` no se puede senalar UN pay, asi que se compara contra la UNION de los sinks
        // que los PAY usan para esa ruta. Comparar contra cada PAY por separado rechazaria este grafo legitimo:
        // PAY_A atiende BANCO_A y PAY_B atiende BANCO_B, y el STATUS consulta ambos donde corresponde.
        validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1,
                        "{\"taskRef\":\"pay-a\",\"connectionRef\":\"12\","
                        + "\"routeTransports\":{\"BANCO_A\":{\"sftp\":{\"sinkRef\":11}}}}"),
                new ProcessTaskView("MT101_PAY", 2,
                        "{\"taskRef\":\"pay-b\",\"connectionRef\":\"12\","
                        + "\"routeTransports\":{\"BANCO_B\":{\"sftp\":{\"sinkRef\":22}}}}"),
                new ProcessTaskView("MT101_STATUS", 3,
                        "{\"connectionRef\":\"12\",\"routeQuery\":{"
                        + "\"BANCO_A\":{\"sftp\":{\"sinkRef\":11}},"
                        + "\"BANCO_B\":{\"sftp\":{\"sinkRef\":22}}}}")));
    }

    @Test
    void ignoresARouteThatNoPayDispatches() {
        // El STATUS consulta una ruta que ningun PAY despacha por sinkRef: no hay con que comparar y exigirlo
        // rechazaria la migracion gradual. Es el mismo criterio que acceptsARouteThatOnlyOneSideDeclaresBySinkRef.
        validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, PAY_ROUTES_A11_B22),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"connectionRef\":\"12\",\"routeQuery\":{"
                        + "\"BANCO_Z\":{\"transport\":\"SFTP\",\"sftp\":{\"sinkRef\":99}}}}")));
    }

    @Test
    void malformedRouteConfigurationDoesNotBreakTheValidator() {
        // Config a medio escribir desde la UI (sinkRef como texto vacio, ruta sin bloque sftp): la regla se
        // salta esas rutas en vez de reventar. Un validador que explota con JSON raro bloquea el guardado.
        validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1,
                        "{\"connectionRef\":\"12\",\"routeTransports\":{"
                        + "\"BANCO_A\":{\"sftp\":{\"sinkRef\":\"\"}},\"BANCO_B\":{\"transport\":\"REST\"}}}"),
                new ProcessTaskView("MT101_STATUS", 2,
                        "{\"resolveNormalPay\":true,\"connectionRef\":\"12\",\"routeQuery\":{\"BANCO_A\":{}}}")));
    }
}
