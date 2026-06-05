package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.provider.task.dbwrite.DbTaskSupport;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

final class DatabaseFunctionConfigurationSupport {

    private DatabaseFunctionConfigurationSupport() {
    }

    static String functionName(Map<String, Object> configuration) {
        var value = configuration.get("functionName");
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("Missing required configuration key: functionName");
        }
        return String.valueOf(value).trim();
    }

    static int timeoutSeconds(Map<String, Object> configuration) {
        var value = configuration.get("timeoutSeconds");
        if (value == null || String.valueOf(value).isBlank()) {
            return 30;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    static String resultAlias(Map<String, Object> configuration) {
        var value = configuration.get("resultAlias");
        if (value == null || String.valueOf(value).isBlank()) {
            return "resultado";
        }
        return DbTaskSupport.sanitizeIdentifier(String.valueOf(value).trim());
    }

    @SuppressWarnings("unchecked")
    static List<StoredProcedureRuntimeSupport.ProcedureParameter> parameters(Map<String, Object> configuration) {
        var rawParameters = configuration.get("parameters");
        if (rawParameters == null) {
            return List.of();
        }
        if (!(rawParameters instanceof List<?> parameterList)) {
            throw new IllegalArgumentException("Function parameters must be an array");
        }
        var parameters = new ArrayList<StoredProcedureRuntimeSupport.ProcedureParameter>();
        for (var rawParameter : parameterList) {
            if (!(rawParameter instanceof Map<?, ?> rawMap)) {
                throw new IllegalArgumentException("Each function parameter must be an object");
            }
            var parameter = (Map<String, Object>) rawMap;
            var name = String.valueOf(parameter.getOrDefault("name", "")).trim();
            var expression = parameterExpression(parameter);
            var jdbcType = String.valueOf(parameter.getOrDefault("jdbcType", "VARCHAR")).trim().toUpperCase();
            var direction = StoredProcedureRuntimeSupport.parameterDirection(parameter.get("direction"));
            if (name.isBlank()) {
                throw new IllegalArgumentException("Function parameter name is required");
            }
            if (direction != StoredProcedureRuntimeSupport.ParameterDirection.IN) {
                throw new IllegalArgumentException("Database functions currently support only IN parameters: " + name);
            }
            if (expression.isBlank()) {
                throw new IllegalArgumentException("Function parameter value is required: " + name);
            }
            var required = parameter.get("required") == null || Boolean.parseBoolean(String.valueOf(parameter.get("required")));
            parameters.add(new StoredProcedureRuntimeSupport.ProcedureParameter(name, expression, jdbcType, direction, required));
        }
        return List.copyOf(parameters);
    }

    private static String parameterExpression(Map<String, Object> parameter) {
        var value = String.valueOf(parameter.getOrDefault("value", "")).trim();
        if (!value.isBlank()) {
            return value;
        }
        var expression = String.valueOf(parameter.getOrDefault("expression", "")).trim();
        if (!expression.isBlank()) {
            return expression;
        }
        var sourceKey = String.valueOf(parameter.getOrDefault("sourceKey", "")).trim();
        if (sourceKey.isBlank()) {
            return "";
        }
        var sourceKind = String.valueOf(parameter.getOrDefault("sourceKind", "")).trim().toLowerCase();
        if ("constant".equals(sourceKind) || "const".equals(sourceKind)) {
            return sourceKey.startsWith("const:") ? sourceKey : "const:" + sourceKey;
        }
        var sourceTaskRef = String.valueOf(parameter.getOrDefault("sourceTaskRef", "")).trim();
        var sourceOutput = String.valueOf(parameter.getOrDefault("sourceOutput", "")).trim();
        if (!sourceTaskRef.isBlank()) {
            if (sourceOutput.isBlank() && ("summary".equals(sourceKind) || "records".equals(sourceKind)
                    || "table".equals(sourceKind) || "errors".equals(sourceKind) || "out".equals(sourceKind)
                    || "metadata".equals(sourceKind))) {
                sourceOutput = sourceKind;
            }
            if (!sourceOutput.isBlank()) {
                return sourceTaskRef + "." + sourceOutput + "." + sourceKey;
            }
            return sourceTaskRef + "." + sourceKey;
        }
        return sourceKey;
    }
}
