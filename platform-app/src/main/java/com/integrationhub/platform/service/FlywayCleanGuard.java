package com.integrationhub.platform.service;

import io.quarkus.runtime.LaunchMode;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Fail-fast: la aplicacion no arranca fuera de dev/test si `flyway.clean()` esta habilitado.
 *
 * <p>POR QUE EXISTE. `flyway.clean()` borra todos los objetos de los schemas configurados. Quarkus
 * 3.37.2 lo deja habilitado por defecto -{@code cleanDisabled} lleva {@code @WithDefault("false")},
 * verificado en el bytecode- e invierte asi el default seguro de Flyway 10. Peor: el bytecode de
 * {@code FlywayRecorder} llama a {@code Flyway.clean()} comprobando UNICAMENTE
 * {@code isCleanAtStart()}, sin ninguna guarda por modo de arranque. Ambas son configuracion de
 * RUNTIME, de modo que en el binario nativo una sola variable de entorno
 * ({@code QUARKUS_FLYWAY_CLEAN_AT_START=true}) vacia la base al arrancar.
 *
 * <p>En este producto eso no es "perder datos de una demo": se lleva por delante
 * {@code mt101_pay_dispatch_intent}, que es el ledger que impide reenviar un pago ya despachado, y
 * {@code flyway_schema_history}. Un arranque despues, el sistema no sabe que pagos salieron.
 *
 * <p>POR QUE NO BASTA CON PONERLO EN application.properties. Una variable de entorno tiene ordinal
 * 300 y el fichero 250: el env GANA. Fijar la propiedad sube el liston -hacen falta dos variables en
 * vez de una- pero no cierra la puerta. Esta guarda lee el valor EFECTIVO y aborta.
 *
 * <p>Se permite en dev y test porque ahi recrear la base es parte del ciclo normal.
 *
 * <p>FALLA CERRADA. {@code LaunchMode.current()} solo reporta {@code DEVELOPMENT}/{@code TEST}
 * cuando el runtime de Quarkus los ha fijado; en cualquier otro contexto devuelve {@code NORMAL} y
 * la guarda se activa. Es deliberado: si no se puede determinar el entorno, se bloquea. Lo contrario
 * -asumir dev ante la duda- convertiria esta guarda en decorativa justo donde importa.
 */
@ApplicationScoped
public class FlywayCleanGuard {

    private final boolean cleanDisabled;
    private final boolean cleanAtStart;

    public FlywayCleanGuard(
            @ConfigProperty(name = "quarkus.flyway.clean-disabled", defaultValue = "true") boolean cleanDisabled,
            @ConfigProperty(name = "quarkus.flyway.clean-at-start", defaultValue = "false") boolean cleanAtStart) {
        this.cleanDisabled = cleanDisabled;
        this.cleanAtStart = cleanAtStart;
    }

    void validate(@Observes StartupEvent ignored) {
        var mode = LaunchMode.current();
        if (mode == LaunchMode.DEVELOPMENT || mode == LaunchMode.TEST) {
            return;
        }
        if (cleanAtStart) {
            throw new IllegalStateException(
                    "quarkus.flyway.clean-at-start=true fuera de dev/test: al arrancar se ejecutaria "
                            + "flyway.clean() y se borraria la base entera, incluido el ledger de pagos "
                            + "mt101_pay_dispatch_intent. Quitar la variable de entorno "
                            + "QUARKUS_FLYWAY_CLEAN_AT_START antes de arrancar.");
        }
        if (!cleanDisabled) {
            throw new IllegalStateException(
                    "quarkus.flyway.clean-disabled=false fuera de dev/test: flyway.clean() queda "
                            + "habilitado y una sola variable de entorno mas "
                            + "(QUARKUS_FLYWAY_CLEAN_AT_START=true) vaciaria la base. Esta plataforma lo "
                            + "fija en true; si llega en false es porque alguien lo sobreescribio por "
                            + "entorno.");
        }
    }
}
