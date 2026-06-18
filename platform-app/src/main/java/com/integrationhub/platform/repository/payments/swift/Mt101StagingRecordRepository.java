package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** Repository JDBC para leer staging de entrada de MT101 masivo. */
@ApplicationScoped
public class Mt101StagingRecordRepository {

    public <T> T withConnection(DataSource dataSource, SqlFunction<Connection, T> function) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            return function.apply(connection);
        }
    }

    public long countRows(DataSource dataSource, SourceQuery source) throws SQLException {
        return withConnection(dataSource, connection -> countRows(connection, source));
    }

    public long countRows(Connection connection, SourceQuery source) throws SQLException {
        var sql = "select count(*) from " + source.table() + whereClause(source);
        try (var statement = connection.prepareStatement(sql)) {
            bindWhere(statement, source);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0L;
            }
        }
    }

    public List<RowJson> readRowsAfter(Connection connection,
                                       SourceQuery source,
                                       long afterId,
                                       int limit) throws SQLException {
        var where = whereClause(source);
        var sql = "select " + projection(source) + " from " + source.table()
                + (where.isEmpty() ? " where " : where + " and ")
                + source.idColumn() + " > ?"
                + " order by " + source.idColumn()
                + " limit ?";
        try (var statement = connection.prepareStatement(sql)) {
            var parameter = bindWhere(statement, source);
            statement.setLong(parameter++, afterId);
            statement.setInt(parameter, limit);
            return readRows(statement, source);
        }
    }

    public List<RowJson> readRowsBetween(Connection connection,
                                         SourceQuery source,
                                         long firstId,
                                         long lastId) throws SQLException {
        var where = whereClause(source);
        var sql = "select " + projection(source) + " from " + source.table()
                + (where.isEmpty() ? " where " : where + " and ")
                + source.idColumn() + " >= ? and " + source.idColumn() + " <= ?"
                + " order by " + source.idColumn();
        try (var statement = connection.prepareStatement(sql)) {
            var parameter = bindWhere(statement, source);
            statement.setLong(parameter++, firstId);
            statement.setLong(parameter, lastId);
            return readRows(statement, source);
        }
    }

    /**
     * Proyeccion id + payload, mas record_index y source_file_hash cuando la fuente
     * los declara (ruta staging_record). Para tablas origen arbitrarias esas columnas
     * no existen y la proyeccion se queda en id + payload.
     */
    private String projection(SourceQuery source) {
        var columns = new StringBuilder(source.idColumn()).append(", ").append(source.payloadColumn());
        if (source.recordIndexColumn() != null) {
            columns.append(", ").append(source.recordIndexColumn());
        }
        if (source.sourceFileHashColumn() != null) {
            columns.append(", ").append(source.sourceFileHashColumn());
        }
        return columns.toString();
    }

    private List<RowJson> readRows(PreparedStatement statement, SourceQuery source) throws SQLException {
        var rows = new ArrayList<RowJson>();
        try (var rs = statement.executeQuery()) {
            while (rs.next()) {
                var column = 3;
                Long recordIndex = null;
                if (source.recordIndexColumn() != null) {
                    var value = rs.getLong(column++);
                    recordIndex = rs.wasNull() ? null : value;
                }
                String sourceFileHash = source.sourceFileHashColumn() != null ? rs.getString(column) : null;
                rows.add(new RowJson(rs.getLong(1), rs.getString(2), recordIndex, sourceFileHash));
            }
        }
        return rows;
    }

    private String whereClause(SourceQuery source) {
        var clauses = new ArrayList<String>();
        if (source.processExecutionId() != null) {
            clauses.add("process_execution_id = ?");
        }
        if (source.taskDefinitionId() != null) {
            clauses.add("task_definition_id = ?");
        }
        if (hasRecordIndexFilter(source)) {
            // Rebuild selectivo: construir SOLO las filas corregidas (cuarentena).
            clauses.add(source.recordIndexColumn() + " in ("
                    + String.join(", ", java.util.Collections.nCopies(source.recordIndexIn().size(), "?")) + ")");
        }
        if (clauses.isEmpty()) {
            return "";
        }
        return " where " + String.join(" and ", clauses);
    }

    private boolean hasRecordIndexFilter(SourceQuery source) {
        return source.recordIndexColumn() != null
                && source.recordIndexIn() != null && !source.recordIndexIn().isEmpty();
    }

    private int bindWhere(PreparedStatement statement, SourceQuery source) throws SQLException {
        var parameter = 1;
        if (source.processExecutionId() != null) {
            statement.setLong(parameter++, source.processExecutionId());
        }
        if (source.taskDefinitionId() != null) {
            statement.setLong(parameter++, source.taskDefinitionId());
        }
        if (hasRecordIndexFilter(source)) {
            for (var recordIndex : source.recordIndexIn()) {
                statement.setLong(parameter++, recordIndex);
            }
        }
        return parameter;
    }

    @FunctionalInterface
    public interface SqlFunction<T, R> {
        R apply(T value) throws SQLException;
    }

    public record SourceQuery(
            String table,
            String payloadColumn,
            String idColumn,
            Long processExecutionId,
            Long taskDefinitionId,
            String recordIndexColumn,
            String sourceFileHashColumn,
            java.util.List<Long> recordIndexIn
    ) {
        /** Variante con columnas de trazabilidad pero sin filtro de filas. */
        public SourceQuery(String table, String payloadColumn, String idColumn,
                           Long processExecutionId, Long taskDefinitionId,
                           String recordIndexColumn, String sourceFileHashColumn) {
            this(table, payloadColumn, idColumn, processExecutionId, taskDefinitionId,
                    recordIndexColumn, sourceFileHashColumn, java.util.List.of());
        }

        /** Variante sin columnas de trazabilidad de fila (tablas origen arbitrarias). */
        public SourceQuery(String table, String payloadColumn, String idColumn,
                           Long processExecutionId, Long taskDefinitionId) {
            this(table, payloadColumn, idColumn, processExecutionId, taskDefinitionId, null, null, java.util.List.of());
        }
    }

    public record RowJson(long id, String payloadJson, Long recordIndex, String sourceFileHash) {
    }

    /** Nombre del archivo origen + total de filas de una ejecucion (cabecera del lote). */
    public SourceInfo sourceInfo(DataSource dataSource, long processExecutionId) throws SQLException {
        var sql = "select max(source_name) as name, count(*) as total from staging_record where process_execution_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, processExecutionId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return new SourceInfo(null, 0);
                }
                return new SourceInfo(rs.getString("name"), rs.getLong("total"));
            }
        }
    }

    public record SourceInfo(String sourceName, long rowCount) {
    }

    /**
     * Fila de staging exacta por (ejecucion, record_index). Resuelve el staging_id
     * real (no por formula stagingIdFrom+offset, que asume ids contiguos) y su
     * created_at (timestamp del hito INGESTED). Null si la fila ya no esta.
     */
    public StagingRowInfo findStagingRow(DataSource dataSource, long processExecutionId, long recordIndex) throws SQLException {
        var sql = "select id, created_at from staging_record where process_execution_id = ? and record_index = ? limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, processExecutionId);
            statement.setLong(2, recordIndex);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                var ts = rs.getTimestamp("created_at");
                return new StagingRowInfo(rs.getLong("id"), ts == null ? null : ts.toLocalDateTime());
            }
        }
    }

    public record StagingRowInfo(long id, java.time.LocalDateTime createdAt) {
    }
}
