package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.vertical.swift.mt101.service.Mt101PayResolutionValidator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * G2 (acotado): si un MT101_PAY tiene un MT101_STATUS(resolveNormalPay=true) POSTERIOR in-process, el PAY debe llevar
 * continueOnFailure=true (si no, el auto-resolutor queda muerto). NO exige resolutor (topología separada permitida) ni
 * fuerza resolveNormalPay en un STATUS de confirmación.
 */
class Mt101PayResolutionValidatorTest {

    private final Mt101PayResolutionValidator validator = new Mt101PayResolutionValidator(new ObjectMapper());

    @Test
    void payWithDownstreamResolverButNoContinueOnFailureIsRejected() {
        var error = assertThrows(IllegalArgumentException.class, () -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true}"))));
        assertTrue(error.getMessage().contains("continueOnFailure"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void payWithDownstreamResolverAndContinueOnFailureIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true}"))));
    }

    @Test
    void payFollowedByAConfirmationStatusIsAccepted() {
        // El STATUS posterior es una confirmación (resolveNormalPay ausente/false): NO exige continueOnFailure.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"mode\":\"query\"}"))));
    }

    @Test
    void payAloneIsAccepted() {
        // Topología correcta: el UNCERTAIN se resuelve en una ejecución SEPARADA. No se exige resolutor in-process.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("FILE_READ", 1, "{}"),
                new ProcessTaskView("MT101_PAY", 2, "{}"))));
    }

    @Test
    void resolverBeforePayDoesNotCount() {
        // Un STATUS(resolveNormalPay) ANTES del PAY (orden menor) no es "posterior" -> no aplica la regla.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("MT101_STATUS", 1, "{\"resolveNormalPay\":true}"),
                new ProcessTaskView("MT101_PAY", 2, "{}"))));
    }

    @Test
    void noPayIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of(
                new ProcessTaskView("FILE_READ", 1, "{}"),
                new ProcessTaskView("DB_WRITE", 2, "{}"))));
    }

    @Test
    void emptyOrNullIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of()));
        assertDoesNotThrow(() -> validator.validate(null));
    }

    // ---- #1: resolveNormalPay obligatorio por ambiente (mt101.pay.require-normal-pay-resolver=true) ----

    private final Mt101PayResolutionValidator requiringResolver =
            new Mt101PayResolutionValidator(new ObjectMapper(), true);

    @Test
    void whenEnvRequiresResolverPayWithoutDownstreamResolverIsRejected() {
        var error = assertThrows(IllegalArgumentException.class, () -> requiringResolver.validate(List.of(
                new ProcessTaskView("FILE_READ", 1, "{}"),
                new ProcessTaskView("MT101_PAY", 2, "{}"))));
        assertTrue(error.getMessage().contains("require-normal-pay-resolver"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void whenEnvRequiresResolverPayWithDownstreamResolverAndContinueOnFailureIsAccepted() {
        assertDoesNotThrow(() -> requiringResolver.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true}"))));
    }

    @Test
    void whenEnvRequiresResolverAConfirmationOnlyStatusStillFails() {
        // Un STATUS de confirmación (sin resolveNormalPay) no satisface la exigencia del ambiente.
        var error = assertThrows(IllegalArgumentException.class, () -> requiringResolver.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 2, "{\"mode\":\"query\"}"))));
        assertTrue(error.getMessage().contains("require-normal-pay-resolver"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void envRequirementDoesNotAffectProcessesWithoutPay() {
        assertDoesNotThrow(() -> requiringResolver.validate(List.of(
                new ProcessTaskView("FILE_READ", 1, "{}"),
                new ProcessTaskView("DB_WRITE", 2, "{}"))));
    }

    // ---- #1 (P1): multi-PAY debe emparejar por resolvesPayTaskRef, no "algún resolutor posterior" ----

    @Test
    void multiPayEachWithItsOwnResolverIsAccepted() {
        assertDoesNotThrow(() -> requiringResolver.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"taskRef\":\"pay-a\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_PAY", 2, "{\"taskRef\":\"pay-b\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 3, "{\"resolveNormalPay\":true,\"resolvesPayTaskRef\":\"pay-a\"}"),
                new ProcessTaskView("MT101_STATUS", 4, "{\"resolveNormalPay\":true,\"resolvesPayTaskRef\":\"pay-b\"}"))));
    }

    @Test
    void multiPayWherePayBHasNoResolverIsRejected() {
        // pay-b no tiene resolutor: el resolutor de orden 3 declara resolver pay-a. Antes esto pasaba en falso
        // (habia "algun" STATUS resolutor posterior). Ahora falla porque pay-b queda sin su emparejamiento.
        var error = assertThrows(IllegalArgumentException.class, () -> requiringResolver.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"taskRef\":\"pay-a\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_PAY", 2, "{\"taskRef\":\"pay-b\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 3, "{\"resolveNormalPay\":true,\"resolvesPayTaskRef\":\"pay-a\"}"))));
        assertTrue(error.getMessage().contains("require-normal-pay-resolver"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void multiPayBareResolverDoesNotSatisfyAnyPay() {
        // Un resolutor "pelado" (sin resolvesPayTaskRef) en un proceso multi-PAY no satisface a ningun PAY concreto.
        var error = assertThrows(IllegalArgumentException.class, () -> requiringResolver.validate(List.of(
                new ProcessTaskView("MT101_PAY", 1, "{\"taskRef\":\"pay-a\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_PAY", 2, "{\"taskRef\":\"pay-b\",\"continueOnFailure\":true}"),
                new ProcessTaskView("MT101_STATUS", 3, "{\"resolveNormalPay\":true}"))));
        assertTrue(error.getMessage().contains("require-normal-pay-resolver"), () -> "mensaje: " + error.getMessage());
    }
}
