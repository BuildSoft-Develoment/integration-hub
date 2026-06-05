package com.integrationhub.platform.provider.task.dbfunction;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.provider.task.common.TaskOutputSupport;
import com.integrationhub.platform.provider.task.dbwrite.DbTaskSupport;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DatabaseFunctionTaskProvider implements TaskProvider {

    private final DataSource dataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Instance<DatabaseFunctionDialect> dialects;

    @Inject
    public DatabaseFunctionTaskProvider(DataSource dataSource,
                                        ConnectionPoolManager connectionPoolManager,
                                        Instance<DatabaseFunctionDialect> dialects) {
        this.dataSource = dataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.dialects = dialects;
    }

    @Override
    public String type() {
        return "DB_EXECUTE_FN";
    }

    @Override
    @SuppressWarnings("unchecked")
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var functionName = DatabaseFunctionConfigurationSupport.functionName(configuration);
        var timeoutSeconds = DatabaseFunctionConfigurationSupport.timeoutSeconds(configuration);
        var resultAlias = DatabaseFunctionConfigurationSupport.resultAlias(configuration);
        var parameters = DatabaseFunctionConfigurationSupport.parameters(configuration);
        var executionVariables = (Map<String, Object>) context.attributes().get("executionVariables");
        var readResult = (ReadResult) context.attributes().get("readResult");
        var sourcePayload = (SourcePayload) context.attributes().get("sourcePayload");

        var runtimeVariables = StoredProcedureRuntimeSupport.buildRuntimeVariables(
                executionVariables,
                context.processExecutionId(),
                context.taskDefinitionId(),
                readResult == null ? 0 : readResult.recordCount(),
                readResult == null ? 0 : readResult.skippedCount(),
                sourcePayload == null ? null : sourcePayload.name(),
                sourcePayload == null ? null : sourcePayload.location(),
                sourcePayload == null ? null : sourcePayload.mediaType(),
                sourcePayload == null || sourcePayload.file() == null ? null : sourcePayload.file().size(),
                sourcePayload == null || sourcePayload.file() == null ? null : sourcePayload.file().lastModified()
        );
        TaskOutputSupport.mergeTaskOutputs(runtimeVariables, context);
        TaskOutputSupport.mergeMetadata(runtimeVariables, context);
        TaskOutputSupport.mergeCurrentRecord(runtimeVariables, context);
        var resolvedParameters = parameters.stream()
                .map(parameter -> StoredProcedureRuntimeSupport.resolveParameter(parameter, runtimeVariables))
                .toList();

        var outputs = executeFunction(resolveTarget(configuration), functionName, timeoutSeconds, resolvedParameters, resultAlias);
        return TaskResult.success("Database function " + functionName + " executed with " + resolvedParameters.size() + " parameter(s)", outputs);
    }

    private DatabaseFunctionExecutionTarget resolveTarget(Map<String, Object> configuration) {
        return DbTaskSupport.connectionRef(configuration)
                .map(connectionPoolManager::resolveJdbcTarget)
                .map(target -> new DatabaseFunctionExecutionTarget(target.dataSource(), target.connectionType()))
                .orElseGet(() -> new DatabaseFunctionExecutionTarget(dataSource, null));
    }

    private Map<String, Object> executeFunction(DatabaseFunctionExecutionTarget target,
                                                String functionName,
                                                int timeoutSeconds,
                                                List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                                String resultAlias) {
        try (var connection = target.dataSource().getConnection()) {
            var dialect = resolveDialect(target.connectionType(), connection);
            return dialect.execute(connection, functionName, timeoutSeconds, parameters, resultAlias);
        } catch (SQLException error) {
            throw new IllegalStateException(buildErrorMessage(target, functionName, parameters, error), error);
        }
    }

    private String buildErrorMessage(DatabaseFunctionExecutionTarget target,
                                     String functionName,
                                     List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                     SQLException error) {
        var baseMessage = "Cannot execute database function " + functionName + " with parameters " + describeParameters(parameters);
        try (Connection connection = target.dataSource().getConnection()) {
            return resolveDialect(target.connectionType(), connection).buildErrorMessage(functionName, parameters, error, baseMessage, connection);
        } catch (SQLException ignored) {
            return baseMessage;
        }
    }

    private DatabaseFunctionDialect resolveDialect(ConnectionType connectionType, Connection connection) throws SQLException {
        if (connectionType != null) {
            return dialects.stream()
                    .filter(dialect -> dialect.connectionType() == connectionType)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Unsupported connection type for database function execution: " + connectionType));
        }
        var inferredConnectionType = inferConnectionType(connection);
        return dialects.stream()
                .filter(dialect -> dialect.connectionType() == inferredConnectionType)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Unsupported connection type for database function execution: " + inferredConnectionType));
    }

    private ConnectionType inferConnectionType(Connection connection) throws SQLException {
        var productName = connection.getMetaData().getDatabaseProductName();
        if (productName == null) {
            throw new IllegalStateException("Unsupported database product for database function execution: null");
        }
        var normalizedProductName = productName.trim().toUpperCase();
        if (normalizedProductName.contains("POSTGRES")) {
            return ConnectionType.POSTGRESQL;
        }
        if (normalizedProductName.contains("MYSQL")) {
            return ConnectionType.MYSQL;
        }
        if (normalizedProductName.contains("ORACLE")) {
            return ConnectionType.ORACLE;
        }
        if (normalizedProductName.contains("SQL SERVER") || normalizedProductName.contains("MICROSOFT SQL SERVER")) {
            return ConnectionType.SQLSERVER;
        }
        throw new IllegalStateException("Unsupported database product for database function execution: " + productName);
    }

    private String describeParameters(List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        return parameters.stream()
                .map(parameter -> parameter.name() + "=" + parameter.jdbcType() + "(" + parameter.direction().name() + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("<none>");
    }

    private record DatabaseFunctionExecutionTarget(DataSource dataSource, ConnectionType connectionType) {
    }
}
