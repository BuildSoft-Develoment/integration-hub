package com.integrationhub.platform.repository;

import com.integrationhub.platform.provider.task.dbwrite.DbWriteUpsertDialect;
import com.integrationhub.platform.spi.task.support.DbTaskSupport;
import com.integrationhub.platform.spi.reader.ReadRecord;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * Acceso a datos del task {@code DB_WRITE}: insert batcheado a {@code staging_record}
 * (esquema fijo) y escritura dinamica (insert/update/upsert) sobre tablas destino
 * configurables en runtime. El provider orquesta (mapeos, indices, auditoria); aqui
 * vive todo el SQL/JDBC.
 */
@ApplicationScoped
public class DbWriteRepository {

    private static final String STAGING_INSERT =
            "insert into staging_record (process_execution_id, task_definition_id, source_name, source_file_hash,"
                    + " record_index, payload_json, physical_line, sheet_name, sheet_row)"
                    + " values (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    /**
     * Fila de staging ya resuelta por el provider (indice logico + payload serializado + posicion FISICA opcional).
     * {@code physicalLine}/{@code sheetName}/{@code sheetRow} son nullables (readers que no aportan posicion los dejan
     * en null): item 2, precision de auditoria "que linea del archivo fallo".
     */
    public record StagingRow(Long processExecutionId,
                             Long taskDefinitionId,
                             String sourceName,
                             String sourceFileHash,
                             long recordIndex,
                             String payloadJson,
                             Long physicalLine,
                             String sheetName,
                             Long sheetRow) {
    }

    public int insertStagingBatch(DataSource dataSource, List<StagingRow> rows, int batchSize) {
        if (rows == null || rows.isEmpty()) {
            return 0;
        }
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(STAGING_INSERT)) {
            var written = 0;
            for (var row : rows) {
                statement.setObject(1, row.processExecutionId());
                statement.setObject(2, row.taskDefinitionId());
                statement.setString(3, row.sourceName());
                statement.setString(4, row.sourceFileHash());
                statement.setLong(5, row.recordIndex());
                statement.setString(6, row.payloadJson());
                statement.setObject(7, row.physicalLine());
                statement.setString(8, row.sheetName());
                statement.setObject(9, row.sheetRow());
                statement.addBatch();
                if (++written % batchSize == 0) {
                    statement.executeBatch();
                }
            }
            statement.executeBatch();
            return written;
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot batch insert staging records", e);
        }
    }

    public int insertDynamic(DataSource dataSource, String targetTable, List<ReadRecord> records,
                             List<DbTaskSupport.ColumnAssignment> assignments, int batchSize) {
        var columns = DbTaskSupport.insertColumns(assignments);
        var valuesClause = String.join(", ", assignments.stream().map(this::insertExpression).toList());
        var sql = "insert into " + targetTable + " (" + String.join(", ", columns) + ") values (" + valuesClause + ")";
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            var count = 0;
            for (var record : records) {
                bindInsertValues(statement, record, assignments);
                statement.addBatch();
                if (++count % batchSize == 0) {
                    statement.executeBatch();
                }
            }
            statement.executeBatch();
            return count;
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot insert records into " + targetTable, e);
        }
    }

    public int updateDynamic(DataSource dataSource, String targetTable, List<ReadRecord> records,
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
        var setClause = String.join(", ", updateAssignments.stream()
                .map(assignment -> assignment.column() + " = " + insertExpression(assignment)).toList());
        var whereClause = String.join(" and ", keyColumns.stream().map(column -> column + " = ?").toList());
        var sql = "update " + targetTable + " set " + setClause + " where " + whereClause;
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            var count = 0;
            for (var record : records) {
                bindUpdateValues(statement, record, updateAssignments, keyColumns, assignmentsByColumn);
                statement.addBatch();
                if (++count % batchSize == 0) {
                    statement.executeBatch();
                }
            }
            statement.executeBatch();
            return count;
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot update records in " + targetTable, e);
        }
    }

    public int upsertDynamic(DataSource dataSource, String targetTable, List<ReadRecord> records,
                             List<DbTaskSupport.ColumnAssignment> assignments, List<String> keyColumns, int batchSize,
                             DbWriteUpsertDialect dialect) {
        if (keyColumns.isEmpty()) {
            throw new IllegalArgumentException("DB_WRITE upsert mode requires keyColumns");
        }
        var assignmentsByColumn = DbTaskSupport.assignmentIndex(assignments);
        validateKeyColumns(assignmentsByColumn, keyColumns);
        var insertColumns = DbTaskSupport.insertColumns(assignments);
        var updateColumns = DbTaskSupport.updateAssignments(assignments, keyColumns).stream()
                .map(DbTaskSupport.ColumnAssignment::column).toList();
        var valueExpressions = assignments.stream().map(this::insertExpression).toList();
        var sql = dialect.upsertStatement(targetTable, insertColumns, valueExpressions, keyColumns, updateColumns);
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            var count = 0;
            for (var record : records) {
                bindInsertValues(statement, record, assignments);
                statement.addBatch();
                if (++count % batchSize == 0) {
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

    private void bindInsertValues(PreparedStatement statement, ReadRecord record,
                                  List<DbTaskSupport.ColumnAssignment> assignments) throws SQLException {
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

    private void validateKeyColumns(Map<String, DbTaskSupport.ColumnAssignment> assignmentsByColumn,
                                    List<String> keyColumns) {
        for (var keyColumn : keyColumns) {
            var assignment = assignmentsByColumn.get(keyColumn);
            if (assignment == null || assignment.isDbFunction() || assignment.sourceField() == null) {
                throw new IllegalArgumentException("Key columns must map to reader fields: " + keyColumn);
            }
        }
    }
}
