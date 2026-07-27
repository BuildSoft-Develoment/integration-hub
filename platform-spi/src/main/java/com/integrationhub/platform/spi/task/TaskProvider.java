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
}
