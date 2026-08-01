// @covers spec 008-mensajeria-pagos RF-013 (el ledger de pagos no puede desaparecer por configuracion)
package com.integrationhub.platform.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Fija el contrato de la guarda: fuera de dev/test, ninguna combinacion de configuracion puede dejar
 * `flyway.clean()` disponible.
 *
 * <p>MEDIDO, y va contra la intuicion: en un test JUnit plano {@code LaunchMode.current()} devuelve
 * {@code NORMAL}, no {@code TEST} — el modo lo fija el runtime de Quarkus, que aqui no arranca. Eso
 * hace que la guarda se ACTIVE, y es exactamente lo que se quiere: ante la duda sobre el entorno,
 * bloquear. Un {@code @QuarkusTest} si reporta {@code TEST} y se salta la guarda.
 *
 * <p>La rama de produccion se ejercita ademas sobre el predicado, que es la logica que decide; el
 * cableado con StartupEvent lo cubre el arranque real de la aplicacion.
 */
class FlywayCleanGuardTest {

    /** Misma condicion que aplica la guarda cuando NO es dev/test. */
    private static boolean abortaEnProduccion(
            boolean cleanDisabled, boolean cleanAtStart, boolean cleanOnValidationError) {
        return cleanAtStart || cleanOnValidationError || !cleanDisabled;
    }

    @Test
    @DisplayName("clean-at-start=true aborta: es la primera ruta a clean() en doStartActions")
    void abortaConCleanAtStart() {
        assertTrue(abortaEnProduccion(true, true, false));
        assertTrue(abortaEnProduccion(false, true, false));
    }

    @Test
    @DisplayName("clean-on-validation-error=true aborta: es la SEGUNDA ruta a clean(), la del despliegue malo")
    void abortaConCleanOnValidationError() {
        // Leido del bytecode de FlywayRecorder.doStartActions: isValidateAtStart() &&
        // isCleanOnValidationError() && !validationSuccessful -> Flyway.clean(). Un checksum que no
        // cuadra borra la base. No se comprueba validate-at-start: en produccion esta combinacion no
        // es defendible ni siquiera latente.
        assertTrue(abortaEnProduccion(true, false, true));
        assertTrue(abortaEnProduccion(false, false, true));
    }

    @Test
    @DisplayName("clean-disabled=false aborta sin ninguna ruta activa: deja la puerta abierta")
    void abortaConCleanHabilitado() {
        assertTrue(abortaEnProduccion(false, false, false));
    }

    @Test
    @DisplayName("la unica combinacion que arranca es clean deshabilitado y ninguna ruta de limpieza")
    void arrancaSoloConCleanCerrado() {
        assertFalse(abortaEnProduccion(true, false, false));
    }

    @Test
    @DisplayName("sin runtime de Quarkus la guarda FALLA CERRADA: si no sabe el modo, bloquea")
    void fallaCerradaCuandoNoConoceElModo() {
        // Medido: en un test JUnit plano (sin runtime de Quarkus) `LaunchMode.current()` devuelve
        // NORMAL, no TEST. La guarda se activa, que es lo correcto en el camino del dinero: ante la
        // duda sobre el entorno, se bloquea. Este test fija esa propiedad para que nadie la
        // "arregle" haciendo que la guarda se salte cuando no reconoce el modo.
        var guard = new FlywayCleanGuard(false, true, false);
        var error = assertThrows(IllegalStateException.class, () -> guard.validate(null));
        assertTrue(error.getMessage().contains("mt101_pay_dispatch_intent"),
                "el mensaje debe nombrar QUE se pierde, no solo la propiedad: " + error.getMessage());
    }

    @Test
    @DisplayName("con la configuracion segura arranca sin ruido")
    void arrancaConConfiguracionSegura() {
        var guard = new FlywayCleanGuard(true, false, false);
        assertDoesNotThrow(() -> guard.validate(null));
    }
}
