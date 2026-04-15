package com.integrationhub.platform.provider.task;

import com.integrationhub.platform.service.ConnectionPoolManager;
import com.integrationhub.platform.spi.ReadResult;
import com.integrationhub.platform.spi.SourcePayload;
import com.integrationhub.platform.spi.TaskContext;
import com.integrationhub.platform.spi.TaskProvider;
import com.integrationhub.platform.spi.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.LinkedHashMap;
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
                context.processExecution().id,
                context.taskDefinition().id,
                readResult == null ? 0 : readResult.recordCount(),
                readResult == null ? 0 : readResult.skippedCount(),
                sourcePayload == null ? null : sourcePayload.name(),
                sourcePayload == null ? null : sourcePayload.location(),
                sourcePayload == null ? null : sourcePayload.mediaType(),
                sourcePayload == null || sourcePayload.file() == null ? null : sourcePayload.file().size(),
                sourcePayload == null || sourcePayload.file() == null ? null : sourcePayload.file().lastModified()
        );
        TaskOutputSupport.mergeTaskOutputs(runtimeVariables, context);
        var resolvedParameters = parameters.stream()
                .map(parameter -> StoredProcedureRuntimeSupport.resolveParameter(parameter, runtimeVariables))
                .toList();

        var outputs = executeFunction(resolveDataSource(configuration), functionName, timeoutSeconds, resolvedParameters, resultAlias);
        return TaskResult.success("Database function " + functionName + " executed with " + resolvedParameters.size() + " parameter(s)", outputs);
    }

    private DataSource resolveDataSource(Map<String, Object> configuration) {
        return DbTaskSupport.connectionRef(configuration)
                .map(connectionPoolManager::resolveJdbcDataSource)
                .orElse(dataSource);
    }

    private Map<String, Object> executeFunction(DataSource targetDataSource,
                                                String functionName,
                                                int timeoutSeconds,
                                                List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                                String resultAlias) {
        try (var connection = targetDataSource.getConnection()) {
            var dialect = resolveDialect(connection);
            var sql = dialect.selectStatement(functionName, parameters, resultAlias);
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setQueryTimeout(timeoutSeconds);
                for (int index = 0; index < parameters.size(); index++) {
                    var parameter = parameters.get(index);
                    if (parameter.value() == null) {
                        statement.setNull(index + 1, parameter.sqlType());
                    } else {
                        statement.setObject(index + 1, parameter.value(), parameter.sqlType());
                    }
                }
                try (ResultSet resultSet = statement.executeQuery()) {
                    return collectOutputs(resultSet);
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException(buildErrorMessage(targetDataSource, functionName, parameters, error), error);
        }
    }

    private Map<String, Object> collectOutputs(ResultSet resultSet) throws SQLException {
        if (!resultSet.next()) {
            return Map.of();
        }
        var outputs = new LinkedHashMap<String, Object>();
        ResultSetMetaData metadata = resultSet.getMetaData();
        for (int index = 1; index <= metadata.getColumnCount(); index++) {
            outputs.put(normalizeOutputName(metadata.getColumnLabel(index)), resultSet.getObject(index));
        }
        return outputs;
    }

    private String normalizeOutputName(String columnLabel) {
        if (columnLabel == null) {
            return null;
        }
        return columnLabel.replaceFirst("^@+", "");
    }

    private String buildErrorMessage(DataSource targetDataSource,
                                     String functionName,
                                     List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                     SQLException error) {
        var baseMessage = "Cannot execute database function " + functionName + " with parameters " + describeParameters(parameters);
        try (Connection connection = targetDataSource.getConnection()) {
            return resolveDialect(connection).buildErrorMessage(functionName, parameters, error, baseMessage, connection);
        } catch (SQLException ignored) {
            return baseMessage;
        }
    }

    private DatabaseFunctionDialect resolveDialect(Connection connection) throws SQLException {
        var productName = connection.getMetaData().getDatabaseProductName();
        return dialects.stream()
                .filter(dialect -> dialect.supports(productName))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Unsupported database product for database function execution: " + productName));
    }

    private String describeParameters(List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        return parameters.stream()
                .map(parameter -> parameter.name() + "=" + parameter.jdbcType() + "(" + parameter.direction().name() + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("<none>");
    }
}