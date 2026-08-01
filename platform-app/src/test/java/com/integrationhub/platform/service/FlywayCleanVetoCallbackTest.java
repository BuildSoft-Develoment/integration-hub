// @covers spec 008-mensajeria-pagos RF-013 (el ledger de pagos no puede desaparecer por configuracion)
package com.integrationhub.platform.service;

import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.callback.Event;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Constructor;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Fija el contrato del unico punto que de verdad puede impedir el borrado.
 *
 * <p>{@link FlywayCleanGuard} observa {@code StartupEvent}, que en Quarkus 3.37.2 se dispara DESPUES
 * de las acciones de arranque de Flyway; para cuando esa guarda lanza, un clean ya habria ocurrido.
 * El veto vive en {@code Event.BEFORE_CLEAN}, dentro de {@code DbClean.clean()} y antes de
 * {@code CleanExecutor.clean(...)}. Estos tests cubren las tres cosas que pueden romperlo en
 * silencio: que deje de vetar, que deje de ser instanciable por reflexion, o que se caiga la
 * declaracion en config.
 */
class FlywayCleanVetoCallbackTest {

    @Test
    @DisplayName("sin runtime de Quarkus el veto se aplica: ante la duda del entorno, no se borra")
    void vetaCuandoNoConoceElModo() {
        // Medido: en un test JUnit plano `LaunchMode.current()` devuelve NORMAL, no TEST — el modo lo
        // fija el runtime de Quarkus, que aqui no arranca. Eso hace que el veto ACTUE, que es lo
        // correcto en el camino del dinero.
        var callback = new FlywayCleanVetoCallback();
        var error = assertThrows(FlywayException.class, () -> callback.handle(Event.BEFORE_CLEAN, null));
        assertTrue(error.getMessage().contains("mt101_pay_dispatch_intent"),
                "el mensaje debe nombrar QUE se pierde, no solo la operacion: " + error.getMessage());
        assertFalse(FlywayCleanVetoCallback.permitido(), "fuera de dev/test no se permite limpiar");
    }

    @Test
    @DisplayName("solo se engancha a BEFORE_CLEAN: no interfiere con migrate ni con el resto")
    void soloSoportaBeforeClean() {
        var callback = new FlywayCleanVetoCallback();
        assertTrue(callback.supports(Event.BEFORE_CLEAN, null));
        for (var otro : Event.values()) {
            if (otro != Event.BEFORE_CLEAN) {
                assertFalse(callback.supports(otro, null),
                        "no debe engancharse a " + otro + ": solo veta el clean");
            }
        }
    }

    @Test
    @DisplayName("instanciable por reflexion con constructor por defecto (lo exige FlywayCallbacksLocator)")
    void tieneConstructorPorDefecto() throws Exception {
        // FlywayCallbacksLocator hace Class.forName + getConstructors + newInstance, y rechaza la clase
        // con "It shouldn't be abstract and must have a default constructor". Si alguien le anade un
        // parametro al constructor, el callback deja de registrarse EN SILENCIO y el veto desaparece.
        Constructor<?> ctor = FlywayCleanVetoCallback.class.getConstructor();
        assertNotNull(ctor.newInstance());
        assertFalse(java.lang.reflect.Modifier.isAbstract(FlywayCleanVetoCallback.class.getModifiers()));
    }

    @Test
    @DisplayName("declarado en quarkus.flyway.callbacks: sin esa linea el veto no existe")
    void declaradoEnConfiguracion() throws IOException {
        // `quarkus.flyway.callbacks` es config de BUILD-TIME y se resuelve por nombre de clase. Un
        // rename o un borrado de la linea no rompe la compilacion: deja el veto fuera sin avisar.
        //
        // Se lee el fichero de src/main EN DISCO, no por classpath. Medido: `getResourceAsStream(
        // "/application.properties")` en el classpath de test devuelve el de src/test/resources, que
        // no tiene esta clave — el test daria null y estaria certificando el fichero equivocado.
        // (Ojo, eso es solo la resolucion de recursos de Java: la config de Quarkus SI fusiona ambos
        // ficheros, como demuestra FlywayCleanVetoWiringIT al encontrar el callback cableado en un
        // @QuarkusTest.) Lo que hay que certificar aqui es el fichero que se empaqueta.
        var props = new Properties();
        try (InputStream in = Files.newInputStream(rutaDeMainProperties())) {
            props.load(in);
        }
        assertEquals(FlywayCleanVetoCallback.class.getName(),
                props.getProperty("quarkus.flyway.callbacks"),
                "quarkus.flyway.callbacks debe nombrar exactamente esta clase");
        assertEquals("true", props.getProperty("quarkus.flyway.clean-disabled"),
                "la primera linea de defensa (clean-disabled) no debe relajarse");
    }

    /** Surefire corre con el basedir del modulo; se acepta tambien la raiz del repo. */
    private static Path rutaDeMainProperties() {
        var relativa = Path.of("src", "main", "resources", "application.properties");
        if (Files.exists(relativa)) {
            return relativa;
        }
        var desdeRaiz = Path.of("platform-app").resolve(relativa);
        assertTrue(Files.exists(desdeRaiz),
                "no se encontro application.properties de main ni desde " + Path.of("").toAbsolutePath());
        return desdeRaiz;
    }
}
