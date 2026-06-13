package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Date;
import java.sql.SQLException;
import java.time.LocalDate;
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
        if (matchKeys == null || matchKeys.isEmpty()) {
            return;
        }
        var safeSentTable = sanitize(sentTable);
        var safeConfirmationTable = sanitize(confirmationTable);
        var joinClause = buildJoinClause("s", "c", matchKeys);
        executeReconcileUpdate(connection, safeSentTable, safeConfirmationTable, joinClause, from, to);
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
                                        LocalDate to) throws SQLException {
        var sql = "update " + safeSentTable + " s set status = 'RECONCILED'"
                + ", updated_at = current_timestamp"
                + " from " + safeConfirmationTable + " c"
                + " where " + joinClause
                + " and s.created_at::date between ? and ?"
                + " and s.status <> 'RECONCILED'";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setObject(1, from);
            statement.setObject(2, to);
            statement.executeUpdate();
        }
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
}
