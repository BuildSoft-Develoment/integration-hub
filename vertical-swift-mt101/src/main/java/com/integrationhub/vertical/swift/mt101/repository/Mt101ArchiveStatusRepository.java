package com.integrationhub.vertical.swift.mt101.repository;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Date;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Repository JDBC para el lifecycle durable de {@code mt101_archive}.
 *
 * <p>La vertical MT101 permite tablas/connectionRef configurables, por eso este
 * repository trabaja con {@link DataSource}/{@link Connection} resueltos por la
 * capa de servicio y no con Panache sobre una unica entidad fija.</p>
 */
@ApplicationScoped
public class Mt101ArchiveStatusRepository {

    public void updateStatusTargets(DataSource dataSource,
                                    String table,
                                    Collection<StatusTarget> targets,
                                    String status) throws SQLException {
        if (targets == null || targets.isEmpty()) {
            return;
        }
        var safeTable = sanitize(table);
        try (Connection connection = dataSource.getConnection()) {
            executeStatusTargetUpdate(connection, safeTable, targets, status);
        }
    }

    public void updateStatusByArchiveIds(Connection connection,
                                         String table,
                                         Collection<Long> archiveIds,
                                         String status) throws SQLException {
        if (archiveIds == null || archiveIds.isEmpty()) {
            return;
        }
        var updates = new ArrayList<ArchiveStatusUpdate>(archiveIds.size());
        for (var archiveId : archiveIds) {
            updates.add(new ArchiveStatusUpdate(archiveId, status));
        }
        updateArchiveStatus(connection, table, updates);
    }

    public void updateArchiveStatus(Connection connection,
                                    String table,
                                    Collection<ArchiveStatusUpdate> updates) throws SQLException {
        if (updates == null || updates.isEmpty()) {
            return;
        }
        var safeTable = sanitize(table);
        executeArchiveStatusUpdate(connection, safeTable, updates);
    }

    public void markReconciled(Connection connection,
                               String sentTable,
                               String confirmationTable,
                               List<JoinSpec> matchKeys,
                               LocalDate from,
                               LocalDate to) throws SQLException {
        markReconciled(connection, sentTable, confirmationTable, matchKeys, from, to, List.of());
    }

    public void markReconciled(Connection connection,
                               String sentTable,
                               String confirmationTable,
                               List<JoinSpec> matchKeys,
                               LocalDate from,
                               LocalDate to,
                               List<String> scopeSendersReferences) throws SQLException {
        if (matchKeys == null || matchKeys.isEmpty()) {
            return;
        }
        var safeSentTable = sanitize(sentTable);
        var safeConfirmationTable = sanitize(confirmationTable);
        var joinClause = buildJoinClause("s", "c", matchKeys);
        var scope = scopeSendersReferences == null ? List.<String>of()
                : scopeSendersReferences.stream().filter(value -> value != null && !value.isBlank()).toList();
        executeReconcileUpdate(connection, safeSentTable, safeConfirmationTable, joinClause, from, to, scope);
    }

    public ArchiveStatus findLatestBySendersReference(DataSource dataSource,
                                                      String table,
                                                      String sendersReference,
                                                      Long processExecutionId) throws SQLException {
        if (sendersReference == null || sendersReference.isBlank()) {
            return null;
        }
        var safeTable = sanitize(table);
        // Scope por ejecucion: un :20: original (p.ej. P3) puede repetirse entre ejecuciones;
        // sin este filtro la consulta podia traer el archive de otra ejecucion distinta.
        var scoped = processExecutionId != null;
        var sql = "select id, senders_reference, status, created_at, updated_at from " + safeTable
                + " where senders_reference = ?"
                + (scoped ? " and process_execution_id = ?" : "")
                + " order by updated_at desc, created_at desc, id desc limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, sendersReference);
            if (scoped) {
                statement.setLong(2, processExecutionId);
            }
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new ArchiveStatus(
                        rs.getLong("id"),
                        rs.getString("senders_reference"),
                        rs.getString("status"),
                        timestamp(rs, "created_at"),
                        timestamp(rs, "updated_at"));
            }
        }
    }

    public List<ConfirmationStatus> confirmationsByArchiveId(DataSource dataSource,
                                                             String table,
                                                             long archiveId,
                                                             int limit) throws SQLException {
        var safeTable = sanitize(table);
        var sql = "select id, confirmation_type, gateway_reference, confirmed_status, received_at "
                + "from " + safeTable + " where archive_id = ? order by received_at asc, id asc limit ?";
        var result = new ArrayList<ConfirmationStatus>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, archiveId);
            statement.setInt(2, Math.max(limit, 1));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new ConfirmationStatus(
                            rs.getLong("id"),
                            rs.getString("confirmation_type"),
                            rs.getString("gateway_reference"),
                            rs.getString("confirmed_status"),
                            timestamp(rs, "received_at")));
                }
            }
        }
        return result;
    }

    public List<ReconciliationExceptionStatus> reconciliationExceptionsByArchiveId(DataSource dataSource,
                                                                                   String table,
                                                                                   long archiveId,
                                                                                   int limit) throws SQLException {
        var safeTable = sanitize(table);
        var sql = "select id, as_of_date, exception_type, details, resolved_at "
                + "from " + safeTable + " where archive_id = ? order by as_of_date asc, id asc limit ?";
        var result = new ArrayList<ReconciliationExceptionStatus>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, archiveId);
            statement.setInt(2, Math.max(limit, 1));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var asOf = rs.getDate("as_of_date");
                    result.add(new ReconciliationExceptionStatus(
                            rs.getLong("id"),
                            asOf == null ? null : asOf.toLocalDate(),
                            rs.getString("exception_type"),
                            rs.getString("details"),
                            timestamp(rs, "resolved_at")));
                }
            }
        }
        return result;
    }

    private void executeStatusTargetUpdate(Connection connection,
                                           String safeTable,
                                           Collection<StatusTarget> targets,
                                           String status) throws SQLException {
        var sql = "update " + safeTable
                + " set status = ?, updated_at = current_timestamp"
                + " where senders_reference = ?"
                + " and (cast(? as date) is null or requested_execution_date = ?)"
                + " and (cast(? as varchar) is null or sender_lt = ?)";
        try (var statement = connection.prepareStatement(sql)) {
            for (var target : targets) {
                if (target == null || target.sendersReference() == null
                        || target.sendersReference().isBlank()) {
                    continue;
                }
                statement.setString(1, status);
                statement.setString(2, target.sendersReference());
                var requestedExecutionDate = target.requestedExecutionDate() == null
                        ? null
                        : Date.valueOf(target.requestedExecutionDate());
                statement.setDate(3, requestedExecutionDate);
                statement.setDate(4, requestedExecutionDate);
                statement.setString(5, target.senderLt());
                statement.setString(6, target.senderLt());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private void executeArchiveStatusUpdate(Connection connection,
                                            String safeTable,
                                            Collection<ArchiveStatusUpdate> updates) throws SQLException {
        var sql = "update " + safeTable
                + " set status = ?, updated_at = current_timestamp"
                + " where id = ?";
        try (var statement = connection.prepareStatement(sql)) {
            var any = false;
            for (var update : updates) {
                if (update == null || update.archiveId() == null || update.status() == null
                        || update.status().isBlank()) {
                    continue;
                }
                statement.setString(1, update.status());
                statement.setLong(2, update.archiveId());
                statement.addBatch();
                any = true;
            }
            if (any) {
                statement.executeBatch();
            }
        }
    }

    private void executeReconcileUpdate(Connection connection,
                                        String safeSentTable,
                                        String safeConfirmationTable,
                                        String joinClause,
                                        LocalDate from,
                                        LocalDate to,
                                        List<String> scopeSendersReferences) throws SQLException {
        var sql = "update " + safeSentTable + " s set status = 'RECONCILED'"
                + ", updated_at = current_timestamp"
                + " from " + safeConfirmationTable + " c"
                + " where " + joinClause
                + " and s.created_at::date between ? and ?"
                + (scopeSendersReferences.isEmpty()
                ? "" : " and s.senders_reference in (" + placeholders(scopeSendersReferences.size()) + ")")
                + " and s.status <> 'RECONCILED'";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setObject(1, from);
            statement.setObject(2, to);
            var parameter = 3;
            for (var reference : scopeSendersReferences) {
                statement.setString(parameter++, reference);
            }
            statement.executeUpdate();
        }
    }

    private String placeholders(int count) {
        return String.join(",", java.util.Collections.nCopies(count, "?"));
    }

    private String buildJoinClause(String leftAlias, String rightAlias, List<JoinSpec> keys) {
        var clauses = new ArrayList<String>(keys.size());
        for (var key : keys) {
            clauses.add(leftAlias + "." + sanitize(key.leftColumn())
                    + " = " + rightAlias + "." + sanitize(key.rightColumn()));
        }
        return String.join(" and ", clauses);
    }

    private String sanitize(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Archive table identifier cannot be blank");
        }
        if (!identifier.matches("[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?")) {
            throw new IllegalArgumentException("Unsafe archive table identifier: " + identifier);
        }
        return identifier;
    }

    public record StatusTarget(String sendersReference,
                               LocalDate requestedExecutionDate,
                               String senderLt) {
    }

    public record ArchiveStatusUpdate(Long archiveId, String status) {
    }

    public record JoinSpec(String leftColumn, String rightColumn) {
    }

    public record ArchiveStatus(long archiveId,
                                String sendersReference,
                                String status,
                                LocalDateTime createdAt,
                                LocalDateTime updatedAt) {
    }

    public record ConfirmationStatus(long confirmationId,
                                     String confirmationType,
                                     String gatewayReference,
                                     String confirmedStatus,
                                     LocalDateTime receivedAt) {
    }

    public record ReconciliationExceptionStatus(long exceptionId,
                                                LocalDate asOfDate,
                                                String exceptionType,
                                                String details,
                                                LocalDateTime resolvedAt) {
    }

    private LocalDateTime timestamp(java.sql.ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }
}
