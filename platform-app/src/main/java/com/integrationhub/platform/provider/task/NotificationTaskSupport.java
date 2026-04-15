package com.integrationhub.platform.provider.task;

import java.util.LinkedHashMap;
import java.util.Map;

final class NotificationTaskSupport {

    private NotificationTaskSupport() {
    }

    static String requireString(Map<String, Object> configuration, String key) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("Missing required configuration key: " + key);
        }
        return String.valueOf(value);
    }

    @SuppressWarnings("unchecked")
    static Map<String, String> stringMap(Map<String, Object> configuration, String key) {
        Object value = configuration.get(key);
        if (value == null) {
            return Map.of();
        }
        if (!(value instanceof Map<?, ?> rawMap)) {
            throw new IllegalArgumentException("Configuration key must be an object: " + key);
        }
        Map<String, String> result = new LinkedHashMap<>();
        rawMap.forEach((mapKey, mapValue) -> result.put(String.valueOf(mapKey), mapValue == null ? "" : String.valueOf(mapValue)));
        return result;
    }

    static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    static String template(String template, Map<String, Object> variables) {
        String resolved = template;
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            resolved = resolved.replace("${" + entry.getKey() + "}", entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
        }
        return resolved;
    }
}
