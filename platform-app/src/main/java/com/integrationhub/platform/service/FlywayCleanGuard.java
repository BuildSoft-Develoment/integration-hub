package com.integrationhub.platform.service;

import io.quarkus.runtime.LaunchMode;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Fail-fast: la aplicacion no arranca fuera de dev/test si `flyway.clean()` quedo habilitado.
 *
 * <p>ESTA GUARDA NO IMPIDE EL BORRADO. Leelo antes de confiar en ella. Observa
 * {@code StartupEvent}, y ese evento llega DESPUES de que Flyway haya hecho su trabajo: en Quarkus
 * 3.37.2 el build step que lo dispara ({@code LifecycleEventsBuildStep.startupEvent}) CONSUME
 * {@code List<ServiceStartBuildItem>}, y {@code FlywayProcessor} PRODUCE ese item desde el mismo
 * paso que llama a {@code FlywayRecorder.doStartActions()}. Verificado en el bytecode de ambos
 * artefactos. Si un {@code clean-at-start} llegara a ejecutarse, para cuando esta guarda lanza la
 * base ya no esta.
 *
 * <p>QUIEN SI LO IMPIDE: {@link FlywayCleanVetoCallback}, que corre en {@code Event.BEFORE_CLEAN},
 * dentro de la propia operacion y antes de {@code CleanExecutor.clean(...)}. Esa es la puerta. Esta
 * clase es la segunda linea.
 *
 * <p>QUE APORTA ENTONCES. Cubre el caso que el callback no ve porque no llega a haber clean:
 * {@code clean-disabled=false} sin ninguna de las dos rutas de limpieza activas. Ahi no se borra
 * nada al arrancar, pero el proceso queda corriendo con la operacion destructiva disponible. La
 * guarda lee el valor EFECTIVO -no lo que dice el fichero- y se niega a arrancar asi. Las otras dos
 * ramas son defensa en profundidad: hoy son inalcanzables porque el callback aborta antes, y deben
 * seguir estando por si alguien quita la declaracion de {@code quarkus.flyway.callbacks}.
 *
 * <p>LAS DOS RUTAS A {@code clean()}. El bytecode de {@code FlywayRecorder.doStartActions} tiene
 * DOS llamadas, no una:
 *
 * <ol>
 *   <li>{@code isCleanAtStart()} -&gt; {@code clean()}
 *   <li>{@code isValidateAtStart() && isCleanOnValidationError() && !validationSuccessful} -&gt;
 *       {@code clean()} — un checksum que no cuadra o una migracion que falta y Flyway borra la base
 *       como "remedio", que es exactamente el escenario de un despliegue malo
 * </ol>
 *
 * Las tres propiedades son de RUNTIME y por tanto sobreescribibles por entorno. El callback cubre
 * ambas rutas porque las dos pasan por {@code DbClean.clean()}; esta guarda las nombra una a una
 * para que el mensaje diga cual se activo.
 *
 * <p>QUE SE PROTEGE. No son datos de una demo: {@code mt101_pay_dispatch_intent} es el ledger que
 * impide reenviar un pago ya despachado. Junto con {@code flyway_schema_history} desaparece la
 * respuesta a "que pagos salieron".
 *
 * <p>POR QUE NO BASTA CON PONERLO EN application.properties. Una variable de entorno tiene ordinal
 * 300 y el fichero 250: el env GANA. Fijar la propiedad sube el liston -hacen falta dos variables en
 * vez de una- pero no cierra la puerta.
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
    private final boolean cleanOnValidationError;

    public FlywayCleanGuard(
            @ConfigProperty(name = "quarkus.flyway.clean-disabled", defaultValue = "true") boolean cleanDisabled,
            @ConfigProperty(name = "quarkus.flyway.clean-at-start", defaultValue = "false") boolean cleanAtStart,
            @ConfigProperty(name = "quarkus.flyway.clean-on-validation-error", defaultValue = "false")
                    boolean cleanOnValidationError) {
        this.cleanDisabled = cleanDisabled;
        this.cleanAtStart = cleanAtStart;
        this.cleanOnValidationError = cleanOnValidationError;
    }

    void validate(@Observes StartupEvent ignored) {
        var mode = LaunchMode.current();
        if (mode == LaunchMode.DEVELOPMENT || mode == LaunchMode.TEST) {
            return;
        }
        if (cleanAtStart) {
            throw new IllegalStateException(
                    "quarkus.flyway.clean-at-start=true fuera de dev/test. Llegar hasta aqui con este "
                            + "valor significa que el veto de FlywayCleanVetoCallback NO se ejecuto: o "
                            + "se quito la declaracion quarkus.flyway.callbacks, o la limpieza ya ocurrio "
                            + "y se perdio el ledger de pagos mt101_pay_dispatch_intent. Revisar el "
                            + "estado de la base ANTES de reintentar, y quitar la variable de entorno "
                            + "QUARKUS_FLYWAY_CLEAN_AT_START.");
        }
        if (cleanOnValidationError) {
            throw new IllegalStateException(
                    "quarkus.flyway.clean-on-validation-error=true fuera de dev/test. Es la SEGUNDA "
                            + "ruta a Flyway.clean() en doStartActions: si validate-at-start falla -un "
                            + "checksum que no cuadra, una migracion que falta- Flyway borra la base "
                            + "entera como 'remedio'. Justo el escenario de un despliegue malo. Quitar "
                            + "QUARKUS_FLYWAY_CLEAN_ON_VALIDATION_ERROR; un fallo de validacion se "
                            + "resuelve con el runbook de migracion, no borrando.");
        }
        if (!cleanDisabled) {
            throw new IllegalStateException(
                    "quarkus.flyway.clean-disabled=false fuera de dev/test: el proceso quedaria "
                            + "corriendo con flyway.clean() disponible sobre la base de produccion, que "
                            + "incluye el ledger de pagos mt101_pay_dispatch_intent. Esta plataforma lo "
                            + "fija en true; si llega en false es porque alguien lo sobreescribio por "
                            + "entorno (el env gana al fichero).");
        }
    }
}
