package com.integrationhub.platform.provider.task;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
class PostgreSqlStoredProcedureDialect implements StoredProcedureDialect {

    @Override
    public boolean supports(String databaseProductName) {
        return databaseProductName != null && databaseProductName.trim().toUpperCase().contains("POSTGRES");
    }

    @Override
    public String callStatement(String procedureName, List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters) {
        var placeholders = parameters.stream()
                .map(parameter -> "cast(? as " + StoredProcedureRuntimeSupport.postgresType(parameter.jdbcType()) + ")")
                .toList();
        return "call " + procedureName + "(" + String.join(", ", placeholders) + ")";
    }

    @Override
    public String buildErrorMessage(DataSource targetDataSource,
                                    String procedureName,
                                    List<StoredProcedureRuntimeSupport.ResolvedParameter> parameters,
                                    SQLException error,
                                    String baseMessage) {
        if (!"42883".equals(error.getSQLState())) {
            return baseMessage;
        }
        try (Connection connection = targetDataSource.getConnection()) {
            var availableSignatures = loadProcedureSignatures(connection, procedureName);
            if (availableSignatures.isEmpty()) {
                return baseMessage + ". PostgreSQL did not find any procedure with that name.";
            }
            return baseMessage + ". Available PostgreSQL signatures: " + String.join(" | ", availableSignatures);
        } catch (SQLException ignored) {
            return baseMessage;
        }
    }

    private List<String> loadProcedureSignatures(Connection connection, String procedureName) throws SQLException {
        var schemaName = schemaName(procedureName);
        var simpleName = simpleProcedureName(procedureName);
        var sql = schemaName == null
                ? """
                  select n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as signature
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  where p.prokind = 'p' and p.proname = ?
                  order by n.nspname, p.proname
                  """
                : """
                  select n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as signature
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  where p.prokind = 'p' and n.nspname = ? and p.proname = ?
                  order by n.nspname, p.proname
                  """;
        try (var statement = connection.prepareStatement(sql)) {
            if (schemaName == null) {
                statement.setString(1, simpleName);
            } else {
                statement.setString(1, schemaName);
                statement.setString(2, simpleName);
            }
            try (var resultSet = statement.executeQuery()) {
                var signatures = new ArrayList<String>();
                while (resultSet.next()) {
                    signatures.add(resultSet.getString(1));
                }
                return signatures;
            }
        }
    }

    private String schemaName(String procedureName) {
        var separatorIndex = procedureName.lastIndexOf('.');
        if (separatorIndex <= 0) {
            return null;
        }
        return procedureName.substring(0, separatorIndex);
    }

    private String simpleProcedureName(String procedureName) {
        var separatorIndex = procedureName.lastIndexOf('.');
        if (separatorIndex < 0 || separatorIndex == procedureName.length() - 1) {
            return procedureName;
        }
        return procedureName.substring(separatorIndex + 1);
    }
}