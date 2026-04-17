package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.provider.task.dbwrite.DbTaskSupport;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class MySqlDatabaseFunctionDialect implements DatabaseFunctionDialect {

    @Override
    public boolean supports(String databaseProductName) {
        return databaseProductName != null && databaseProductName.toLowerCase().contains("mysql");
    }

    @Override
    public String selectStatement(String functionName,
                                  List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                  String resultAlias) {
        var qualifiedName = DbTaskSupport.sanitizeQualifiedIdentifier(functionName);
        var alias = DbTaskSupport.sanitizeIdentifier(resultAlias);
        var placeholders = parameters.stream()
                .map(parameter -> "?")
                .collect(Collectors.joining(", "));
        return "select " + qualifiedName + "(" + placeholders + ") as `" + alias + "`";
    }
}
