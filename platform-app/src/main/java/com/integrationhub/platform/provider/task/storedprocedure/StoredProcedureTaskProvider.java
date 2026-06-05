package com.integrationhub.platform.provider.task.storedprocedure;

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

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class StoredProcedureTaskProvider implements TaskProvider {

    private final ConnectionPoolManager connectionPoolManager;
    private final Instance<StoredProcedureDialect> dialects;

    @Inject
    public StoredProcedureTaskProvider(ConnectionPoolManager connectionPoolManager,
                                       Instance<StoredProcedureDialect> dialects) {
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

        var outputs = executeProcedure(resolveTarget(configuration), procedureName, timeoutSeconds, resolvedParameters);
        return TaskResult.success("Stored procedure " + procedureName + " executed with " + resolvedParameters.size() + " parameter(s)", outputs);
    }

    private ConnectionPoolManager.JdbcConnectionTarget resolveTarget(Map<String, Object> configuration) {
        return DbTaskSupport.connectionRef(configuration)
                .map(connectionPoolManager::resolveJdbcTarget)
                .orElseThrow(() -> new IllegalArgumentException("Stored procedure tasks require connectionRef"));
    }

    private Map<String, Object> executeProcedure(ConnectionPoolManager.JdbcConnectionTarget target,
                                                 String procedureName,
                                                 int timeoutSeconds,
                                                 List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        var dialect = resolveDialect(target.connectionType());
        try (var connection = target.dataSource().getConnection()) {
            return dialect.execute(connection, procedureName, timeoutSeconds, parameters);
        } catch (SQLException e) {
            throw new IllegalStateException(buildErrorMessage(target, dialect, procedureName, parameters, e), e);
        }
    }

    private String buildErrorMessage(ConnectionPoolManager.JdbcConnectionTarget target,
                                     StoredProcedureDialect dialect,
                                     String procedureName,
                                     List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                     SQLException error) {
        var baseMessage = "Cannot execute stored procedure " + procedureName + " with parameters " + describeParameters(parameters);
        return dialect.buildErrorMessage(target.dataSource(), procedureName, parameters, error, baseMessage);
    }

    private StoredProcedureDialect resolveDialect(ConnectionType connectionType) {
        return dialects.stream()
                .filter(dialect -> dialect.connectionType() == connectionType)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Unsupported connection type for stored procedure execution: " + connectionType));
    }

    private String describeParameters(List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        return parameters.stream()
                .map(parameter -> parameter.name() + "=" + parameter.jdbcType() + "(" + parameter.direction().name() + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("<none>");
    }
}
