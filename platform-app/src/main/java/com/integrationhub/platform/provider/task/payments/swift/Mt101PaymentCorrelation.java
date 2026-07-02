package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.spi.task.payments.Mt101Message;

import java.util.LinkedHashMap;
import java.util.Map;

/** Resolve claves operativas de despacho con la misma semantica que los transportes. */
public final class Mt101PaymentCorrelation {

    private Mt101PaymentCorrelation() {
    }

    public static String correlationKey(String transport, Map<String, Object> configuration, Mt101Message message) {
        var transportId = transport == null ? "" : transport.trim().toUpperCase(java.util.Locale.ROOT);
        if ("SFTP".equals(transportId)) {
            return sftpDropPath(configuration, message);
        }
        return restIdempotencyKey(configuration, message);
    }

    public static Map<String, Object> withResolvedCorrelation(String transport,
                                                              Map<String, Object> configuration,
                                                              Mt101Message message) {
        var copy = new LinkedHashMap<String, Object>(configuration);
        var transportId = transport == null ? "" : transport.trim().toUpperCase(java.util.Locale.ROOT);
        if ("SFTP".equals(transportId)) {
            var sftp = mapValue(copy.get("sftp"));
            if (!sftp.isEmpty()) {
                sftp.put("dropPathTemplate", sftpDropPath(configuration, message));
                copy.put("sftp", sftp);
            }
        } else {
            copy.put("idempotencyKeyTemplate", restIdempotencyKey(configuration, message));
        }
        return copy;
    }

    public static String restIdempotencyKey(Map<String, Object> configuration, Mt101Message message) {
        String template;
        if (configuration != null && configuration.containsKey("idempotencyKeyTemplate")) {
            var raw = configuration.get("idempotencyKeyTemplate");
            template = raw == null ? "" : String.valueOf(raw);
        } else {
            template = "${sendersReference}";
        }
        return resolveTemplate(template, message);
    }

    public static String sftpDropPath(Map<String, Object> configuration, Mt101Message message) {
        var sftp = mapValue(configuration == null ? null : configuration.get("sftp"));
        return resolveTemplate(stringValue(sftp.get("dropPathTemplate"), ""), message);
    }

    public static String resolveTemplate(String template, Mt101Message message) {
        if (template == null || template.isBlank()) {
            return template;
        }
        var sendersReference = message != null && message.sequenceA() != null
                ? message.sequenceA().sendersReference() : "";
        var uetr = message != null && message.envelope() != null ? message.envelope().uetr() : "";
        return template
                .replace("${sendersReference}", sendersReference == null ? "" : sendersReference)
                .replace("${uetr}", uetr == null ? "" : uetr);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object raw) {
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return new LinkedHashMap<>();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private static String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }
}
