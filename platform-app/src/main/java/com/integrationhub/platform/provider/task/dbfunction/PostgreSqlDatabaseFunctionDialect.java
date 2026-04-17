package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.provider.task.dbwrite.DbTaskSupport;
import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class PostgreSqlDatabaseFunctionDialect implements DatabaseFunctionDialect {

    @Override
    public boolean supports(String databaseProductName) {
        return databaseProductName != null && databaseProductName.toLowerCase().contains("postgres");
    }

    @Override
    public String selectStatement(String functionName,
                                  List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                  String resultAlias) {
        var qualifiedName = DbTaskSupport.sanitizeQualifiedIdentifier(functionName);
        var placeholders = parameters.stream()
                .map(parameter -> "cast(? as " + StoredProcedureRuntimeSupport.postgresType(parameter.jdbcType()) + ")")
                .collect(Collectors.joining(", "));
        return "select * from " + qualifiedName + "(" + placeholders + ")";
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
