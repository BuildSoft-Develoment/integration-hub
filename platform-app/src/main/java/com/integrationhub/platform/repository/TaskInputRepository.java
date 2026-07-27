package com.integrationhub.platform.repository;

import com.integrationhub.platform.spi.task.support.DbTaskSupport;
import com.integrationhub.platform.spi.reader.ReadRecord;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Acceso a datos para inputs de tarea desde una tabla configurable: lectura
 * paginada por keyset con dialecto de limite por motor. El {@code TaskInputResolver}
 * orquesta (cursor, lotes, resolucion de DataSource) y delega aqui el SQL/JDBC.
 */
@ApplicationScoped
public class TaskInputRepository {

    public enum PaginationDialect {
        LIMIT,
        FETCH_FIRST,
        OFFSET_FETCH
    }

    /**
     * ADR-016: conteo de filas de la tabla (con los mismos filtros que {@link #readBatch}). Lo usa {@code FILE_WRITE}
     * para resolver un agregado {@code count} de cabecera por pre-query (la cabecera se escribe antes del detalle).
     */
    public long count(DataSource dataSource, String table, Map<String, Object> filters) {
        var tableName = DbTaskSupport.sanitizeQualifiedIdentifier(table);
        var effectiveFilters = filters == null ? Map.<String, Object>of() : filters;
        try (Connection connection = dataSource.getConnection()) {
            var conditions = new ArrayList<String>();
            for (var column : effectiveFilters.keySet()) {
                conditions.add(DbTaskSupport.sanitizeIdentifier(column) + " = ?");
            }
            var sql = new StringBuilder("select count(*) from ").append(tableName);
            if (!conditions.isEmpty()) {
                sql.append(" where ").append(String.join(" and ", conditions));
            }
            try (var statement = connection.prepareStatement(sql.toString())) {
                var parameterIndex = 1;
                for (var value : effectiveFilters.values()) {
                    statement.setObject(parameterIndex++, value);
                }
                try (var resultSet = statement.executeQuery()) {
                    return resultSet.next() ? resultSet.getLong(1) : 0L;
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot count task input table " + table, error);
        }
    }

    public List<ReadRecord> readBatch(DataSource dataSource, String table, String orderBy,
                                      Map<String, Object> filters, Object lastKey, int batchSize) {
        var tableName = DbTaskSupport.sanitizeQualifiedIdentifier(table);
        var orderByColumn = DbTaskSupport.sanitizeQualifiedIdentifier(orderBy);
        var effectiveFilters = filters == null ? Map.<String, Object>of() : filters;
        try (Connection connection = dataSource.getConnection()) {
            var dialect = paginationDialect(connection);
            var conditions = new ArrayList<String>();
            for (var column : effectiveFilters.keySet()) {
                conditions.add(DbTaskSupport.sanitizeIdentifier(column) + " = ?");
            }
            if (lastKey != null) {
                conditions.add(orderByColumn + " > ?");
            }
            var sql = new StringBuilder("select * from ").append(tableName);
            if (!conditions.isEmpty()) {
                sql.append(" where ").append(String.join(" and ", conditions));
            }
            sql.append(" order by ").append(orderByColumn).append(" asc");
            sql.append(limitClause(dialect));

            try (var statement = connection.prepareStatement(sql.toString())) {
                var parameterIndex = 1;
                for (var value : effectiveFilters.values()) {
                    statement.setObject(parameterIndex++, value);
                }
                if (lastKey != null) {
                    statement.setObject(parameterIndex++, lastKey);
                }
                statement.setInt(parameterIndex, batchSize);
                try (var resultSet = statement.executeQuery()) {
                    return readRecords(resultSet);
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read task input table " + table, error);
        }
    }

    /**
     * Dialecto de paginacion por motor. SQL Server NO admite `FETCH FIRST ... ROWS ONLY`
     * suelto: exige `OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY` (con ORDER BY). Oracle 12c+ si
     * admite `FETCH FIRST ... ROWS ONLY`. El resto (postgresql/mysql/mariadb/h2) usa `LIMIT`.
     */
    public PaginationDialect paginationDialect(Connection connection) {
        try {
            var product = connection.getMetaData().getDatabaseProductName();
            var normalized = product == null ? "" : product.toLowerCase();
            if (normalized.contains("sql server") || normalized.contains("sqlserver")) {
                return PaginationDialect.OFFSET_FETCH;
            }
            if (normalized.contains("oracle")) {
                return PaginationDialect.FETCH_FIRST;
            }
            return PaginationDialect.LIMIT;
        } catch (SQLException error) {
            return PaginationDialect.LIMIT; // default seguro (mysql/postgresql/h2/mariadb)
        }
    }

    /** Sufijo de limite parametrizado (`?` = tamano de lote) segun dialecto. */
    public String limitClause(PaginationDialect dialect) {
        return switch (dialect) {
            case OFFSET_FETCH -> " offset 0 rows fetch next ? rows only";
            case FETCH_FIRST -> " fetch first ? rows only";
            case LIMIT -> " limit ?";
        };
    }

    private List<ReadRecord> readRecords(ResultSet resultSet) throws SQLException {
        var metadata = resultSet.getMetaData();
        var columnCount = metadata.getColumnCount();
        var records = new ArrayList<ReadRecord>();
        while (resultSet.next()) {
            var values = new LinkedHashMap<String, Object>();
            for (var index = 1; index <= columnCount; index++) {
                values.put(metadata.getColumnLabel(index), resultSet.getObject(index));
            }
            records.add(new ReadRecord(values));
        }
        return records;
    }
}
