package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.spi.reader.ReadRecord;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

public final class DbTaskSupport {

    private static final Pattern IDENTIFIER_PATTERN = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");
    private static final Pattern FUNCTION_PATTERN = Pattern.compile("[A-Za-z_][A-Za-z0-9_.]*(\\((?:[A-Za-z0-9_\\s'',.-]*)\\))?");

    private DbTaskSupport() {
    }

    public static String mode(Map<String, Object> configuration) {
        return String.valueOf(configuration.getOrDefault("mode", "insert")).toLowerCase();
    }

    public static Optional<String> connectionRef(Map<String, Object> configuration) {
        var value = configuration.get("connectionRef");
        if (value == null || String.valueOf(value).isBlank()) {
            return Optional.empty();
        }
        return Optional.of(String.valueOf(value));
    }

    public static String requireQualifiedIdentifier(Map<String, Object> configuration, String key) {
        var value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("Missing required configuration key: " + key);
        }
        return sanitizeQualifiedIdentifier(String.valueOf(value));
    }

    public static String sanitizeQualifiedIdentifier(String identifier) {
        var parts = identifier.split("\\.");
        var sanitizedParts = new ArrayList<String>();
        for (var part : parts) {
            sanitizedParts.add(sanitizeIdentifier(part));
        }
        return String.join(".", sanitizedParts);
    }

    public static String sanitizeIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank() || !IDENTIFIER_PATTERN.matcher(identifier).matches()) {
            throw new IllegalArgumentException("Invalid SQL identifier: " + identifier);
        }
        return identifier;
    }

    public static String sanitizeFunction(String function) {
        if (function == null || function.isBlank()) {
            throw new IllegalArgumentException("Invalid SQL function: " + function);
        }
        var normalized = function.trim();
        if (!FUNCTION_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Invalid SQL function: " + function);
        }
        return normalized;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, String> columnMappings(Map<String, Object> configuration, List<ReadRecord> records) {
        var mappingObject = configuration.get("columnMappings");
        var mappings = new LinkedHashMap<String, String>();
        if (mappingObject == null) {
            if (records.isEmpty()) {
                return mappings;
            }
            records.get(0).values().keySet().forEach(key -> mappings.put(sanitizeIdentifier(key), key));
            return mappings;
        }
        if (!(mappingObject instanceof Map<?, ?> rawMappings)) {
            throw new IllegalArgumentException("columnMappings must be an object");
        }
        rawMappings.forEach((target, source) -> mappings.put(sanitizeIdentifier(String.valueOf(target)), String.valueOf(source)));
        return mappings;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, String> columnFunctions(Map<String, Object> configuration) {
        var functionObject = configuration.get("columnFunctions");
        var functions = new LinkedHashMap<String, String>();
        if (functionObject == null) {
            return functions;
        }
        if (!(functionObject instanceof Map<?, ?> rawFunctions)) {
            throw new IllegalArgumentException("columnFunctions must be an object");
        }
        rawFunctions.forEach((target, function) -> functions.put(sanitizeIdentifier(String.valueOf(target)), sanitizeFunction(String.valueOf(function))));
        return functions;
    }

    public static List<ColumnAssignment> assignments(Map<String, Object> configuration, List<ReadRecord> records) {
        var assignments = new ArrayList<ColumnAssignment>();
        var mappings = columnMappings(configuration, records);
        var functions = columnFunctions(configuration);
        mappings.forEach((column, sourceField) -> assignments.add(ColumnAssignment.field(column, sourceField)));
        functions.forEach((column, function) -> {
            if (mappings.containsKey(column)) {
                throw new IllegalArgumentException("Column cannot be mapped and assigned a DB function at the same time: " + column);
            }
            assignments.add(ColumnAssignment.dbFunction(column, function));
        });
        return assignments;
    }

    @SuppressWarnings("unchecked")
    public static List<String> keyColumns(Map<String, Object> configuration) {
        var keyObject = configuration.get("keyColumns");
        if (keyObject == null) {
            return List.of();
        }
        if (!(keyObject instanceof List<?> rawList)) {
            throw new IllegalArgumentException("keyColumns must be an array");
        }
        var keys = new ArrayList<String>();
        for (var value : rawList) {
            keys.add(sanitizeIdentifier(String.valueOf(value)));
        }
        return keys;
    }

    public static int batchSize(Map<String, Object> configuration) {
        var value = configuration.get("batchSize");
        if (value == null || String.valueOf(value).isBlank()) {
            return 500;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    public static List<String> insertColumns(List<ColumnAssignment> assignments) {
        return assignments.stream().map(ColumnAssignment::column).toList();
    }

    public static List<ColumnAssignment> updateAssignments(List<ColumnAssignment> assignments, List<String> keyColumns) {
        Set<String> keySet = new LinkedHashSet<>(keyColumns);
        var updateAssignments = new ArrayList<ColumnAssignment>();
        for (var assignment : assignments) {
            if (!keySet.contains(assignment.column())) {
                updateAssignments.add(assignment);
            }
        }
        return updateAssignments;
    }

    public static Map<String, ColumnAssignment> assignmentIndex(List<ColumnAssignment> assignments) {
        var assignmentsByColumn = new LinkedHashMap<String, ColumnAssignment>();
        for (var assignment : assignments) {
            assignmentsByColumn.put(assignment.column(), assignment);
        }
        return assignmentsByColumn;
    }

    public static Object value(ReadRecord record, String sourceField) {
        return record.values().get(sourceField);
    }

    public record ColumnAssignment(String column, String sourceField, String dbFunction) {
        public static ColumnAssignment field(String column, String sourceField) {
            return new ColumnAssignment(column, sourceField, null);
        }

        public static ColumnAssignment dbFunction(String column, String dbFunction) {
            return new ColumnAssignment(column, null, dbFunction);
        }

        public boolean isDbFunction() {
            return dbFunction != null;
        }
    }
}
