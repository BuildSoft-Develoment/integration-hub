package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.provider.task.dbwrite.DbTaskSupport;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

final class StoredProcedureConfigurationSupport {

    private StoredProcedureConfigurationSupport() {
    }

    static String procedureName(Map<String, Object> configuration) {
        return DbTaskSupport.requireQualifiedIdentifier(configuration, "procedureName");
    }

    static int timeoutSeconds(Map<String, Object> configuration) {
        var value = configuration.get("timeoutSeconds");
        if (value == null || String.valueOf(value).isBlank()) {
            return 30;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    static List<StoredProcedureRuntimeSupport.ProcedureParameter> parameters(Map<String, Object> configuration) {
        var value = configuration.get("parameters");
        if (value == null) {
            return List.of();
        }
        if (!(value instanceof List<?> rawList)) {
            throw new IllegalArgumentException("parameters must be an array");
        }
        var parameters = new ArrayList<StoredProcedureRuntimeSupport.ProcedureParameter>();
        for (var item : rawList) {
            if (!(item instanceof Map<?, ?> rawMap)) {
                throw new IllegalArgumentException("Each procedure parameter must be an object");
            }
            var name = stringValue(rawMap.get("name"));
            var expression = stringValue(rawMap.get("value"));
            var jdbcType = stringValue(rawMap.get("jdbcType"));
            var direction = StoredProcedureRuntimeSupport.parameterDirection(rawMap.get("direction"));
            var required = rawMap.get("required") == null || Boolean.parseBoolean(String.valueOf(rawMap.get("required")));
            if (name.isBlank()) {
                throw new IllegalArgumentException("Each procedure parameter requires name");
            }
            if ((direction == StoredProcedureRuntimeSupport.ParameterDirection.IN
                    || direction == StoredProcedureRuntimeSupport.ParameterDirection.INOUT) && expression.isBlank()) {
                throw new IllegalArgumentException("Each IN/INOUT procedure parameter requires value");
            }
            parameters.add(new StoredProcedureRuntimeSupport.ProcedureParameter(
                    name.trim(),
                    expression.isBlank() ? null : expression.trim(),
                    jdbcType.isBlank() ? "VARCHAR" : jdbcType.trim().toUpperCase(),
                    direction,
                    required
            ));
        }
        return parameters;
    }

    private static String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
