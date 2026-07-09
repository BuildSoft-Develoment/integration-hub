package com.integrationhub.platform.service.process;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.process.Mt101PayResolutionValidator.TaskView;
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
                new TaskView("MT101_PAY", 1, "{}"),
                new TaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true}"))));
        assertTrue(error.getMessage().contains("continueOnFailure"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void payWithDownstreamResolverAndContinueOnFailureIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of(
                new TaskView("MT101_PAY", 1, "{\"continueOnFailure\":true}"),
                new TaskView("MT101_STATUS", 2, "{\"resolveNormalPay\":true}"))));
    }

    @Test
    void payFollowedByAConfirmationStatusIsAccepted() {
        // El STATUS posterior es una confirmación (resolveNormalPay ausente/false): NO exige continueOnFailure.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new TaskView("MT101_PAY", 1, "{}"),
                new TaskView("MT101_STATUS", 2, "{\"mode\":\"query\"}"))));
    }

    @Test
    void payAloneIsAccepted() {
        // Topología correcta: el UNCERTAIN se resuelve en una ejecución SEPARADA. No se exige resolutor in-process.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new TaskView("FILE_READ", 1, "{}"),
                new TaskView("MT101_PAY", 2, "{}"))));
    }

    @Test
    void resolverBeforePayDoesNotCount() {
        // Un STATUS(resolveNormalPay) ANTES del PAY (orden menor) no es "posterior" -> no aplica la regla.
        assertDoesNotThrow(() -> validator.validate(List.of(
                new TaskView("MT101_STATUS", 1, "{\"resolveNormalPay\":true}"),
                new TaskView("MT101_PAY", 2, "{}"))));
    }

    @Test
    void noPayIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of(
                new TaskView("FILE_READ", 1, "{}"),
                new TaskView("DB_WRITE", 2, "{}"))));
    }

    @Test
    void emptyOrNullIsAccepted() {
        assertDoesNotThrow(() -> validator.validate(List.of()));
        assertDoesNotThrow(() -> validator.validate(null));
    }
}
