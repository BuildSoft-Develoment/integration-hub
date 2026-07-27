package com.integrationhub.vertical.swift.mt101.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.engine.ConfigurationMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.UnaryOperator;
import java.util.regex.Pattern;

/**
 * ADR-021: doble de {@link ConfigurationMapper} para las pruebas del vertical.
 *
 * <p>Antes estas pruebas instanciaban {@code JsonConfigurationMapper} del motor. Eso arrastraba al
 * vertical toda la resolucion de secretos (SecretResolver + sus providers) solo para parsear un
 * JSON, y ataba las pruebas del vertical a una clase que no es suya. El contrato que el vertical
 * consume es la interfaz; para probar contra ella alcanza este doble.</p>
 *
 * <p>La expansion de {@code ${secret:...}} de la implementacion real se prueba donde vive, en
 * {@code JsonConfigurationMapperTest} del motor. Aca solo se reproduce el comportamiento
 * observable que el vertical necesita: al provider le llega la configuracion YA expandida.</p>
 */
public class TestConfigurationMapper implements ConfigurationMapper {

    private static final Pattern SECRET_REFERENCE = Pattern.compile("\\$\\{secret:([^}]+)}");

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** referencia -&gt; valor; {@code null} = no la conoce (se deja el literal sin tocar). */
    private final UnaryOperator<String> secrets;

    /** Sin secretos: el caso comun, cuando la prueba solo necesita parsear JSON. */
    public TestConfigurationMapper() {
        this(reference -> null);
    }

    public TestConfigurationMapper(UnaryOperator<String> secrets) {
        this.secrets = secrets;
    }

    @Override
    public Map<String, Object> toMap(String json) {
        return resolveSecretsIn(toMapUnresolved(json));
    }

    @Override
    public Map<String, Object> toMapUnresolved(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {
            });
        } catch (Exception error) {
            throw new IllegalArgumentException("invalid configuration json: " + error.getMessage(), error);
        }
    }

    @Override
    public String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception error) {
            throw new IllegalArgumentException("cannot serialize configuration: " + error.getMessage(), error);
        }
    }

    @Override
    public Map<String, Object> resolveSecretsIn(Map<String, Object> raw) {
        if (raw == null) {
            return new LinkedHashMap<>();
        }
        var resolved = new LinkedHashMap<String, Object>();
        raw.forEach((key, value) -> resolved.put(key, resolveValue(value)));
        return resolved;
    }

    @SuppressWarnings("unchecked")
    private Object resolveValue(Object value) {
        if (value instanceof String text) {
            var matcher = SECRET_REFERENCE.matcher(text);
            if (matcher.matches()) {
                var secret = secrets.apply(matcher.group(1));
                return secret == null ? text : secret;
            }
            return text;
        }
        if (value instanceof Map<?, ?> nested) {
            return resolveSecretsIn((Map<String, Object>) nested);
        }
        if (value instanceof List<?> list) {
            var resolved = new ArrayList<>(list.size());
            list.forEach(item -> resolved.add(resolveValue(item)));
            return resolved;
        }
        return value;
    }
}
