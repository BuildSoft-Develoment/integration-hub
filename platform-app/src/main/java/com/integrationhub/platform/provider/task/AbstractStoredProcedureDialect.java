package com.integrationhub.platform.provider.task;

import javax.sql.DataSource;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

abstract class AbstractStoredProcedureDialect implements StoredProcedureDialect {

    @Override
    public Map<String, Object> execute(Connection connection,
                                       String procedureName,
                                       int timeoutSeconds,
                                       List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) throws SQLException {
        var sql = callStatement(procedureName, parameters);
        try (CallableStatement statement = connection.prepareCall(sql)) {
            statement.setQueryTimeout(timeoutSeconds);
            for (int index = 0; index < parameters.size(); index++) {
                var parameter = parameters.get(index);
                if (isOutputParameter(parameter)) {
                    statement.registerOutParameter(index + 1, parameter.sqlType());
                }
                if (parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.IN
                        || parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.INOUT) {
                    if (parameter.value() == null) {
                        statement.setNull(index + 1, parameter.sqlType());
                    } else {
                        statement.setObject(index + 1, parameter.value(), parameter.sqlType());
                    }
                }
            }
            statement.execute();
            return collectCallableOutputs(statement, parameters);
        }
    }

    @Override
    public String buildErrorMessage(DataSource targetDataSource,
                                    String procedureName,
                                    List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                    SQLException error,
                                    String baseMessage) {
        return baseMessage;
    }

    protected String positionalCallStatement(String procedureName,
                                             List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        var placeholders = parameters.isEmpty() ? "" : String.join(", ", java.util.Collections.nCopies(parameters.size(), "?"));
        return "{ call " + procedureName + "(" + placeholders + ") }";
    }

    protected boolean isOutputParameter(StoredProcedureRuntimeSupport.ResolvedParameter parameter) {
        return parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.OUT
                || parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.INOUT;
    }

    protected Map<String, Object> collectCallableOutputs(CallableStatement statement,
                                                         List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) throws SQLException {
        var outputs = new LinkedHashMap<String, Object>();
        for (int index = 0; index < parameters.size(); index++) {
            var parameter = parameters.get(index);
            if (isOutputParameter(parameter)) {
                outputs.put(normalizeOutputName(parameter.name()), statement.getObject(index + 1));
            }
        }
        return outputs;
    }

    protected Map<String, Object> collectResultSetOutputs(ResultSet resultSet,
                                                          List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) throws SQLException {
        if (!resultSet.next()) {
            throw new SQLException("Procedure returned no output row");
        }
        var outputs = new LinkedHashMap<String, Object>();
        int outputColumnIndex = 1;
        for (var parameter : parameters) {
            if (isOutputParameter(parameter)) {
                outputs.put(normalizeOutputName(parameter.name()), resultSet.getObject(outputColumnIndex++));
            }
        }
        return outputs;
    }

    protected void bindPreparedStatement(PreparedStatement statement,
                                         List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) throws SQLException {
        for (int index = 0; index < parameters.size(); index++) {
            var parameter = parameters.get(index);
            if (parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.OUT) {
                statement.setNull(index + 1, parameter.sqlType());
                continue;
            }
            if (parameter.value() == null) {
                statement.setNull(index + 1, parameter.sqlType());
            } else {
                statement.setObject(index + 1, parameter.value(), parameter.sqlType());
            }
        }
    }

    protected String normalizeOutputName(String parameterName) {
        if (parameterName == null) {
            return null;
        }
        return parameterName.replaceFirst("^@+", "");
    }
}
