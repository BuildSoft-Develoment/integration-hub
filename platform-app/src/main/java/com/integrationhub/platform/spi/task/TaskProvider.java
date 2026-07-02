package com.integrationhub.platform.spi.task;

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
}
