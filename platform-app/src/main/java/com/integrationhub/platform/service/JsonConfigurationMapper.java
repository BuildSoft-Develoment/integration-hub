package com.integrationhub.platform.service;

// @trace RF-003 (reingenieria: clase que implementa el/los RF en produccion)

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.secret.ConfigSecretValueProvider;
import com.integrationhub.platform.service.secret.EnvironmentSecretValueProvider;
import com.integrationhub.platform.service.secret.SecretResolver;
import com.integrationhub.platform.service.secret.FileVaultSecretClient;
import com.integrationhub.platform.service.secret.FileVaultSecretValueProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.ConfigProvider;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class JsonConfigurationMapper {

    private static final Pattern SECRET_PATTERN = Pattern.compile("\\$\\{(env|config|secret|vault):([^}]+)}");

    ObjectMapper objectMapper;
    private final SecretResolver secretResolver;

    public JsonConfigurationMapper() {
        this(defaultObjectMapper(), defaultSecretResolver());
    }

    @Inject
    public JsonConfigurationMapper(ObjectMapper objectMapper, SecretResolver secretResolver) {
        this.objectMapper = objectMapper;
        this.secretResolver = secretResolver;
    }

    JsonConfigurationMapper(ObjectMapper objectMapper, SecretResolver secretResolver, boolean ignored) {
        this.objectMapper = objectMapper;
        this.secretResolver = secretResolver;
    }

    public Map<String, Object> toMap(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            Map<String, Object> raw = objectMapper.readValue(json, new TypeReference<>() {
            });
            return resolveSecrets(raw);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid configuration JSON", e);
        }
    }

    public String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot serialize configuration", e);
        }
    }

    /**
     * v27 P0.2: parsea el JSON SIN resolver los {@code ${secret:...}}: deja las referencias intactas para
     * poder persistir un snapshot sin secretos resueltos y re-resolver desde Vault al ejecutar.
     */
    public Map<String, Object> toMapUnresolved(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid configuration JSON", e);
        }
    }

    /** v27 P0.2: resuelve los {@code ${secret:...}} de un mapa ya parseado (re-resolucion al ejecutar). */
    @SuppressWarnings("unchecked")
    public Map<String, Object> resolveSecretsIn(Map<String, Object> raw) {
        return raw == null ? null : (Map<String, Object>) resolveValue(raw);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> resolveSecrets(Map<String, Object> raw) {
        return (Map<String, Object>) resolveValue(raw);
    }

    @SuppressWarnings("unchecked")
    private Object resolveValue(Object value) {
        if (value instanceof Map<?, ?> mapValue) {
            Map<String, Object> resolved = new LinkedHashMap<>();
            mapValue.forEach((key, nestedValue) -> resolved.put(String.valueOf(key), resolveValue(nestedValue)));
            return resolved;
        }
        if (value instanceof List<?> listValue) {
            List<Object> resolved = new ArrayList<>(listValue.size());
            for (Object item : listValue) {
                resolved.add(resolveValue(item));
            }
            return resolved;
        }
        if (value instanceof String stringValue) {
            return resolveString(stringValue);
        }
        return value;
    }

    private String resolveString(String value) {
        Matcher matcher = SECRET_PATTERN.matcher(value);
        StringBuffer resolved = new StringBuffer();
        while (matcher.find()) {
            String source = matcher.group(1);
            String reference = matcher.group(2);
            String replacement = secretResolver.resolve(source, reference)
                    .orElseThrow(() -> new IllegalArgumentException("Missing " + source + " value: " + reference));
            matcher.appendReplacement(resolved, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(resolved);
        return resolved.toString();
    }

    private static ObjectMapper defaultObjectMapper() {
        return new ObjectMapper();
    }

    private static SecretResolver defaultSecretResolver() {
        var config = ConfigProvider.getConfig();
        var configProvider = new ConfigSecretValueProvider(config);
        var envProvider = new EnvironmentSecretValueProvider(config);
        FileVaultSecretClient fileVaultSecretClient = (providerName, alias) -> java.util.Optional.empty();
        var locationMapper = new com.integrationhub.platform.service.secret.FileVaultSecretLocationMapper(config, true);
        var vaultProvider = new FileVaultSecretValueProvider(fileVaultSecretClient, locationMapper, true);
        return new SecretResolver(List.<com.integrationhub.platform.service.secret.SecretValueProvider>of(envProvider, configProvider, vaultProvider));
    }
}





