package com.integrationhub.platform.spi.task;

import com.integrationhub.platform.spi.config.PluginConfigSchema;
import java.util.Map;

public interface TaskProvider {

    String type();

    TaskResult execute(TaskContext context, Map<String, Object> configuration);

    /**
     * Schema de configuración del tipo: los campos que la UI renderiza dinámicamente
     * ({@code ih-schema-form}) para que un operador configure este tipo sin formulario
     * hardcoded. Opt-in: por defecto vacío, así los providers existentes no cambian.
     */
    default PluginConfigSchema configSchema() {
        return PluginConfigSchema.empty();
    }

    /**
     * Capacidad del provider para ejecutarse offloadado a un broker (ADR-015). Opt-in: por defecto
     * {@link AsyncOffloadSupport#UNSUPPORTED} (conservador — async deshabilitado hasta que el provider
     * declare explícitamente que su trabajo viaja en el envelope). El motor lo respeta y lanza si se
     * pide async sobre un provider no capaz; la UI lo consume para gatear el toggle async.
     */
    default AsyncOffloadSupport asyncOffloadSupport() {
        return AsyncOffloadSupport.UNSUPPORTED;
    }

    /**
     * ADR-021: ¿esta tarea <b>mueve dinero hacia afuera</b> (envía una orden de pago a un banco o
     * gateway)? Opt-in, por defecto {@code false}.
     *
     * <p>El motor lo usa en la recuperación de ejecuciones huérfanas: si una ejecución con lease
     * vencido ya arrancó una tarea que mueve dinero, NO se re-encola —pasa a
     * {@code NEEDS_RECONCILIATION}, porque re-ejecutarla a ciegas podría pagar dos veces—. Las demás
     * se re-encolan sin drama.</p>
     *
     * <p>Antes esto era el literal {@code "MT101_PAY"} dentro del despachador, y por eso solo protegía
     * a UN tipo: la tarea de pago de cualquier vertical nuevo se habría re-encolado a ciegas. Que la
     * capacidad la declare el provider convierte un fail-safe atado a un estándar en uno que cubre a
     * todos.</p>
     */
    default boolean movesMoney() {
        return false;
    }

    /**
     * ADR-021: ¿publica un output {@code records} que las tareas siguientes consumen por
     * {@code <taskRef>.records}? Opt-in, por defecto {@code false}.
     *
     * <p>El motor lo usa para decidir si puede fusionar esta tarea al fast path de lectura: ese camino
     * solo materializa un {@code summary} (processedCount), no la lista de records, así que fusionar
     * una tarea cuyos records alguien lee aguas abajo rompería esa resolución. Su sink natural en el
     * fast path es {@code DB_WRITE} (staging), que no produce records consumibles.</p>
     */
    default boolean producesConsumableRecords() {
        return false;
    }
}
