package com.integrationhub.platform.service;

import com.integrationhub.platform.api.dto.ConnectionColumnView;
import com.integrationhub.platform.api.dto.ConnectionRoutineParameterView;
import com.integrationhub.platform.api.dto.ConnectionRoutineView;
import com.integrationhub.platform.api.dto.ConnectionSchemaView;
import com.integrationhub.platform.api.dto.ConnectionTableView;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.repository.ConnectionDefinitionRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class ConnectionMetadataService {

    private final ConnectionDefinitionRepository connectionDefinitionRepository;
    private final com.integrationhub.platform.service.ConnectionPoolManager connectionPoolManager;

    public ConnectionMetadataService(ConnectionDefinitionRepository connectionDefinitionRepository,
                                     com.integrationhub.platform.service.ConnectionPoolManager connectionPoolManager) {
        this.connectionDefinitionRepository = connectionDefinitionRepository;
        this.connectionPoolManager = connectionPoolManager;
    }

    public List<ConnectionSchemaView> listSchemas(Long connectionDefinitionId) {
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        var schemaNames = new LinkedHashSet<String>();
        withMetadata(definition, metadata -> {
            try (var schemas = metadata.getSchemas()) {
                while (schemas.next()) {
                    var schema = trimToNull(schemas.getString("TABLE_SCHEM"));
                    if (schema != null) {
                        schemaNames.add(schema);
                    }
                }
            }
        });
        return schemaNames.stream()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .map(ConnectionSchemaView::new)
                .toList();
    }

    public List<ConnectionTableView> listTables(Long connectionDefinitionId, String schema, String query) {
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        var normalizedQuery = normalize(query);
        var tables = new ArrayList<ConnectionTableView>();
        withMetadata(definition, metadata -> {
            try (var rows = metadata.getTables(null, blankToNull(schema), "%", new String[]{"TABLE", "VIEW"})) {
                while (rows.next()) {
                    var tableSchema = trimToNull(rows.getString("TABLE_SCHEM"));
                    var tableName = trimToNull(rows.getString("TABLE_NAME"));
                    if (tableName == null) {
                        continue;
                    }
                    var qualifiedName = tableSchema == null ? tableName : tableSchema + "." + tableName;
                    if (!normalizedQuery.isBlank() && !normalize(qualifiedName).contains(normalizedQuery)) {
                        continue;
                    }
                    tables.add(new ConnectionTableView(tableSchema, tableName, qualifiedName));
                }
            }
        });
        tables.sort(Comparator
                .comparing((ConnectionTableView item) -> item.schema() == null ? "" : item.schema(), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(ConnectionTableView::name, String.CASE_INSENSITIVE_ORDER));
        return tables;
    }

    public List<ConnectionColumnView> listColumns(Long connectionDefinitionId, String schema, String table) {
        if (table == null || table.isBlank()) {
            throw new IllegalArgumentException("Table is required");
        }
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        var columns = new ArrayList<ConnectionColumnView>();
        withMetadata(definition, metadata -> {
            try (var rows = metadata.getColumns(null, blankToNull(schema), table, "%")) {
                while (rows.next()) {
                    columns.add(new ConnectionColumnView(
                            trimToNull(rows.getString("TABLE_SCHEM")),
                            trimToNull(rows.getString("TABLE_NAME")),
                            trimToNull(rows.getString("COLUMN_NAME")),
                            trimToNull(rows.getString("TYPE_NAME")),
                            rows.getInt("NULLABLE") != DatabaseMetaData.columnNoNulls,
                            nullableInt(rows, "COLUMN_SIZE"),
                            nullableInt(rows, "DECIMAL_DIGITS")
                    ));
                }
            }
        });
        columns.sort(Comparator.comparing(ConnectionColumnView::name, String.CASE_INSENSITIVE_ORDER));
        return columns;
    }

    public List<ConnectionRoutineView> listProcedures(Long connectionDefinitionId, String schema, String query) {
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        var normalizedQuery = normalize(query);
        var routines = new ArrayList<ConnectionRoutineView>();
        withMetadata(definition, metadata -> {
            try (var rows = metadata.getProcedures(null, blankToNull(schema), "%")) {
                while (rows.next()) {
                    var routineSchema = trimToNull(rows.getString("PROCEDURE_SCHEM"));
                    var routineName = trimToNull(rows.getString("PROCEDURE_NAME"));
                    if (routineName == null) {
                        continue;
                    }
                    var qualifiedName = routineSchema == null ? routineName : routineSchema + "." + routineName;
                    if (!normalizedQuery.isBlank() && !normalize(qualifiedName).contains(normalizedQuery)) {
                        continue;
                    }
                    routines.add(new ConnectionRoutineView(routineSchema, routineName, qualifiedName, "PROCEDURE"));
                }
            }
        });
        return sortRoutines(routines);
    }

    public List<ConnectionRoutineParameterView> listProcedureParameters(Long connectionDefinitionId, String schema, String procedure) {
        if (procedure == null || procedure.isBlank()) {
            throw new IllegalArgumentException("Procedure is required");
        }
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        var parameters = new ArrayList<ConnectionRoutineParameterView>();
        withMetadata(definition, metadata -> {
            try (var rows = metadata.getProcedureColumns(null, blankToNull(schema), procedure, "%")) {
                while (rows.next()) {
                    var columnName = trimToNull(rows.getString("COLUMN_NAME"));
                    var direction = mapProcedureDirection(rows.getShort("COLUMN_TYPE"));
                    if (columnName == null || direction == null) {
                        continue;
                    }
                    parameters.add(new ConnectionRoutineParameterView(
                            trimToNull(rows.getString("PROCEDURE_SCHEM")),
                            trimToNull(rows.getString("PROCEDURE_NAME")),
                            columnName,
                            trimToNull(rows.getString("TYPE_NAME")),
                            direction,
                            nullableInt(rows, "ORDINAL_POSITION")
                    ));
                }
            }
        });
        parameters.sort(Comparator
                .comparing((ConnectionRoutineParameterView item) -> item.position() == null ? Integer.MAX_VALUE : item.position())
                .thenComparing(ConnectionRoutineParameterView::parameterName, String.CASE_INSENSITIVE_ORDER));
        return parameters;
    }

    public List<ConnectionRoutineView> listFunctions(Long connectionDefinitionId, String schema, String query) {
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        var normalizedQuery = normalize(query);
        var routines = new ArrayList<ConnectionRoutineView>();
        withMetadata(definition, metadata -> {
            try (var rows = metadata.getFunctions(null, blankToNull(schema), "%")) {
                while (rows.next()) {
                    var routineSchema = trimToNull(rows.getString("FUNCTION_SCHEM"));
                    var routineName = trimToNull(rows.getString("FUNCTION_NAME"));
                    if (routineName == null) {
                        continue;
                    }
                    var qualifiedName = routineSchema == null ? routineName : routineSchema + "." + routineName;
                    if (!normalizedQuery.isBlank() && !normalize(qualifiedName).contains(normalizedQuery)) {
                        continue;
                    }
                    routines.add(new ConnectionRoutineView(routineSchema, routineName, qualifiedName, "FUNCTION"));
                }
            }
        });
        return sortRoutines(routines);
    }

    public List<ConnectionRoutineParameterView> listFunctionParameters(Long connectionDefinitionId, String schema, String function) {
        if (function == null || function.isBlank()) {
            throw new IllegalArgumentException("Function is required");
        }
        var definition = connectionDefinitionRepository.findRequired(connectionDefinitionId);
        var parameters = new ArrayList<ConnectionRoutineParameterView>();
        withMetadata(definition, metadata -> {
            try (var rows = metadata.getFunctionColumns(null, blankToNull(schema), function, "%")) {
                while (rows.next()) {
                    var columnName = trimToNull(rows.getString("COLUMN_NAME"));
                    var direction = mapFunctionDirection(rows.getShort("COLUMN_TYPE"));
                    if (columnName == null || direction == null) {
                        continue;
                    }
                    parameters.add(new ConnectionRoutineParameterView(
                            trimToNull(rows.getString("FUNCTION_SCHEM")),
                            trimToNull(rows.getString("FUNCTION_NAME")),
                            columnName,
                            trimToNull(rows.getString("TYPE_NAME")),
                            direction,
                            nullableInt(rows, "ORDINAL_POSITION")
                    ));
                }
            }
        });
        parameters.sort(Comparator
                .comparing((ConnectionRoutineParameterView item) -> item.position() == null ? Integer.MAX_VALUE : item.position())
                .thenComparing(ConnectionRoutineParameterView::parameterName, String.CASE_INSENSITIVE_ORDER));
        return parameters;
    }

    private void withMetadata(ConnectionDefinition definition, MetadataConsumer consumer) {
        if (!definition.connectionType.isJdbc()) {
            throw new IllegalArgumentException("Connection type does not support JDBC metadata: " + definition.connectionType);
        }
        try (var connection = connectionPoolManager.resolveJdbcDataSource(definition.name).getConnection()) {
            consumer.accept(connection.getMetaData());
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot inspect JDBC metadata for connection " + definition.name, e);
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        var normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String blankToNull(String value) {
        return trimToNull(value);
    }

    private Integer nullableInt(ResultSet rows, String column) throws SQLException {
        var value = rows.getInt(column);
        return rows.wasNull() ? null : value;
    }

    private List<ConnectionRoutineView> sortRoutines(List<ConnectionRoutineView> routines) {
        routines.sort(Comparator
                .comparing((ConnectionRoutineView item) -> item.schema() == null ? "" : item.schema(), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(ConnectionRoutineView::name, String.CASE_INSENSITIVE_ORDER));
        return routines;
    }

    private String mapProcedureDirection(short columnType) {
        return switch (columnType) {
            case DatabaseMetaData.procedureColumnIn -> "IN";
            case DatabaseMetaData.procedureColumnOut -> "OUT";
            case DatabaseMetaData.procedureColumnInOut -> "INOUT";
            default -> null;
        };
    }

    private String mapFunctionDirection(short columnType) {
        return switch (columnType) {
            case DatabaseMetaData.functionColumnIn -> "IN";
            case DatabaseMetaData.functionColumnOut -> "OUT";
            case DatabaseMetaData.functionColumnInOut -> "INOUT";
            default -> null;
        };
    }

    @FunctionalInterface
    private interface MetadataConsumer {
        void accept(DatabaseMetaData metadata) throws SQLException;
    }
}

