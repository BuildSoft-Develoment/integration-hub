package com.integrationhub.platform.provider.task.storedprocedure;

import com.integrationhub.platform.spi.task.support.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.spi.task.support.DbTaskSupport;
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
            var expression = parameterExpression(rawMap);
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

    private static String parameterExpression(Map<?, ?> rawMap) {
        var value = stringValue(rawMap.get("value"));
        if (!value.isBlank()) {
            return value.trim();
        }
        var expression = stringValue(rawMap.get("expression"));
        if (!expression.isBlank()) {
            return expression.trim();
        }
        var sourceKey = stringValue(rawMap.get("sourceKey"));
        if (sourceKey.isBlank()) {
            return "";
        }
        var sourceKind = stringValue(rawMap.get("sourceKind")).toLowerCase();
        if ("constant".equals(sourceKind) || "const".equals(sourceKind)) {
            return sourceKey.startsWith("const:") ? sourceKey : "const:" + sourceKey;
        }
        var sourceTaskRef = stringValue(rawMap.get("sourceTaskRef"));
        var sourceOutput = stringValue(rawMap.get("sourceOutput"));
        if (!sourceTaskRef.isBlank()) {
            // Solo los outputs AGREGADOS (summary/out/metadata) se publican como claves calificadas
            // `task.<output>.<campo>` y se resuelven asi (sin colision en fan-in). Los flujos por
            // registro (records/table/errors) NO tienen esas claves: el campo viene del registro
            // actual y se resuelve por clave plana, por eso aqui no se infiere sourceOutput.
            if (sourceOutput.isBlank() && ("summary".equals(sourceKind) || "out".equals(sourceKind)
                    || "metadata".equals(sourceKind))) {
                sourceOutput = sourceKind;
            }
            if (!sourceOutput.isBlank()) {
                return sourceTaskRef + "." + sourceOutput + "." + sourceKey.trim();
            }
            return sourceTaskRef + "." + sourceKey.trim();
        }
        return sourceKey.trim();
    }
}
