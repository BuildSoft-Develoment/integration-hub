package com.integrationhub.platform.service;

import io.quarkus.runtime.LaunchMode;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;

/**
 * Veta `flyway.clean()` fuera de dev/test DESDE DENTRO de la propia operacion de limpieza.
 *
 * <p>POR QUE EXISTE ADEMAS DE {@link FlywayCleanGuard}. La guarda observa {@code StartupEvent}, y
 * eso llega tarde: en Quarkus 3.37.2 el build step que dispara {@code StartupEvent}
 * ({@code LifecycleEventsBuildStep.startupEvent}) CONSUME {@code List<ServiceStartBuildItem>}, y
 * {@code FlywayProcessor} PRODUCE ese item desde el mismo paso que llama a
 * {@code FlywayRecorder.doStartActions()}. Es decir, Flyway limpia y migra ANTES de que exista el
 * evento que la guarda escucha. Verificado en el bytecode de ambos artefactos 3.37.2.
 *
 * <p>DONDE ENCAJA ESTE CALLBACK. El orden dentro de {@code DbClean.clean()} de flyway-core 12.0.0,
 * leido del bytecode, es:
 *
 * <ol>
 *   <li>{@code isCleanDisabled()} -&gt; si es true lanza {@code FlywayException} y no toca nada
 *   <li>{@code Event.BEFORE_CLEAN} -&gt; aqui corre este callback, todavia sin borrar
 *   <li>{@code CleanExecutor.clean(...)} -&gt; aqui se destruye
 *   <li>{@code Event.AFTER_CLEAN}
 * </ol>
 *
 * El metodo no tiene tabla de excepciones: nada captura lo que lance el callback, asi que la
 * excepcion sube y aborta antes del paso 3. Este es el ultimo punto en el que todavia se puede
 * decir que no.
 *
 * <p>POR QUE NO BASTA {@code clean-disabled=true}. Ese es el paso 1 y es proteccion real y completa,
 * pero es configuracion de RUNTIME: una variable de entorno (ordinal 300 contra 250 del fichero) la
 * vuelve a poner en false, y con una segunda ({@code QUARKUS_FLYWAY_CLEAN_AT_START=true}) la base se
 * vacia al arrancar. Este callback se declara en {@code quarkus.flyway.callbacks}, que es
 * configuracion de BUILD-TIME: queda cocido en el binario nativo y ninguna variable de entorno lo
 * quita.
 *
 * <p>Lo que se protege no es una demo: {@code mt101_pay_dispatch_intent} es el ledger que impide
 * reenviar un pago ya despachado. Sin el, un arranque despues el sistema no sabe que pagos salieron.
 *
 * <p>FALLA CERRADA. {@code LaunchMode.current()} solo reporta {@code DEVELOPMENT}/{@code TEST}
 * cuando el runtime de Quarkus los ha fijado; en cualquier otro contexto devuelve {@code NORMAL} y
 * el veto se aplica. Ante la duda sobre el entorno, no se borra.
 *
 * <p>Se instancia por reflexion con el constructor por defecto ({@code FlywayCallbacksLocator}), no
 * por CDI: no puede inyectar nada. No lo necesita — si {@code BEFORE_CLEAN} se dispara, ya hay un
 * clean en curso, y fuera de dev/test eso siempre esta mal.
 */
public class FlywayCleanVetoCallback implements Callback {

    @Override
    public boolean supports(Event event, Context context) {
        return event == Event.BEFORE_CLEAN;
    }

    @Override
    public boolean canHandleInTransaction(Event event, Context context) {
        return true;
    }

    @Override
    public void handle(Event event, Context context) {
        if (permitido()) {
            return;
        }
        throw new FlywayException(
                "flyway.clean() abortado: fuera de dev/test esta operacion borra todos los objetos "
                        + "de los schemas, incluido mt101_pay_dispatch_intent (el ledger que impide "
                        + "reenviar un pago ya despachado) y flyway_schema_history. Si de verdad se "
                        + "quiere recrear la base, hacerlo con el runbook de migracion, no arrancando "
                        + "la aplicacion.");
    }

    /** Visible para test: la decision, sin el acoplamiento al ciclo de vida de Flyway. */
    static boolean permitido() {
        var mode = LaunchMode.current();
        return mode == LaunchMode.DEVELOPMENT || mode == LaunchMode.TEST;
    }

    @Override
    public String getCallbackName() {
        return "flyway-clean-veto";
    }
}
