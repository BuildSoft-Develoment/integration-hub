package com.integrationhub.platform.provider.task;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.List;

interface StoredProcedureDialect {

    boolean supports(String databaseProductName);

    String callStatement(String procedureName, List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters);

    default String buildErrorMessage(DataSource targetDataSource,
                                     String procedureName,
                                     List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                     SQLException error,
                                     String baseMessage) {
        return baseMessage;
    }
}