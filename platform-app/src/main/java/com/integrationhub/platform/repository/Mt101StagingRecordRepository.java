package com.integrationhub.platform.repository;

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
        var sql = "select " + source.idColumn() + ", " + source.payloadColumn() + " from " + source.table()
                + (where.isEmpty() ? " where " : where + " and ")
                + source.idColumn() + " > ?"
                + " order by " + source.idColumn()
                + " limit ?";
        try (var statement = connection.prepareStatement(sql)) {
            var parameter = bindWhere(statement, source);
            statement.setLong(parameter++, afterId);
            statement.setInt(parameter, limit);
            return readRows(statement);
        }
    }

    public List<RowJson> readRowsBetween(Connection connection,
                                         SourceQuery source,
                                         long firstId,
                                         long lastId) throws SQLException {
        var where = whereClause(source);
        var sql = "select " + source.idColumn() + ", " + source.payloadColumn() + " from " + source.table()
                + (where.isEmpty() ? " where " : where + " and ")
                + source.idColumn() + " >= ? and " + source.idColumn() + " <= ?"
                + " order by " + source.idColumn();
        try (var statement = connection.prepareStatement(sql)) {
            var parameter = bindWhere(statement, source);
            statement.setLong(parameter++, firstId);
            statement.setLong(parameter, lastId);
            return readRows(statement);
        }
    }

    private List<RowJson> readRows(PreparedStatement statement) throws SQLException {
        var rows = new ArrayList<RowJson>();
        try (var rs = statement.executeQuery()) {
            while (rs.next()) {
                rows.add(new RowJson(rs.getLong(1), rs.getString(2)));
            }
        }
        return rows;
    }

    private String whereClause(SourceQuery source) {
        if (source.processExecutionId() == null && source.taskDefinitionId() == null) {
            return "";
        }
        var clauses = new ArrayList<String>();
        if (source.processExecutionId() != null) {
            clauses.add("process_execution_id = ?");
        }
        if (source.taskDefinitionId() != null) {
            clauses.add("task_definition_id = ?");
        }
        return " where " + String.join(" and ", clauses);
    }

    private int bindWhere(PreparedStatement statement, SourceQuery source) throws SQLException {
        var parameter = 1;
        if (source.processExecutionId() != null) {
            statement.setLong(parameter++, source.processExecutionId());
        }
        if (source.taskDefinitionId() != null) {
            statement.setLong(parameter++, source.taskDefinitionId());
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
            Long taskDefinitionId
    ) {
    }

    public record RowJson(long id, String payloadJson) {
    }
}
