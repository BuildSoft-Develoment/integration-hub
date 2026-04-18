package com.integrationhub.platform.provider.reader;

import java.util.Map;

final class ReaderRowSupport {

    private ReaderRowSupport() {
    }

    static int dataStartRowIndex(Map<String, Object> configuration, int defaultRowNumber) {
        if (configuration != null && configuration.containsKey("rowData")) {
            return Math.max(0, optionalInt(configuration, "rowData", defaultRowNumber) - 1);
        }
        if (configuration != null && configuration.containsKey("dataStartRowIndex")) {
            return Math.max(0, optionalInt(configuration, "dataStartRowIndex", Math.max(defaultRowNumber - 1, 0)));
        }
        return Math.max(defaultRowNumber - 1, 0);
    }

    static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        var value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }
}
