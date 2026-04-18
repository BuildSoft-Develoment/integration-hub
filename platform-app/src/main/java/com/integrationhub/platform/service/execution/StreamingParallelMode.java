package com.integrationhub.platform.service.execution;

public enum StreamingParallelMode {
    FILE,
    BATCH;

    public static StreamingParallelMode from(Object value) {
        if (value == null) {
            return FILE;
        }
        return "batch".equalsIgnoreCase(String.valueOf(value).trim()) ? BATCH : FILE;
    }
}
