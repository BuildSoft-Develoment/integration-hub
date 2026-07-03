package com.integrationhub.platform.spi.config;

import java.util.List;

/**
 * Schema de configuración de un tipo: la lista de campos que la UI renderiza dinámicamente.
 * Espeja el contrato frontend {@code SchemaFormSchema}. Vacío por defecto, de modo que declarar
 * un schema es opt-in y no rompe los providers existentes.
 */
public record PluginConfigSchema(List<PluginConfigField> fields) {

    public PluginConfigSchema {
        fields = fields == null ? List.of() : List.copyOf(fields);
    }

    public static PluginConfigSchema empty() {
        return new PluginConfigSchema(List.of());
    }

    public static PluginConfigSchema of(PluginConfigField... fields) {
        return new PluginConfigSchema(List.of(fields));
    }

    public boolean isEmpty() {
        return fields.isEmpty();
    }
}
