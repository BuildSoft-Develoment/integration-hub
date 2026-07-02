package com.integrationhub.platform.spi.task;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Opción de un campo {@code select} del schema de configuración de un tipo.
 * Espeja el contrato frontend {@code SchemaFieldOption}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PluginConfigOption(String value, String labelKey, String label) {

    public static PluginConfigOption of(String value, String label) {
        return new PluginConfigOption(value, null, label);
    }
}
