package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.spi.payments.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Resuelve mensajes MT101 publicados por tareas previas.
 *
 * <p>Las tareas de la vertical SWIFT pueden recibir directamente
 * {@code List<Mt101Message>} desde {@code MT101_BUILD}/{@code MT101_SPLIT},
 * records de archivo como {@code Map} que embeben el mensaje en la clave
 * {@code message}, o una fuente persistida de fragmentos
 * {@code {fragmentSetId, connectionRef}} publicada por {@code MT101_BUILD_FROM_TABLE}.
 * Esta clase mantiene ese contrato uniforme.</p>
 */
final class Mt101MessageInputResolver {

    private Mt101MessageInputResolver() {
        // Utility class.
    }

    @SuppressWarnings("unchecked")
    static List<Mt101Message> readMessages(TaskContext context,
                                           Map<String, Object> configuration,
                                           String taskType) {
        return readMessages(context, configuration, taskType, null);
    }

    @SuppressWarnings("unchecked")
    static List<Mt101Message> readMessages(TaskContext context,
                                           Map<String, Object> configuration,
                                           String taskType,
                                           Mt101FragmentStore fragmentStore) {
        return readResolvedMessages(context, configuration, taskType, fragmentStore)
                .stream()
                .map(ResolvedMessage::message)
                .toList();
    }

    @SuppressWarnings("unchecked")
    static List<ResolvedMessage> readResolvedMessages(TaskContext context,
                                                      Map<String, Object> configuration,
                                                      String taskType,
                                                      Mt101FragmentStore fragmentStore) {
        var raw = rawSource(context, configuration, taskType);
        if (raw == null) {
            return List.of();
        }
        if (raw instanceof Map<?, ?> rawMap && rawMap.containsKey("fragmentSetId")) {
            if (fragmentStore == null) {
                throw new IllegalArgumentException(taskType + " cannot read MT101 fragment source without fragment store");
            }
            var source = new java.util.LinkedHashMap<String, Object>();
            rawMap.forEach((key, value) -> source.put(String.valueOf(key), value));
            context.attributes().put("mt101FragmentSource", source);
            return fragmentStore.readMessages(source)
                    .stream()
                    .map(message -> new ResolvedMessage(message, null, null, null))
                    .toList();
        }
        if (!(raw instanceof List<?> rawList)) {
            throw new IllegalArgumentException(
                    "Expected MT101 input to be List<Mt101Message> or fragment source but got "
                            + raw.getClass().getName());
        }
        var result = new ArrayList<ResolvedMessage>(rawList.size());
        for (var item : rawList) {
            if (item instanceof Mt101Message msg) {
                result.add(new ResolvedMessage(msg, null, null, null));
            } else if (item instanceof Map<?, ?> map && map.get("message") instanceof Mt101Message msg) {
                result.add(new ResolvedMessage(
                        msg,
                        longValue(map.get("archiveId")),
                        longValue(map.get("envelopeId")),
                        stringValue(map.get("connectionRef"), null)));
            } else if (item != null) {
                throw new IllegalArgumentException(
                        "Expected Mt101Message items but got " + item.getClass().getName());
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> fragmentSource(TaskContext context,
                                              Map<String, Object> configuration,
                                              String taskType) {
        var raw = rawSource(context, configuration, taskType);
        if (!(raw instanceof Map<?, ?> rawMap) || !rawMap.containsKey("fragmentSetId")) {
            return Map.of();
        }
        var source = new java.util.LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> source.put(String.valueOf(key), value));
        return source;
    }

    @SuppressWarnings("unchecked")
    private static Object rawSource(TaskContext context,
                                    Map<String, Object> configuration,
                                    String taskType) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()) {
            return null;
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
        return taskOutputs.get(key);
    }

    private static String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private static Long longValue(Object raw) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return null;
        }
        if (raw instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(raw));
    }

    record ResolvedMessage(Mt101Message message, Long archiveId, Long envelopeId, String connectionRef) {
    }
}
