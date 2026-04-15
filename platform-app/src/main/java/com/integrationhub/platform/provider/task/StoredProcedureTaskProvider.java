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
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class StoredProcedureTaskProvider implements TaskProvider {

    private final DataSource dataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final Instance<StoredProcedureDialect> dialects;

    @Inject
    public StoredProcedureTaskProvider(DataSource dataSource,
                                       ConnectionPoolManager connectionPoolManager,
                                       Instance<StoredProcedureDialect> dialects) {
        this.dataSource = dataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.dialects = dialects;
    }

    @Override
    public String type() {
        return "DB_EXECUTE_SP";
    }

    @Override
    @SuppressWarnings("unchecked")
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var procedureName = StoredProcedureConfigurationSupport.procedureName(configuration);
        var timeoutSeconds = StoredProcedureConfigurationSupport.timeoutSeconds(configuration);
        var parameters = StoredProcedureConfigurationSupport.parameters(configuration);
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

        var outputs = executeProcedure(resolveDataSource(configuration), procedureName, timeoutSeconds, resolvedParameters);
        return TaskResult.success("Stored procedure " + procedureName + " executed with " + resolvedParameters.size() + " parameter(s)", outputs);
    }

    private DataSource resolveDataSource(Map<String, Object> configuration) {
        return DbTaskSupport.connectionRef(configuration)
                .map(connectionPoolManager::resolveJdbcDataSource)
                .orElse(dataSource);
    }

    private Map<String, Object> executeProcedure(DataSource targetDataSource,
                                                 String procedureName,
                                                 int timeoutSeconds,
                                                 List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        try (var connection = targetDataSource.getConnection()) {
            var dialect = resolveDialect(connection);
            var sql = dialect.callStatement(procedureName, parameters);
            try (CallableStatement statement = connection.prepareCall(sql)) {
                statement.setQueryTimeout(timeoutSeconds);
                for (int index = 0; index < parameters.size(); index++) {
                    var parameter = parameters.get(index);
                    if (parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.OUT
                            || parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.INOUT) {
                        statement.registerOutParameter(index + 1, parameter.sqlType());
                    }
                    if (parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.IN
                            || parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.INOUT) {
                        if (parameter.value() == null) {
                            statement.setNull(index + 1, parameter.sqlType());
                        } else {
                            statement.setObject(index + 1, parameter.value(), parameter.sqlType());
                        }
                    }
                }
                statement.execute();
                return collectOutputs(statement, parameters);
            }
        } catch (SQLException e) {
            throw new IllegalStateException(buildErrorMessage(targetDataSource, procedureName, parameters, e), e);
        }
    }

    private Map<String, Object> collectOutputs(CallableStatement statement,
                                               List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) throws SQLException {
        var outputs = new LinkedHashMap<String, Object>();
        for (int index = 0; index < parameters.size(); index++) {
            var parameter = parameters.get(index);
            if (parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.OUT
                    || parameter.direction() == StoredProcedureRuntimeSupport.ParameterDirection.INOUT) {
                outputs.put(normalizeOutputName(parameter.name()), statement.getObject(index + 1));
            }
        }
        return outputs;
    }

    private String normalizeOutputName(String parameterName) {
        if (parameterName == null) {
            return null;
        }
        return parameterName.replaceFirst("^@+", "");
    }

    private String buildErrorMessage(DataSource targetDataSource,
                                     String procedureName,
                                     List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                     SQLException error) {
        var baseMessage = "Cannot execute stored procedure " + procedureName + " with parameters " + describeParameters(parameters);
        try (Connection connection = targetDataSource.getConnection()) {
            return resolveDialect(connection).buildErrorMessage(targetDataSource, procedureName, parameters, error, baseMessage);
        } catch (SQLException ignored) {
            return baseMessage;
        }
    }

    private StoredProcedureDialect resolveDialect(Connection connection) throws SQLException {
        var productName = connection.getMetaData().getDatabaseProductName();
        return dialects.stream()
                .filter(dialect -> dialect.supports(productName))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Unsupported database product for stored procedure execution: " + productName));
    }

    private String describeParameters(List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        return parameters.stream()
                .map(parameter -> parameter.name() + "=" + parameter.jdbcType() + "(" + parameter.direction().name() + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("<none>");
    }
}