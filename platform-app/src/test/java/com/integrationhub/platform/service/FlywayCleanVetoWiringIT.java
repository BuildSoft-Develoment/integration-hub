// @covers spec 008-mensajeria-pagos RF-004 (la idempotencia de MT101_PAY se apoya en el ledger
// mt101_pay_dispatch_intent; esto certifica que ninguna configuracion puede borrarlo, no el
// despacho en si)
package com.integrationhub.platform.service;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Certifica que el veto esta CABLEADO en la instancia real de Flyway, no solo declarado en un
 * fichero.
 *
 * <p>POR QUE HACE FALTA UN TEST APARTE. {@code quarkus.flyway.callbacks} es configuracion de
 * BUILD-TIME que se resuelve POR NOMBRE DE CLASE: {@code FlywayCallbacksLocator} hace
 * {@code Class.forName} + {@code newInstance}. Un rename de la clase, un paquete movido o un
 * constructor con parametros dejan el veto fuera SIN romper la compilacion. Los tests unitarios
 * prueban la decision; este prueba que la decision llega a ejecutarse.
 *
 * <p>Arranca el runtime de Quarkus, que resuelve el bean {@code Flyway} igual que en produccion, y
 * mira la lista de callbacks efectiva.
 */
@QuarkusTest
class FlywayCleanVetoWiringIT {

    @Inject
    Flyway flyway;

    @Test
    @DisplayName("el bean Flyway lleva el veto entre sus callbacks")
    void vetoRegistradoEnLaInstanciaDeFlyway() {
        var callbacks = flyway.getConfiguration().getCallbacks();
        var presente = Arrays.stream(callbacks).anyMatch(FlywayCleanVetoCallback.class::isInstance);
        assertTrue(presente,
                "FlywayCleanVetoCallback no esta registrado; callbacks efectivos: "
                        + Arrays.stream(callbacks).map(c -> c.getClass().getName()).toList());
    }
}
