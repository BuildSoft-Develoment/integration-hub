package com.integrationhub.vertical.swift.mt101.provider;

/** Helpers de lectura de config compartidos por el provider y los {@link InboundDeliveryTransport}. */
public final class InboundDeliverySupport {

    private InboundDeliverySupport() {
    }

    public static String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    public static int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw).trim());
    }
}
