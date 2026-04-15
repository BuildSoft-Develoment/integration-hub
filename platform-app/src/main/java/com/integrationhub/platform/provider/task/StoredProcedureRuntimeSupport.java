package com.integrationhub.platform.provider.task;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;

final class StoredProcedureRuntimeSupport {

    private StoredProcedureRuntimeSupport() {
    }

    static Map<String, Object> buildRuntimeVariables(Map<String, Object> executionVariables,
                                                     Long processExecutionId,
                                                     Long taskDefinitionId,
                                                     Integer recordCount,
                                                     Integer skippedCount,
                                                     String sourceFileName,
                                                     String sourceFilePath,
                                                     String sourceMediaType,
                                                     Long sourceFileSize,
                                                     Instant sourceLastModified) {
        var variables = new LinkedHashMap<String, Object>();
        if (executionVariables != null) {
            executionVariables.forEach((key, value) -> {
                if (key != null && !String.valueOf(key).isBlank()) {
                    variables.put(String.valueOf(key), value);
                }
            });
        }
        variables.put("_processExecutionId", processExecutionId);
        variables.put("_executionId", processExecutionId);
        variables.put("_taskDefinitionId", taskDefinitionId);
        variables.put("_recordCount", recordCount == null ? 0 : recordCount);
        variables.put("_skippedCount", skippedCount == null ? 0 : skippedCount);
        if (sourceFileName != null && !sourceFileName.isBlank()) {
            variables.put("_sourceFileName", sourceFileName);
        }
        if (sourceFilePath != null && !sourceFilePath.isBlank()) {
            variables.put("_sourceFilePath", sourceFilePath);
        }
        if (sourceMediaType != null && !sourceMediaType.isBlank()) {
            variables.put("_sourceMediaType", sourceMediaType);
        }
        if (sourceFileSize != null) {
            variables.put("_sourceFileSize", sourceFileSize);
        }
        if (sourceLastModified != null) {
            variables.put("_sourceLastModified", sourceLastModified.toString());
        }
        return variables;
    }

    static ResolvedParameter resolveParameter(ProcedureParameter parameter, Map<String, Object> runtimeVariables) {
        if (parameter.direction() == ParameterDirection.OUT) {
            return new ResolvedParameter(parameter.name(), null, parameter.jdbcType(), sqlType(parameter.jdbcType()), parameter.direction());
        }
        Object rawValue;
        if (parameter.expression() != null && parameter.expression().startsWith("const:")) {
            rawValue = parameter.expression().substring("const:".length());
        } else {
            rawValue = runtimeVariables.get(parameter.expression());
        }
        if (rawValue == null) {
            if (!parameter.required()) {
                return new ResolvedParameter(parameter.name(), null, parameter.jdbcType(), sqlType(parameter.jdbcType()), parameter.direction());
            }
            throw new IllegalArgumentException("Missing runtime value for stored procedure parameter: " + parameter.expression());
        }
        return new ResolvedParameter(parameter.name(), convert(rawValue, parameter.jdbcType()), parameter.jdbcType(), sqlType(parameter.jdbcType()), parameter.direction());
    }

    static ParameterDirection parameterDirection(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return ParameterDirection.IN;
        }
        return switch (String.valueOf(value).trim().toUpperCase()) {
            case "OUT" -> ParameterDirection.OUT;
            case "INOUT" -> ParameterDirection.INOUT;
            default -> ParameterDirection.IN;
        };
    }

    static String postgresType(String jdbcType) {
        var normalizedType = jdbcType == null ? "VARCHAR" : jdbcType.trim().toUpperCase();
        return switch (normalizedType) {
            case "VARCHAR", "STRING" -> "varchar";
            case "TEXT" -> "text";
            case "INTEGER", "INT" -> "integer";
            case "BIGINT", "LONG" -> "bigint";
            case "DECIMAL", "NUMERIC" -> "numeric";
            case "BOOLEAN" -> "boolean";
            case "DATE" -> "date";
            case "TIMESTAMP" -> "timestamp";
            default -> throw new IllegalArgumentException("Unsupported JDBC type for PostgreSQL stored procedure parameter: " + jdbcType);
        };
    }

    private static Object convert(Object rawValue, String jdbcType) {
        if (rawValue == null) {
            return null;
        }
        var normalizedType = jdbcType == null ? "VARCHAR" : jdbcType.trim().toUpperCase();
        return switch (normalizedType) {
            case "VARCHAR", "STRING", "TEXT" -> String.valueOf(rawValue);
            case "INTEGER", "INT" -> rawValue instanceof Integer integerValue ? integerValue : Integer.parseInt(String.valueOf(rawValue));
            case "BIGINT", "LONG" -> rawValue instanceof Long longValue ? longValue : Long.parseLong(String.valueOf(rawValue));
            case "DECIMAL", "NUMERIC" -> rawValue instanceof BigDecimal decimalValue ? decimalValue : new BigDecimal(String.valueOf(rawValue));
            case "BOOLEAN" -> rawValue instanceof Boolean booleanValue ? booleanValue : Boolean.parseBoolean(String.valueOf(rawValue));
            case "DATE" -> toSqlDate(rawValue);
            case "TIMESTAMP" -> toSqlTimestamp(rawValue);
            default -> throw new IllegalArgumentException("Unsupported JDBC type for stored procedure parameter: " + jdbcType);
        };
    }

    private static Date toSqlDate(Object rawValue) {
        if (rawValue instanceof Date dateValue) {
            return dateValue;
        }
        if (rawValue instanceof LocalDate localDate) {
            return Date.valueOf(localDate);
        }
        return Date.valueOf(LocalDate.parse(String.valueOf(rawValue)));
    }

    private static Timestamp toSqlTimestamp(Object rawValue) {
        if (rawValue instanceof Timestamp timestampValue) {
            return timestampValue;
        }
        if (rawValue instanceof LocalDateTime localDateTime) {
            return Timestamp.valueOf(localDateTime);
        }
        if (rawValue instanceof Instant instant) {
            return Timestamp.from(instant);
        }
        var text = String.valueOf(rawValue);
        try {
            return Timestamp.valueOf(text.replace('T', ' '));
        } catch (IllegalArgumentException error) {
            try {
                return Timestamp.from(OffsetDateTime.parse(text).toInstant());
            } catch (DateTimeParseException ignored) {
                throw error;
            }
        }
    }

    private static int sqlType(String jdbcType) {
        var normalizedType = jdbcType == null ? "VARCHAR" : jdbcType.trim().toUpperCase();
        return switch (normalizedType) {
            case "VARCHAR", "STRING", "TEXT" -> Types.VARCHAR;
            case "INTEGER", "INT" -> Types.INTEGER;
            case "BIGINT", "LONG" -> Types.BIGINT;
            case "DECIMAL", "NUMERIC" -> Types.NUMERIC;
            case "BOOLEAN" -> Types.BOOLEAN;
            case "DATE" -> Types.DATE;
            case "TIMESTAMP" -> Types.TIMESTAMP;
            default -> throw new IllegalArgumentException("Unsupported JDBC type for stored procedure parameter: " + jdbcType);
        };
    }

    enum ParameterDirection {
        IN,
        OUT,
        INOUT
    }

    record ProcedureParameter(String name, String expression, String jdbcType, ParameterDirection direction, boolean required) {
    }

    record ResolvedParameter(String name, Object value, String jdbcType, int sqlType, ParameterDirection direction) {
    }
}