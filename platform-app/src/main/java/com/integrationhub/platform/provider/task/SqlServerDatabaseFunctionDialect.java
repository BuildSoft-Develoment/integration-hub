package com.integrationhub.platform.provider.task;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class SqlServerDatabaseFunctionDialect implements DatabaseFunctionDialect {

    @Override
    public boolean supports(String databaseProductName) {
        return databaseProductName != null && databaseProductName.toLowerCase().contains("sql server");
    }

    @Override
    public String selectStatement(String functionName,
                                  List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                  String resultAlias) {
        var qualifiedName = DbTaskSupport.sanitizeQualifiedIdentifier(functionName);
        var placeholders = parameters.stream()
                .map(parameter -> "?")
                .collect(Collectors.joining(", "));
        return "select * from " + qualifiedName + "(" + placeholders + ")";
    }
}