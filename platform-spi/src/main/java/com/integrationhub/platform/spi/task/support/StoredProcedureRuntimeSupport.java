package com.integrationhub.platform.spi.task.support;

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

public final class StoredProcedureRuntimeSupport {

    private StoredProcedureRuntimeSupport() {
    }

    public static Map<String, Object> buildRuntimeVariables(Map<String, Object> executionVariables,
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

    public static ResolvedParameter resolveParameter(ProcedureParameter parameter, Map<String, Object> runtimeVariables) {
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

    public static ParameterDirection parameterDirection(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return ParameterDirection.IN;
        }
        return switch (String.valueOf(value).trim().toUpperCase()) {
            case "OUT" -> ParameterDirection.OUT;
            case "INOUT" -> ParameterDirection.INOUT;
            default -> ParameterDirection.IN;
        };
    }

    public static String postgresType(String jdbcType) {
        var normalizedType = normalizeJdbcType(jdbcType);
        return switch (normalizedType) {
            case "VARCHAR", "STRING" -> "varchar";
            case "TEXT" -> "text";
            case "INTEGER", "INT" -> "integer";
            case "BIGINT", "LONG" -> "bigint";
            case "DECIMAL", "NUMERIC" -> "numeric";
            case "DOUBLE" -> "double precision";
            case "REAL" -> "real";
            case "BOOLEAN" -> "boolean";
            case "CHAR" -> "char";
            case "DATE" -> "date";
            case "TIMESTAMP" -> "timestamp";
            case "BYTEA" -> "bytea";
            default -> throw new IllegalArgumentException("Unsupported JDBC type for PostgreSQL stored procedure parameter: " + jdbcType);
        };
    }

    private static Object convert(Object rawValue, String jdbcType) {
        if (rawValue == null) {
            return null;
        }
        var normalizedType = normalizeJdbcType(jdbcType);
        return switch (normalizedType) {
            case "VARCHAR", "STRING", "TEXT", "CHAR" -> String.valueOf(rawValue);
            case "INTEGER", "INT" -> rawValue instanceof Integer integerValue ? integerValue : Integer.parseInt(String.valueOf(rawValue));
            case "BIGINT", "LONG" -> rawValue instanceof Long longValue ? longValue : Long.parseLong(String.valueOf(rawValue));
            case "DECIMAL", "NUMERIC" -> rawValue instanceof BigDecimal decimalValue ? decimalValue : new BigDecimal(String.valueOf(rawValue));
            case "DOUBLE" -> rawValue instanceof Double doubleValue ? doubleValue : Double.parseDouble(String.valueOf(rawValue));
            case "REAL" -> rawValue instanceof Float floatValue ? floatValue : Float.parseFloat(String.valueOf(rawValue));
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
        var normalizedType = normalizeJdbcType(jdbcType);
        return switch (normalizedType) {
            case "VARCHAR", "STRING", "TEXT" -> Types.VARCHAR;
            case "CHAR" -> Types.CHAR;
            case "INTEGER", "INT" -> Types.INTEGER;
            case "BIGINT", "LONG" -> Types.BIGINT;
            case "DECIMAL", "NUMERIC" -> Types.NUMERIC;
            case "DOUBLE" -> Types.DOUBLE;
            case "REAL" -> Types.REAL;
            case "BOOLEAN" -> Types.BOOLEAN;
            case "DATE" -> Types.DATE;
            case "TIMESTAMP" -> Types.TIMESTAMP;
            case "BYTEA" -> Types.BINARY;
            default -> throw new IllegalArgumentException("Unsupported JDBC type for stored procedure parameter: " + jdbcType);
        };
    }

    private static String normalizeJdbcType(String jdbcType) {
        if (jdbcType == null || jdbcType.isBlank()) {
            return "VARCHAR";
        }
        var normalized = jdbcType.trim().toUpperCase();
        return switch (normalized) {
            case "VARCHAR", "CHARACTER VARYING", "CHAR VARYING", "STRING" -> "VARCHAR";
            case "TEXT" -> "TEXT";
            case "CHAR", "CHARACTER", "BPCHAR" -> "CHAR";
            case "INTEGER", "INT", "INT4", "SERIAL", "SERIAL4" -> "INTEGER";
            case "BIGINT", "LONG", "INT8", "BIGSERIAL", "SERIAL8" -> "BIGINT";
            case "SMALLINT", "INT2", "SMALLSERIAL", "SERIAL2" -> "INTEGER";
            case "DECIMAL", "NUMERIC" -> "NUMERIC";
            case "DOUBLE", "DOUBLE PRECISION", "FLOAT8" -> "DOUBLE";
            case "REAL", "FLOAT4" -> "REAL";
            case "BOOLEAN", "BOOL" -> "BOOLEAN";
            case "DATE" -> "DATE";
            case "TIMESTAMP", "TIMESTAMP WITHOUT TIME ZONE", "TIMESTAMP WITH TIME ZONE", "TIMESTAMPTZ" -> "TIMESTAMP";
            case "BYTEA", "BINARY", "VARBINARY" -> "BYTEA";
            default -> normalized;
        };
    }

    public enum ParameterDirection {
        IN,
        OUT,
        INOUT
    }

    public record ProcedureParameter(String name, String expression, String jdbcType, ParameterDirection direction, boolean required) {
    }

    public record ResolvedParameter(String name, Object value, String jdbcType, int sqlType, ParameterDirection direction) {
    }
}
