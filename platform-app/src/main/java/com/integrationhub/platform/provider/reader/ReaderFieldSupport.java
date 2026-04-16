package com.integrationhub.platform.provider.reader;

import org.apache.commons.jexl3.JexlBuilder;
import org.apache.commons.jexl3.JexlEngine;
import org.apache.commons.jexl3.JexlScript;
import org.apache.commons.jexl3.MapContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

final class ReaderFieldSupport {

    private static final JexlEngine JEXL = createJexlEngine();
    private static final ConcurrentMap<String, JexlScript> SCRIPT_CACHE = new ConcurrentHashMap<>();

    private ReaderFieldSupport() {
    }

    private static JexlEngine createJexlEngine() {
        var namespaces = new LinkedHashMap<String, Object>();
        namespaces.put(null, new JexlFunctions());
        return new JexlBuilder().cache(128).strict(true).silent(false).namespaces(namespaces).create();
    }

    static RowProcessingResult processPositionalRow(List<ConfiguredField> fields, RawValueResolver rawValueResolver) {
        var rawRow = new LinkedHashMap<String, Object>();
        for (var field : fields) {
            rawRow.put(field.name(), rawValueResolver.resolve(field));
        }

        var workingRow = new LinkedHashMap<String, Object>();
        for (var field : fields) {
            workingRow.put(field.name(), applyDefault(field, rawRow.get(field.name())));
        }

        try {
            for (var field : fields) {
                var rawValue = rawRow.get(field.name());
                var currentValue = workingRow.get(field.name());
                var scriptOutcome = applyScript(field, currentValue, rawValue, rawRow, workingRow);
                if (scriptOutcome.skipRecord()) {
                    return RowProcessingResult.skip(scriptOutcome.reason());
                }
                workingRow.put(field.name(), scriptOutcome.value());
            }

            var validatedRow = new LinkedHashMap<String, Object>();
            for (var field : fields) {
                var value = coerceType(field, workingRow.get(field.name()));
                validateRequired(field, value);
                validateSize(field, value);
                validatedRow.put(field.name(), value);
            }
            return RowProcessingResult.success(validatedRow);
        } catch (IllegalArgumentException e) {
            return RowProcessingResult.skip(e.getMessage());
        }
    }

    static List<ConfiguredField> configuredFields(Object rawFields, String readerType) {
        if (!(rawFields instanceof List<?> fields)) {
            return List.of();
        }

        var configuredFields = new ArrayList<ConfiguredField>();
        for (var field : fields) {
            if (!(field instanceof Map<?, ?> rawFieldMap)) {
                continue;
            }
            var fieldMap = new LinkedHashMap<String, Object>();
            rawFieldMap.forEach((key, value) -> fieldMap.put(String.valueOf(key), value));
            configuredFields.add(ConfiguredField.from(fieldMap, readerType));
        }
        return configuredFields;
    }

    private static Object applyDefault(ConfiguredField field, Object rawValue) {
        if (!isBlankValue(rawValue)) {
            return rawValue;
        }
        if (field.defaultValue() != null && !field.defaultValue().isBlank()) {
            return field.defaultValue();
        }
        return rawValue;
    }

    private static ScriptOutcome applyScript(
            ConfiguredField field,
            Object value,
            Object rawValue,
            Map<String, Object> rawRow,
            Map<String, Object> row
    ) {
        if (field.script() == null || field.script().isBlank()) {
            return new ScriptOutcome(value, false, null);
        }
        try {
            var context = new MapContext();
            context.set("field", field.toContextMap());
            context.set("value", value);
            context.set("rawValue", rawValue);
            context.set("rawRow", rawRow);
            context.set("row", row);
            context.set("valid", true);
            context.set("skipRecord", false);
            context.set("message", null);
            var scriptResult = compiledScript(field.script()).execute(context);
            var resultingValue = context.has("value") ? context.get("value") : row.get(field.name());
            var skipRecord = toBoolean(context.get("skipRecord"));
            var valid = !context.has("valid") || toBoolean(context.get("valid"));
            var messageObject = context.has("message") ? context.get("message") : null;
            var message = messageObject == null ? null : String.valueOf(messageObject).trim();
            if (scriptResult instanceof Boolean booleanResult && !booleanResult) {
                valid = false;
            }
            if (!valid) {
                return new ScriptOutcome(resultingValue, true, message != null && !message.isBlank() ? message : "Field '" + field.name() + "' was rejected by script");
            }
            if (skipRecord) {
                return new ScriptOutcome(resultingValue, true, message != null && !message.isBlank() ? message : "Field '" + field.name() + "' requested to skip the record");
            }
            return new ScriptOutcome(resultingValue, false, null);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Invalid JEXL script for field '" + field.name() + "'", e);
        }
    }


    private static boolean toBoolean(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private static JexlScript compiledScript(String script) {
        return SCRIPT_CACHE.computeIfAbsent(script, JEXL::createScript);
    }

    private static Object coerceType(ConfiguredField field, Object value) {
        if (isBlankValue(value)) {
            return null;
        }
        return switch (field.type()) {
            case NUMBER -> new BigDecimal(String.valueOf(value).trim());
            case DATE -> parseDate(field, value);
            case TEXT -> String.valueOf(value).trim();
        };
    }

    private static Object parseDate(ConfiguredField field, Object value) {
        var raw = String.valueOf(value).trim();
        try {
            if (field.pattern() != null && !field.pattern().isBlank()) {
                var formatter = DateTimeFormatter.ofPattern(field.pattern());
                return LocalDate.parse(raw, formatter);
            }
            return LocalDate.parse(raw);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Field '" + field.name() + "' requires a valid DATE value", e);
        }
    }

    private static void validateRequired(ConfiguredField field, Object value) {
        if (field.required() && isBlankValue(value)) {
            throw new IllegalArgumentException("Field '" + field.name() + "' is required");
        }
    }

    private static void validateSize(ConfiguredField field, Object value) {
        if (value == null || field.size() == null || field.size() <= 0) {
            return;
        }
        var normalized = String.valueOf(value);
        if (normalized.length() > field.size()) {
            throw new IllegalArgumentException("Field '" + field.name() + "' exceeds size " + field.size());
        }
    }

    private static boolean isBlankValue(Object value) {
        return value == null || String.valueOf(value).trim().isEmpty();
    }

    @FunctionalInterface
    interface RawValueResolver {
        Object resolve(ConfiguredField field);
    }

    record RowProcessingResult(Map<String, Object> values, boolean skipped, String reason) {
        static RowProcessingResult success(Map<String, Object> values) {
            return new RowProcessingResult(values, false, null);
        }

        static RowProcessingResult skip(String reason) {
            return new RowProcessingResult(Map.of(), true, reason);
        }
    }

    record ScriptOutcome(Object value, boolean skipRecord, String reason) {
    }

    record ConfiguredField(
            String name,
            Integer position,
            Integer start,
            Integer end,
            FieldType type,
            Integer size,
            boolean required,
            String defaultValue,
            String script,
            String pattern
    ) {
        static ConfiguredField from(Map<String, Object> fieldMap, String readerType) {
            var rawName = fieldMap.get("name");
            if (rawName == null || String.valueOf(rawName).isBlank()) {
                throw new IllegalArgumentException(readerType + " field definitions require name");
            }
            var name = String.valueOf(rawName).trim();
            return new ConfiguredField(
                    name,
                    optionalInt(fieldMap.get("position")),
                    optionalInt(fieldMap.get("start")),
                    optionalInt(fieldMap.get("end")),
                    FieldType.from(fieldMap.get("type")),
                    optionalInt(fieldMap.get("size")),
                    Boolean.parseBoolean(String.valueOf(fieldMap.containsKey("required") ? fieldMap.get("required") : false)),
                    optionalString(fieldMap.get("defaultValue")),
                    optionalString(fieldMap.get("script")),
                    optionalString(fieldMap.get("pattern"))
            );
        }

        Map<String, Object> toContextMap() {
            var context = new LinkedHashMap<String, Object>();
            context.put("name", name);
            context.put("position", position);
            context.put("start", start);
            context.put("end", end);
            context.put("type", type.name());
            context.put("size", size);
            context.put("required", required);
            context.put("defaultValue", defaultValue);
            context.put("pattern", pattern);
            return context;
        }

        private static Integer optionalInt(Object value) {
            if (value == null || String.valueOf(value).isBlank()) {
                return null;
            }
            return Integer.parseInt(String.valueOf(value));
        }

        private static String optionalString(Object value) {
            if (value == null || String.valueOf(value).isBlank()) {
                return null;
            }
            return String.valueOf(value).trim();
        }
    }

    static final class JexlFunctions {
        public LocalDate currentDate() {
            return LocalDate.now();
        }

        public LocalDate today() {
            return currentDate();
        }

        public LocalDateTime currentTimestamp() {
            return LocalDateTime.now();
        }

        public LocalDateTime now() {
            return currentTimestamp();
        }

        public String uuid() {
            return UUID.randomUUID().toString();
        }

        public String formatDate(Object value, String pattern) {
            if (value == null || pattern == null || pattern.isBlank()) {
                return value == null ? null : String.valueOf(value);
            }
            var formatter = DateTimeFormatter.ofPattern(pattern);
            if (value instanceof LocalDate localDate) {
                return formatter.format(localDate);
            }
            if (value instanceof LocalDateTime localDateTime) {
                return formatter.format(localDateTime);
            }
            var raw = String.valueOf(value).trim();
            if (raw.isEmpty()) {
                return raw;
            }
            try {
                return formatter.format(LocalDateTime.parse(raw));
            } catch (DateTimeParseException ignored) {
            }
            try {
                return formatter.format(LocalDate.parse(raw));
            } catch (DateTimeParseException ignored) {
            }
            throw new IllegalArgumentException("Cannot format date value '" + raw + "'");
        }
    }
    enum FieldType {
        TEXT,
        NUMBER,
        DATE;

        static FieldType from(Object raw) {
            if (raw == null || String.valueOf(raw).isBlank()) {
                return TEXT;
            }
            return switch (String.valueOf(raw).trim().toUpperCase()) {
                case "NUMBER", "NUMERIC" -> NUMBER;
                case "DATE" -> DATE;
                default -> TEXT;
            };
        }
    }
}
