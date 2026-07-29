package com.integrationhub.vertical.swift.mt101.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Emparejamiento STATUS -> PAY por {@code resolvesPayTaskRef}.
 *
 * <p>El caso que da nombre a esta clase es el del {@code taskRef} repetido. Esta ruta es de
 * <b>validacion al guardar</b> —su unico llamante es {@code Mt101PayStatusConnectionCoverageValidator}—
 * y no de ejecucion: en ejecucion el STATUS localiza su fragment set por {@code input.sourceTaskRef}
 * contra {@code taskOutputs}, sin mirar la lista de PAY. Coger el primero haria que la cobertura de
 * conexiones se validara contra el PAY equivocado y devolviera un verde falso.
 *
 * <p>{@code TaskRefUniquenessValidator} ya rechaza los duplicados al guardar, asi que en el flujo
 * normal salta antes; esto es defensa en profundidad para cuando ese validador no este registrado o el
 * orden de iteracion de {@code Instance<ProcessDefinitionValidator>} —que CDI no garantiza— ponga a
 * este primero.
 */
class Mt101PayResolverPairingTest {

    private final Mt101PayResolverPairing pairing = new Mt101PayResolverPairing(new ObjectMapper());

    private static ProcessTaskView pay(int order, String taskRef) {
        return new ProcessTaskView("MT101_PAY", order, "{\"taskRef\":\"" + taskRef + "\"}");
    }

    private static ProcessTaskView resolver(int order, String resolvesRef) {
        var config = resolvesRef == null
                ? "{\"resolveNormalPay\":true}"
                : "{\"resolveNormalPay\":true,\"resolvesPayTaskRef\":\"" + resolvesRef + "\"}";
        return new ProcessTaskView("MT101_STATUS", order, config);
    }

    @Test
    void twoEarlierPaysSharingTheTaskRefFailInsteadOfPickingTheFirst() {
        var pays = List.of(pay(1, "cobros"), pay(2, "cobros"));

        var error = assertThrows(IllegalArgumentException.class,
                () -> pairing.payForResolver(resolver(3, "cobros"), pays));

        assertTrue(error.getMessage().contains("2 earlier MT101_PAY tasks share that taskRef"),
                () -> "mensaje: " + error.getMessage());
        // El mensaje nombra los taskOrder para que el operador sepa cuales desambiguar.
        assertTrue(error.getMessage().contains("[1, 2]"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void aSingleMatchResolvesToThatPay() {
        var pays = List.of(pay(1, "nomina"), pay(2, "proveedores"));

        assertEquals(2, pairing.payForResolver(resolver(3, "proveedores"), pays).taskOrder());
    }

    @Test
    void aTaskRefRepeatedOnlyAfterTheResolverDoesNotCount() {
        // Solo cuentan los PAY ANTERIORES: el duplicado posterior no puede ser el resuelto, asi que no
        // debe convertir en error un proceso que si es determinista.
        var pays = List.of(pay(1, "cobros"), pay(5, "cobros"));

        assertEquals(1, pairing.payForResolver(resolver(3, "cobros"), pays).taskOrder());
    }

    @Test
    void aRefThatMatchesNoEarlierPayIsRejected() {
        var error = assertThrows(IllegalArgumentException.class,
                () -> pairing.payForResolver(resolver(3, "inexistente"), List.of(pay(1, "cobros"))));

        assertTrue(error.getMessage().contains("no earlier MT101_PAY with that taskRef"),
                () -> "mensaje: " + error.getMessage());
    }

    @Test
    void withSeveralEarlierPaysABareResolverIsRejected() {
        // Sin resolvesPayTaskRef y con varios PAY no hay forma de adivinar: bancos/conexiones distintos.
        var error = assertThrows(IllegalArgumentException.class,
                () -> pairing.payForResolver(resolver(3, null), List.of(pay(1, "a"), pay(2, "b"))));

        assertTrue(error.getMessage().contains("no guessing"), () -> "mensaje: " + error.getMessage());
    }

    @Test
    void withNoEarlierPayThereIsNothingToResolve() {
        assertNull(pairing.payForResolver(resolver(1, "cobros"), List.of(pay(4, "cobros"))));
    }
}
