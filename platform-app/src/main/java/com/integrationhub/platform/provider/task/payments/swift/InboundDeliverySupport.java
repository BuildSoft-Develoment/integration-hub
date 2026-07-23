package com.integrationhub.platform.provider.task.payments.swift;

/** Helpers de lectura de config compartidos por el provider y los {@link InboundDeliveryTransport}. */
final class InboundDeliverySupport {

    private InboundDeliverySupport() {
    }

    static String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    static int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw).trim());
    }
}
