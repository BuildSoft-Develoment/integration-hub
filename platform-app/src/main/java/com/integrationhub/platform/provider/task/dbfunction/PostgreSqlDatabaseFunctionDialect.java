package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class PostgreSqlDatabaseFunctionDialect extends AbstractDatabaseFunctionDialect {

    @Override
    public ConnectionType connectionType() {
        return ConnectionType.POSTGRESQL;
    }

    @Override
    public String selectStatement(String functionName,
                                  List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                  String resultAlias) {
        var placeholders = parameters.stream()
                .map(parameter -> "cast(? as " + StoredProcedureRuntimeSupport.postgresType(parameter.jdbcType()) + ")")
                .collect(Collectors.joining(", "));
        return "select * from " + sanitizeQualifiedFunctionName(functionName) + "(" + placeholders + ")";
    }

    @Override
    public String buildErrorMessage(String functionName,
                                    List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                    SQLException error,
                                    String baseMessage,
                                    Connection connection) {
        if (!"42883".equals(error.getSQLState())) {
            return baseMessage;
        }
        return baseMessage + ". PostgreSQL did not find any function with that name.";
    }
}
