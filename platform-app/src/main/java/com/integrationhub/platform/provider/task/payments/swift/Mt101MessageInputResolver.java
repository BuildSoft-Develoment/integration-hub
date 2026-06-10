package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Resuelve mensajes MT101 publicados por tareas previas.
 *
 * <p>Las tareas de la vertical SWIFT pueden recibir directamente
 * {@code List<Mt101Message>} desde {@code MT101_BUILD}/{@code MT101_SPLIT}, o
 * records de archivo como {@code Map} que embeben el mensaje en la clave
 * {@code message}. Esta clase mantiene ese contrato uniforme.</p>
 */
final class Mt101MessageInputResolver {

    private Mt101MessageInputResolver() {
        // Utility class.
    }

    @SuppressWarnings("unchecked")
    static List<Mt101Message> readMessages(TaskContext context,
                                           Map<String, Object> configuration,
                                           String taskType) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()) {
            return List.of();
        }
        if (!(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            throw new IllegalArgumentException(taskType + " requires configuration.input");
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException(taskType + " input.sourceTaskRef is required");
        }
        var sourceOutput = stringValue(((Map<String, Object>) rawInput).get("sourceOutput"), "records");
        var key = sourceTaskRef + "." + sourceOutput;
        var raw = taskOutputs.get(key);
        if (raw == null) {
            return List.of();
        }
        if (!(raw instanceof List<?> rawList)) {
            throw new IllegalArgumentException(
                    "Expected " + key + " to be List<Mt101Message> but got " + raw.getClass().getName());
        }
        var result = new ArrayList<Mt101Message>(rawList.size());
        for (var item : rawList) {
            if (item instanceof Mt101Message msg) {
                result.add(msg);
            } else if (item instanceof Map<?, ?> map && map.get("message") instanceof Mt101Message msg) {
                result.add(msg);
            } else if (item != null) {
                throw new IllegalArgumentException(
                        "Expected Mt101Message items at " + key + " but got " + item.getClass().getName());
            }
        }
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
