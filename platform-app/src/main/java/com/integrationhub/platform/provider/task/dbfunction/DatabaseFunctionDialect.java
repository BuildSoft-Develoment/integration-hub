package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.spi.task.support.StoredProcedureRuntimeSupport;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

interface DatabaseFunctionDialect {

    ConnectionType connectionType();

    String selectStatement(String functionName,
                           List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                           String resultAlias);

    Map<String, Object> execute(Connection connection,
                                String functionName,
                                int timeoutSeconds,
                                List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                String resultAlias) throws SQLException;

    default String buildErrorMessage(String functionName,
                                     List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                     SQLException error,
                                     String baseMessage,
                                     Connection connection) {
        return baseMessage;
    }
}
