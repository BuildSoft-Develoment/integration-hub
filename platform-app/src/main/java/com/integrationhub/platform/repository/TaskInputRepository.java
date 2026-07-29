package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
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

    public List<ReadRecord> readBatch(DataSource dataSource, ConnectionType connectionType, String table,
                                      String orderBy, Map<String, Object> filters, Object lastKey, int batchSize) {
        var tableName = DbTaskSupport.sanitizeQualifiedIdentifier(table);
        var orderByColumn = DbTaskSupport.sanitizeQualifiedIdentifier(orderBy);
        var effectiveFilters = filters == null ? Map.<String, Object>of() : filters;
        var dialect = paginationDialect(connectionType);
        try (Connection connection = dataSource.getConnection()) {
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
     * Dialecto de paginacion a partir del motor <em>declarado en la Conexion</em>, igual que resuelven
     * su dialecto SP, FN y DB_WRITE (ADR-022). Antes se deducia leyendo
     * {@code getDatabaseProductName()} de la conexion viva, lo que suponia un cuarto mecanismo de
     * deteccion en la misma base de codigo y una segunda fuente de verdad para la misma pregunta.
     *
     * <p>SQL Server NO admite {@code FETCH FIRST ... ROWS ONLY} suelto: exige
     * {@code OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY} (con ORDER BY). Oracle 12c+ si admite
     * {@code FETCH FIRST}. PostgreSQL y MySQL usan {@code LIMIT}.
     *
     * <p>El {@code switch} es exhaustivo <b>a proposito y no lleva {@code default}</b>: si algun dia se
     * anade un motor a {@link ConnectionType}, esto deja de compilar hasta que alguien decida su
     * paginacion. Un default habria emitido {@code limit ?} en silencio contra un motor que quiza no lo
     * entiende — por ejemplo DB2, que necesita {@code FETCH FIRST} — y el fallo habria aparecido en
     * ejecucion como un error de sintaxis que no senala la causa.
     */
    public PaginationDialect paginationDialect(ConnectionType connectionType) {
        return switch (connectionType) {
            case SQLSERVER -> PaginationDialect.OFFSET_FETCH;
            case ORACLE -> PaginationDialect.FETCH_FIRST;
            case POSTGRESQL, MYSQL -> PaginationDialect.LIMIT;
            case MONGODB -> throw new IllegalStateException(
                    "Unsupported connection type for paginated table input: " + connectionType);
        };
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
