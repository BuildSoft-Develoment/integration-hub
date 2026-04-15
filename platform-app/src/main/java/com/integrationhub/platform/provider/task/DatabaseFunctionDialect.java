package com.integrationhub.platform.provider.task;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

interface DatabaseFunctionDialect {

    boolean supports(String databaseProductName);

    String selectStatement(String functionName,
                           List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                           String resultAlias);

    default String buildErrorMessage(String functionName,
                                     List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                     SQLException error,
                                     String baseMessage,
                                     Connection connection) {
        return baseMessage;
    }
}