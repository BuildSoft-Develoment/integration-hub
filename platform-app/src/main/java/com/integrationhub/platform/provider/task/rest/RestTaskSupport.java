package com.integrationhub.platform.provider.task.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.provider.task.common.TaskOutputSupport;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.TaskContext;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class RestTaskSupport {

    private RestTaskSupport() {
    }

    static String requireString(Map<String, Object> configuration, String key) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("Missing required configuration key: " + key);
        }
        return String.valueOf(value);
    }

    static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
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

    static Map<String, Object> buildRecordVariables(ReadRecord record, int recordIndex, int totalRecords, TaskContext context) {
        Map<String, Object> variables = new LinkedHashMap<>(record.values());
        variables.put("recordIndex", recordIndex);
        variables.put("recordNumber", recordIndex + 1);
        variables.put("recordCount", totalRecords);
        variables.put("processExecutionId", context.processExecutionId());
        variables.put("taskDefinitionId", context.taskDefinitionId());
        TaskOutputSupport.mergeTaskOutputs(variables, context);
        TaskOutputSupport.mergeMetadata(variables, context);
        return variables;
    }

    static Map<String, Object> buildBatchVariables(List<ReadRecord> records, TaskContext context, ObjectMapper objectMapper) {
        Map<String, Object> variables = new LinkedHashMap<>();
        variables.put("recordCount", records.size());
        variables.put("processExecutionId", context.processExecutionId());
        variables.put("taskDefinitionId", context.taskDefinitionId());
        TaskOutputSupport.mergeTaskOutputs(variables, context);
        TaskOutputSupport.mergeMetadata(variables, context);
        variables.put("recordsJson", toJson(records.stream().map(ReadRecord::values).toList(), objectMapper));
        return variables;
    }

    static String template(String template, Map<String, Object> variables) {
        String resolved = template;
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            String placeholder = "${" + entry.getKey() + "}";
            resolved = resolved.replace(placeholder, entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
            resolved = resolved.replace("{" + entry.getKey() + "}", entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
        }
        return resolved;
    }

    static String resolveBody(String bodyTemplate, ReadRecord record, ObjectMapper objectMapper, Map<String, Object> variables) {
        if (bodyTemplate == null || bodyTemplate.isBlank()) {
            return toJson(record.values(), objectMapper);
        }
        Map<String, Object> extendedVariables = new LinkedHashMap<>(variables);
        extendedVariables.put("recordJson", toJson(record.values(), objectMapper));
        return template(bodyTemplate, extendedVariables);
    }

    static String resolveBatchBody(String bodyTemplate, List<ReadRecord> records, ObjectMapper objectMapper, Map<String, Object> variables) {
        if (bodyTemplate == null || bodyTemplate.isBlank()) {
            return toJson(records.stream().map(ReadRecord::values).toList(), objectMapper);
        }
        return template(bodyTemplate, variables);
    }

    private static String toJson(Object value, ObjectMapper objectMapper) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot serialize REST payload", e);
        }
    }
}
