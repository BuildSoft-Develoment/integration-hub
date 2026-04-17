package com.integrationhub.platform.provider.task;

import com.integrationhub.platform.domain.ConnectionType;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

interface StoredProcedureDialect {

    ConnectionType connectionType();

    String callStatement(String procedureName, List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters);

    Map<String, Object> execute(Connection connection,
                                String procedureName,
                                int timeoutSeconds,
                                List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) throws SQLException;

    default String buildErrorMessage(DataSource targetDataSource,
                                     String procedureName,
                                     List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                     SQLException error,
                                     String baseMessage) {
        return baseMessage;
    }
}
