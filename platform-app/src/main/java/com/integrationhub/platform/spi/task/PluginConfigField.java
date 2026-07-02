package com.integrationhub.platform.spi.task;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Descriptor de un campo de configuración de un tipo (task/source/reader). Un plugin declara
 * sus campos con estos descriptores y la UI los renderiza y valida dinámicamente
 * ({@code ih-schema-form}), sin formulario hardcoded. Espeja el contrato frontend
 * {@code SchemaFieldDescriptor}.
 *
 * <p>Los campos {@code secret} nunca llevan el valor en claro: el valor es una referencia a un
 * secreto gestionado (ver {@code SecretValueProvider}).</p>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PluginConfigField(
        String key,
        String type,
        String labelKey,
        String label,
        boolean required,
        String hintKey,
        String placeholder,
        List<PluginConfigOption> options,
        Integer min,
        Integer max,
        String pattern,
        @JsonProperty("default") Object defaultValue) {

    public static PluginConfigField text(String key, String labelKey, boolean required) {
        return new PluginConfigField(key, "text", labelKey, null, required, null, null, null, null, null, null, null);
    }

    public static PluginConfigField textarea(String key, String labelKey, boolean required) {
        return new PluginConfigField(key, "textarea", labelKey, null, required, null, null, null, null, null, null, null);
    }

    public static PluginConfigField secret(String key, String labelKey, boolean required) {
        return new PluginConfigField(key, "secret", labelKey, null, required, null, null, null, null, null, null, null);
    }

    public static PluginConfigField number(String key, String labelKey, boolean required, Integer min, Integer max) {
        return new PluginConfigField(key, "number", labelKey, null, required, null, null, null, min, max, null, null);
    }

    public static PluginConfigField bool(String key, String labelKey) {
        return new PluginConfigField(key, "boolean", labelKey, null, false, null, null, null, null, null, null, null);
    }

    public static PluginConfigField select(String key, String labelKey, boolean required, List<PluginConfigOption> options) {
        return new PluginConfigField(key, "select", labelKey, null, required, null, null, options, null, null, null, null);
    }
}
