package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.spi.task.support.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.spi.task.support.DbTaskSupport;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

abstract class AbstractDatabaseFunctionDialect implements DatabaseFunctionDialect {

    @Override
    public Map<String, Object> execute(java.sql.Connection connection,
                                       String functionName,
                                       int timeoutSeconds,
                                       List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                       String resultAlias) throws SQLException {
        var sql = selectStatement(functionName, parameters, resultAlias);
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setQueryTimeout(timeoutSeconds);
            bindParameters(statement, parameters);
            try (ResultSet resultSet = statement.executeQuery()) {
                return collectOutputs(resultSet);
            }
        }
    }

    protected String sanitizeQualifiedFunctionName(String functionName) {
        return DbTaskSupport.sanitizeQualifiedIdentifier(functionName);
    }

    protected String sanitizeResultAlias(String resultAlias) {
        return DbTaskSupport.sanitizeIdentifier(resultAlias);
    }

    protected String positionalArguments(List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        return parameters.stream()
                .map(parameter -> "?")
                .collect(Collectors.joining(", "));
    }

    protected String selectTableFunction(String functionName,
                                         List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        return "select * from " + sanitizeQualifiedFunctionName(functionName) + "(" + positionalArguments(parameters) + ")";
    }

    protected String selectScalarFunction(String functionName,
                                          List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                          String aliasExpression,
                                          String suffix) {
        return "select " + sanitizeQualifiedFunctionName(functionName) + "(" + positionalArguments(parameters) + ") as "
                + aliasExpression + suffix;
    }

    protected void bindParameters(PreparedStatement statement,
                                  List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) throws SQLException {
        for (int index = 0; index < parameters.size(); index++) {
            var parameter = parameters.get(index);
            if (parameter.value() == null) {
                statement.setNull(index + 1, parameter.sqlType());
            } else {
                statement.setObject(index + 1, parameter.value(), parameter.sqlType());
            }
        }
    }

    protected Map<String, Object> collectOutputs(ResultSet resultSet) throws SQLException {
        if (!resultSet.next()) {
            return Map.of();
        }
        var outputs = new LinkedHashMap<String, Object>();
        ResultSetMetaData metadata = resultSet.getMetaData();
        for (int index = 1; index <= metadata.getColumnCount(); index++) {
            outputs.put(normalizeOutputName(metadata.getColumnLabel(index)), resultSet.getObject(index));
        }
        return outputs;
    }

    protected String normalizeOutputName(String columnLabel) {
        if (columnLabel == null) {
            return null;
        }
        return columnLabel.replaceFirst("^@+", "");
    }
}
