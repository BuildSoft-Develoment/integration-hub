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
}
