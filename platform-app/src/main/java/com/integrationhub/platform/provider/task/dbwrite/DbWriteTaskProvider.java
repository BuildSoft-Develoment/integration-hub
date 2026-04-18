package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.provider.task.common.TaskOutputSupport;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DbWriteTaskProvider implements BatchTaskProvider {

    private static final String STAGING_TABLE = "staging_record";

    private final DataSource dataSource;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final ConnectionPoolManager connectionPoolManager;

    public DbWriteTaskProvider(DataSource dataSource,
                               JsonConfigurationMapper jsonConfigurationMapper,
                               ConnectionPoolManager connectionPoolManager) {
        this.dataSource = dataSource;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.connectionPoolManager = connectionPoolManager;
    }

    @Override
    public String type() {
        return "DB_WRITE";
    }

    @Override
    public TaskResult executeRecords(TaskContext context,
                                     Map<String, Object> configuration,
                                     List<ReadRecord> records,
                                     SourcePayload sourcePayload) {
        if (records == null || records.isEmpty()) {
            return TaskResult.success("DB write skipped because there are no parsed records");
        }

        var targetTable = DbTaskSupport.requireQualifiedIdentifier(configuration, "targetTable");
        var mode = DbTaskSupport.mode(configuration);
        var effectiveRecords = enrichRecordsWithRuntime(context, records, sourcePayload);

        if (STAGING_TABLE.equalsIgnoreCase(targetTable)) {
            if (!isInsertLike(mode)) {
                throw new IllegalArgumentException("staging_record only supports insert-like DB_WRITE modes");
            }
            var inserted = insertIntoStaging(resolveDataSource(configuration), context, sourcePayload, effectiveRecords, DbTaskSupport.jdbcBatchSize(configuration));
            return TaskResult.success(
                    "Inserted " + inserted + " records into staging_record using mode " + mode,
                    successOutputs(mode, STAGING_TABLE, effectiveRecords.size(), inserted)
            );
        }

        var targetDataSource = resolveDataSource(configuration);
        var assignments = DbTaskSupport.assignments(configuration, effectiveRecords);
        if (assignments.isEmpty()) {
            throw new IllegalArgumentException("DB_WRITE requires columnMappings, columnFunctions or readable record fields");
        }

        var keyColumns = DbTaskSupport.keyColumns(configuration);
        var affected = switch (mode) {
            case "insert", "jdbc-batch" -> insertDynamic(targetDataSource, targetTable, effectiveRecords, assignments, DbTaskSupport.jdbcBatchSize(configuration));
            case "update", "batch-update" -> updateDynamic(targetDataSource, targetTable, effectiveRecords, assignments, keyColumns, DbTaskSupport.jdbcBatchSize(configuration));
            case "upsert" -> upsertDynamic(targetDataSource, targetTable, effectiveRecords, assignments, keyColumns, DbTaskSupport.jdbcBatchSize(configuration));
            default -> throw new IllegalArgumentException("Unsupported DB_WRITE mode: " + mode);
        };
        return TaskResult.success(
                "DB write completed on " + targetTable + " affecting " + affected + " records using mode " + mode,
                successOutputs(mode, targetTable, effectiveRecords.size(), affected)
        );
    }


    @SuppressWarnings("unchecked")
    private List<ReadRecord> enrichRecordsWithRuntime(TaskContext context,
                                                      List<ReadRecord> records,
                                                      SourcePayload sourcePayload) {
        if (records == null || records.isEmpty()) {
            return List.of();
        }
        var executionVariables = context != null && context.attributes().get("executionVariables") instanceof Map<?, ?> rawExecutionVariables
                ? (Map<String, Object>) rawExecutionVariables
                : Map.<String, Object>of();
        var readResult = context != null && context.attributes().get("readResult") instanceof ReadResult read
                ? read
                : null;
        var sourceFile = sourcePayload != null ? sourcePayload.file() : null;
        var runtimeValues = StoredProcedureRuntimeSupport.buildRuntimeVariables(
                executionVariables,
                context != null ? context.processExecutionId() : null,
                context != null ? context.taskDefinitionId() : null,
                readResult != null ? readResult.recordCount() : records.size(),
                readResult != null ? readResult.skippedCount() : 0,
                sourcePayload != null ? sourcePayload.name() : null,
                sourcePayload != null ? sourcePayload.location() : null,
                sourcePayload != null ? sourcePayload.mediaType() : null,
                sourceFile != null ? sourceFile.size() : null,
                sourceFile != null ? sourceFile.lastModified() : null
        );
        var taskOutputs = TaskOutputSupport.copyTaskOutputs(context);
        return records.stream().map(record -> {
            var values = new java.util.LinkedHashMap<String, Object>();
            if (record != null && record.values() != null) {
                values.putAll(record.values());
            }
            runtimeValues.forEach(values::putIfAbsent);
            taskOutputs.forEach(values::putIfAbsent);
            return new ReadRecord(values);
        }).toList();
    }
    private DataSource resolveDataSource(Map<String, Object> configuration) {
        return DbTaskSupport.connectionRef(configuration)
                .map(connectionPoolManager::resolveJdbcDataSource)
                .orElse(dataSource);
    }

    private boolean isInsertLike(String mode) {
        return "insert".equals(mode) || "jdbc-batch".equals(mode);
    }

    private Map<String, Object> successOutputs(String mode, String targetTable, int processedCount, int writtenCount) {
        return Map.of(
                "mode", mode,
                "targetTable", targetTable,
                "processedCount", processedCount,
                "writtenCount", writtenCount
        );
    }

    private int insertIntoStaging(DataSource targetDataSource,
                                  TaskContext context,
                                  SourcePayload sourcePayload,
                                  List<ReadRecord> records,
                                  int batchSize) {
        var sql = "insert into staging_record (process_execution_id, task_definition_id, source_name, record_index, payload_json) values (?, ?, ?, ?, ?)";
        try (Connection connection = targetDataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            var index = 0;
            for (var record : records) {
                statement.setLong(1, context.processExecutionId());
                statement.setLong(2, context.taskDefinitionId());
                statement.setString(3, sourcePayload != null ? sourcePayload.name() : null);
                statement.setInt(4, index);
                statement.setString(5, jsonConfigurationMapper.toJson(record.values()));
                statement.addBatch();
                index++;
                if (index % batchSize == 0) {
                    statement.executeBatch();
                }
            }
            statement.executeBatch();
            return index;
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot batch insert staging records", e);
        }
    }

    private int insertDynamic(DataSource targetDataSource, String targetTable, List<ReadRecord> records,
                              List<DbTaskSupport.ColumnAssignment> assignments, int batchSize) {
        var columns = DbTaskSupport.insertColumns(assignments);
        var valuesClause = String.join(", ", assignments.stream().map(this::insertExpression).toList());
        var sql = "insert into " + targetTable + " (" + String.join(", ", columns) + ") values (" + valuesClause + ")";
        try (Connection connection = targetDataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            var count = 0;
            for (var record : records) {
                bindInsertValues(statement, record, assignments);
                statement.addBatch();
                count++;
                if (count % batchSize == 0) {
                    statement.executeBatch();
                }
            }
            statement.executeBatch();
            return count;
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot insert records into " + targetTable, e);
        }
    }

    private int updateDynamic(DataSource targetDataSource, String targetTable, List<ReadRecord> records,
                              List<DbTaskSupport.ColumnAssignment> assignments, List<String> keyColumns, int batchSize) {
        if (keyColumns.isEmpty()) {
            throw new IllegalArgumentException("DB_WRITE update mode requires keyColumns");
        }
        var updateAssignments = DbTaskSupport.updateAssignments(assignments, keyColumns);
        if (updateAssignments.isEmpty()) {
            throw new IllegalArgumentException("DB_WRITE update mode requires non-key columns to update");
        }
        var assignmentsByColumn = DbTaskSupport.assignmentIndex(assignments);
        validateKeyColumns(assignmentsByColumn, keyColumns);
        var setClause = String.join(", ", updateAssignments.stream().map(assignment -> assignment.column() + " = " + insertExpression(assignment)).toList());
        var whereClause = String.join(" and ", keyColumns.stream().map(column -> column + " = ?").toList());
        var sql = "update " + targetTable + " set " + setClause + " where " + whereClause;
        try (Connection connection = targetDataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            var count = 0;
            for (var record : records) {
                bindUpdateValues(statement, record, updateAssignments, keyColumns, assignmentsByColumn);
                statement.addBatch();
                count++;
                if (count % batchSize == 0) {
                    statement.executeBatch();
                }
            }
            statement.executeBatch();
            return count;
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot update records in " + targetTable, e);
        }
    }

    private int upsertDynamic(DataSource targetDataSource, String targetTable, List<ReadRecord> records,
                              List<DbTaskSupport.ColumnAssignment> assignments, List<String> keyColumns, int batchSize) {
        if (keyColumns.isEmpty()) {
            throw new IllegalArgumentException("DB_WRITE upsert mode requires keyColumns");
        }
        var assignmentsByColumn = DbTaskSupport.assignmentIndex(assignments);
        validateKeyColumns(assignmentsByColumn, keyColumns);
        var insertColumns = DbTaskSupport.insertColumns(assignments);
        var updateAssignments = DbTaskSupport.updateAssignments(assignments, keyColumns);
        var valuesClause = String.join(", ", assignments.stream().map(this::insertExpression).toList());
        var conflictClause = String.join(", ", keyColumns);
        var updateClause = updateAssignments.isEmpty()
                ? " do nothing"
                : " do update set " + String.join(", ", updateAssignments.stream().map(assignment -> assignment.column() + " = excluded." + assignment.column()).toList());
        var sql = "insert into " + targetTable + " (" + String.join(", ", insertColumns) + ") values (" + valuesClause + ") on conflict (" + conflictClause + ")" + updateClause;
        try (Connection connection = targetDataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            var count = 0;
            for (var record : records) {
                bindInsertValues(statement, record, assignments);
                statement.addBatch();
                count++;
                if (count % batchSize == 0) {
                    statement.executeBatch();
                }
            }
            statement.executeBatch();
            return count;
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot upsert records in " + targetTable, e);
        }
    }

    private String insertExpression(DbTaskSupport.ColumnAssignment assignment) {
        return assignment.isDbFunction() ? assignment.dbFunction() : "?";
    }

    private void bindInsertValues(PreparedStatement statement, ReadRecord record, List<DbTaskSupport.ColumnAssignment> assignments) throws SQLException {
        var parameterIndex = 1;
        for (var assignment : assignments) {
            if (assignment.isDbFunction()) {
                continue;
            }
            statement.setObject(parameterIndex++, DbTaskSupport.value(record, assignment.sourceField()));
        }
    }

    private void bindUpdateValues(PreparedStatement statement, ReadRecord record,
                                  List<DbTaskSupport.ColumnAssignment> updateAssignments,
                                  List<String> keyColumns,
                                  Map<String, DbTaskSupport.ColumnAssignment> assignmentsByColumn) throws SQLException {
        var parameterIndex = 1;
        for (var assignment : updateAssignments) {
            if (assignment.isDbFunction()) {
                continue;
            }
            statement.setObject(parameterIndex++, DbTaskSupport.value(record, assignment.sourceField()));
        }
        for (var keyColumn : keyColumns) {
            var keyAssignment = assignmentsByColumn.get(keyColumn);
            if (keyAssignment == null || keyAssignment.isDbFunction() || keyAssignment.sourceField() == null) {
                throw new IllegalArgumentException("Missing source mapping for key column: " + keyColumn);
            }
            statement.setObject(parameterIndex++, DbTaskSupport.value(record, keyAssignment.sourceField()));
        }
    }

    private void validateKeyColumns(Map<String, DbTaskSupport.ColumnAssignment> assignmentsByColumn, List<String> keyColumns) {
        for (var keyColumn : keyColumns) {
            var assignment = assignmentsByColumn.get(keyColumn);
            if (assignment == null || assignment.isDbFunction() || assignment.sourceField() == null) {
                throw new IllegalArgumentException("Key columns must map to reader fields: " + keyColumn);
            }
        }
    }
}
