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
        var sql = "select count(*) from " + source.table() + " src" + whereClause(source);
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
        var sql = "select " + projection(source) + " from " + source.table() + " src"
                + (where.isEmpty() ? " where " : where + " and ")
                + column(source.idColumn()) + " > ?"
                + " order by " + column(source.idColumn())
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
        var sql = "select " + projection(source) + " from " + source.table() + " src"
                + (where.isEmpty() ? " where " : where + " and ")
                + column(source.idColumn()) + " >= ? and " + column(source.idColumn()) + " <= ?"
                + " order by " + column(source.idColumn());
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
        var columns = new StringBuilder(column(source.idColumn())).append(", ").append(column(source.payloadColumn()));
        if (source.recordIndexColumn() != null) {
            columns.append(", ").append(column(source.recordIndexColumn()));
        }
        if (source.sourceFileHashColumn() != null) {
            columns.append(", ").append(column(source.sourceFileHashColumn()));
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
            clauses.add(column("process_execution_id") + " = ?");
        }
        if (source.taskDefinitionId() != null) {
            clauses.add(column("task_definition_id") + " = ?");
        }
        if (hasRebuildRunFilter(source)) {
            var selection = "exists (select 1 from mt101_rebuild_selection sel "
                    + "where sel.rebuild_run_id = ? "
                    + "and sel.record_index = " + column(source.recordIndexColumn());
            if (source.sourceFileHashColumn() != null) {
                selection += " and (sel.source_file_hash is null or sel.source_file_hash = "
                        + column(source.sourceFileHashColumn()) + ")";
            }
            selection += ")";
            clauses.add(selection);
        }
        if (hasRecordIndexFilter(source)) {
            // Rebuild selectivo: construir SOLO las filas corregidas (cuarentena).
            var values = compactRecordIndexValues(source.recordIndexIn());
            var ranges = compactRecordIndexRanges(values);
            if (values.isEmpty()) {
                clauses.add("1 = 0");
            } else if (useRecordIndexRanges(values.size(), ranges)) {
                var rangeClauses = new ArrayList<String>(ranges.size());
                for (int i = 0; i < ranges.size(); i++) {
                    rangeClauses.add(column(source.recordIndexColumn()) + " between ? and ?");
                }
                clauses.add("(" + String.join(" or ", rangeClauses) + ")");
            } else {
                clauses.add(column(source.recordIndexColumn()) + " in ("
                        + String.join(", ", java.util.Collections.nCopies(values.size(), "?")) + ")");
            }
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

    private boolean hasRebuildRunFilter(SourceQuery source) {
        return source.recordIndexColumn() != null
                && source.rebuildRunId() != null && !source.rebuildRunId().isBlank();
    }

    private int bindWhere(PreparedStatement statement, SourceQuery source) throws SQLException {
        var parameter = 1;
        if (source.processExecutionId() != null) {
            statement.setLong(parameter++, source.processExecutionId());
        }
        if (source.taskDefinitionId() != null) {
            statement.setLong(parameter++, source.taskDefinitionId());
        }
        if (hasRebuildRunFilter(source)) {
            statement.setString(parameter++, source.rebuildRunId().trim());
        }
        if (hasRecordIndexFilter(source)) {
            var values = compactRecordIndexValues(source.recordIndexIn());
            var ranges = compactRecordIndexRanges(values);
            if (values.isEmpty()) {
                return parameter;
            }
            if (useRecordIndexRanges(values.size(), ranges)) {
                for (var range : ranges) {
                    statement.setLong(parameter++, range.from());
                    statement.setLong(parameter++, range.to());
                }
            } else {
                for (var recordIndex : values) {
                    statement.setLong(parameter++, recordIndex);
                }
            }
        }
        return parameter;
    }

    private String column(String name) {
        return "src." + name;
    }

    private boolean useRecordIndexRanges(int valueCount, List<RecordIndexRange> ranges) {
        return !ranges.isEmpty() && ranges.size() * 2 < valueCount;
    }

    private List<Long> compactRecordIndexValues(List<Long> recordIndexes) {
        var sorted = new java.util.TreeSet<Long>();
        for (var recordIndex : recordIndexes) {
            if (recordIndex != null) {
                sorted.add(recordIndex);
            }
        }
        return new ArrayList<>(sorted);
    }

    private List<RecordIndexRange> compactRecordIndexRanges(List<Long> recordIndexes) {
        if (recordIndexes.isEmpty()) {
            return List.of();
        }
        var ranges = new ArrayList<RecordIndexRange>();
        Long from = null;
        Long to = null;
        for (var recordIndex : recordIndexes) {
            if (from == null) {
                from = recordIndex;
                to = recordIndex;
            } else if (recordIndex == to + 1) {
                to = recordIndex;
            } else {
                ranges.add(new RecordIndexRange(from, to));
                from = recordIndex;
                to = recordIndex;
            }
        }
        ranges.add(new RecordIndexRange(from, to));
        return ranges;
    }

    private record RecordIndexRange(long from, long to) {
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
            java.util.List<Long> recordIndexIn,
            String rebuildRunId
    ) {
        /** Variante con columnas de trazabilidad pero sin filtro de filas. */
        public SourceQuery(String table, String payloadColumn, String idColumn,
                           Long processExecutionId, Long taskDefinitionId,
                           String recordIndexColumn, String sourceFileHashColumn) {
            this(table, payloadColumn, idColumn, processExecutionId, taskDefinitionId,
                    recordIndexColumn, sourceFileHashColumn, java.util.List.of(), null);
        }

        /** Variante sin columnas de trazabilidad de fila (tablas origen arbitrarias). */
        public SourceQuery(String table, String payloadColumn, String idColumn,
                           Long processExecutionId, Long taskDefinitionId) {
            this(table, payloadColumn, idColumn, processExecutionId, taskDefinitionId, null, null,
                    java.util.List.of(), null);
        }

        public SourceQuery(String table, String payloadColumn, String idColumn,
                           Long processExecutionId, Long taskDefinitionId,
                           String recordIndexColumn, String sourceFileHashColumn,
                           java.util.List<Long> recordIndexIn) {
            this(table, payloadColumn, idColumn, processExecutionId, taskDefinitionId,
                    recordIndexColumn, sourceFileHashColumn, recordIndexIn, null);
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
    public StagingRowInfo findStagingRow(DataSource dataSource,
                                         long processExecutionId,
                                         long recordIndex,
                                         String sourceFileHash) throws SQLException {
        var hash = requireSourceFileHash(sourceFileHash);
        var sql = "select id, created_at from staging_record "
                + "where process_execution_id = ? and record_index = ? and source_file_hash = ? limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, processExecutionId);
            statement.setLong(2, recordIndex);
            statement.setString(3, hash);
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

    public StagingPayload findStagingPayload(DataSource dataSource,
                                             long processExecutionId,
                                             long recordIndex,
                                             String sourceFileHash) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            return findStagingPayload(connection, processExecutionId, recordIndex, sourceFileHash);
        }
    }

    public StagingPayload findStagingPayload(Connection connection,
                                             long processExecutionId,
                                             long recordIndex,
                                             String sourceFileHash) throws SQLException {
        var hash = requireSourceFileHash(sourceFileHash);
        var sql = "select id, payload_json, version from staging_record "
                + "where process_execution_id = ? and record_index = ? and source_file_hash = ? limit 1";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, processExecutionId);
            statement.setLong(2, recordIndex);
            statement.setString(3, hash);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new StagingPayload(rs.getLong("id"), rs.getString("payload_json"), rs.getLong("version"));
            }
        }
    }

    public record StagingPayload(long id, String payloadJson, long version) {
    }

    /**
     * Corrige el payload de una fila de staging con locking optimista: solo aplica si
     * {@code version} coincide e incrementa la version. Devuelve 0 si la fila no existe
     * o la version esta obsoleta (conflicto). Unico camino de update (sin variante
     * sin-lock).
     */
    public int updatePayload(DataSource dataSource,
                             long processExecutionId,
                             long recordIndex,
                             String sourceFileHash,
                             String payloadJson,
                             long expectedVersion) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            return updatePayload(connection, processExecutionId, recordIndex, sourceFileHash, payloadJson, expectedVersion);
        }
    }

    public int updatePayload(Connection connection,
                             long processExecutionId,
                             long recordIndex,
                             String sourceFileHash,
                             String payloadJson,
                             long expectedVersion) throws SQLException {
        var hash = requireSourceFileHash(sourceFileHash);
        var sql = "update staging_record set payload_json = ?, version = version + 1"
                + " where process_execution_id = ? and record_index = ? and source_file_hash = ? and version = ?";
        try (var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, payloadJson);
            statement.setLong(parameter++, processExecutionId);
            statement.setLong(parameter++, recordIndex);
            statement.setString(parameter++, hash);
            statement.setLong(parameter, expectedVersion);
            return statement.executeUpdate();
        }
    }

    private String requireSourceFileHash(String sourceFileHash) {
        if (sourceFileHash == null || sourceFileHash.isBlank()) {
            throw new IllegalArgumentException("sourceFileHash is required for staging row access");
        }
        return sourceFileHash.trim();
    }
}
