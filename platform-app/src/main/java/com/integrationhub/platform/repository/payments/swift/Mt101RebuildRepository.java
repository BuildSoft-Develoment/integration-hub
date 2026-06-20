package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Repository JDBC para corridas de rebuild MT101 y su seleccion auditable. */
@ApplicationScoped
public class Mt101RebuildRepository {

    public void createRun(DataSource dataSource,
                          String rebuildRunId,
                          String originalFragmentSetId,
                          String correctiveSetId,
                          String requestedBy,
                          String requestReason) throws SQLException {
        // Codigo de referencia unico por run (secuencia de BD, base36) -> prefijo del
        // :20: correctivo. No depende de CRC32 (colisionable). Una sola conexion.
        var insert = "insert into mt101_rebuild_run "
                + "(rebuild_run_id, original_fragment_set_id, corrective_set_id, requested_by, request_reason, reference_code, status) "
                + "values (?, ?, ?, ?, ?, ?, 'REQUESTED') "
                + "on conflict (rebuild_run_id) do nothing";
        try (var connection = dataSource.getConnection()) {
            var referenceCode = nextReferenceCode(connection);
            try (var statement = connection.prepareStatement(insert)) {
                statement.setString(1, rebuildRunId);
                statement.setString(2, originalFragmentSetId);
                statement.setString(3, correctiveSetId);
                statement.setString(4, requestedBy);
                statement.setString(5, requestReason);
                statement.setString(6, referenceCode);
                statement.executeUpdate();
            }
        }
    }

    private String nextReferenceCode(java.sql.Connection connection) throws SQLException {
        try (var statement = connection.prepareStatement("select nextval('mt101_rebuild_reference_seq')");
             var rs = statement.executeQuery()) {
            if (!rs.next()) {
                throw new SQLException("mt101_rebuild_reference_seq returned no value");
            }
            return Long.toString(rs.getLong(1), 36).toUpperCase(java.util.Locale.ROOT);
        }
    }

    public RebuildRun findRun(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = """
                select rebuild_run_id, original_fragment_set_id, corrective_set_id, status,
                       requested_by, approved_by, executed_by, request_reason, approval_reason,
                       selected_rows, affected_fragments, error_message,
                       reference_code, created_at, approved_at, executed_at, built_at, completed_at, updated_at
                  from mt101_rebuild_run
                 where rebuild_run_id = ?
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new RebuildRun(
                        rs.getString("rebuild_run_id"),
                        rs.getString("original_fragment_set_id"),
                        rs.getString("corrective_set_id"),
                        rs.getString("status"),
                        rs.getString("requested_by"),
                        rs.getString("approved_by"),
                        rs.getString("executed_by"),
                        rs.getString("request_reason"),
                        rs.getString("approval_reason"),
                        rs.getLong("selected_rows"),
                        rs.getInt("affected_fragments"),
                        rs.getString("error_message"),
                        rs.getString("reference_code"),
                        timestamp(rs, "created_at"),
                        timestamp(rs, "approved_at"),
                        timestamp(rs, "executed_at"),
                        timestamp(rs, "built_at"),
                        timestamp(rs, "completed_at"),
                        timestamp(rs, "updated_at"));
            }
        }
    }

    public int approveRun(DataSource dataSource, String rebuildRunId, String approvedBy, String approvalReason) throws SQLException {
        var sql = "update mt101_rebuild_run set status = 'APPROVED', approved_by = ?, "
                + "approval_reason = ?, approved_at = current_timestamp, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and status = 'REQUESTED'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, approvedBy);
            statement.setString(2, approvalReason);
            statement.setString(3, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    /**
     * Reclama el run para ejecucion de forma atomica: {@code APPROVED -> BUILDING}
     * condicional. Devuelve true solo si ESTA llamada hizo la transicion, evitando que
     * dos ejecuciones concurrentes generen el mismo set correctivo dos veces.
     */
    public boolean claimForExecution(DataSource dataSource, String rebuildRunId, String executedBy) throws SQLException {
        var sql = "update mt101_rebuild_run set status = 'BUILDING', executed_by = ?, "
                + "executed_at = current_timestamp, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and status = 'APPROVED'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, executedBy);
            statement.setString(2, rebuildRunId);
            return statement.executeUpdate() == 1;
        }
    }

    public void markStatus(DataSource dataSource, String rebuildRunId, String status, String errorMessage) throws SQLException {
        var sql = "update mt101_rebuild_run set status = ?, error_message = ?, "
                + lifecycleColumn(status) + " updated_at = current_timestamp where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setString(2, errorMessage);
            statement.setString(3, rebuildRunId);
            statement.executeUpdate();
        }
    }

    private String lifecycleColumn(String status) {
        if ("BUILT".equals(status)) {
            return "built_at = current_timestamp, ";
        }
        if ("FAILED".equals(status) || "RESOLVED".equals(status) || "RECONCILED".equals(status)) {
            return "completed_at = current_timestamp, ";
        }
        return "";
    }

    public List<RebuildRun> findRunsByOriginalSet(DataSource dataSource, String originalFragmentSetId) throws SQLException {
        var sql = """
                select rebuild_run_id
                  from mt101_rebuild_run
                 where original_fragment_set_id = ?
                   and status not in ('REQUESTED', 'APPROVED', 'FAILED', 'CANCELLED', 'RECONCILED', 'RESOLVED')
                 order by created_at asc
                """;
        var result = new ArrayList<RebuildRun>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, originalFragmentSetId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var run = findRun(dataSource, rs.getString("rebuild_run_id"));
                    if (run != null) {
                        result.add(run);
                    }
                }
            }
        }
        return result;
    }

    public LifecycleStatus deriveLifecycleStatus(DataSource dataSource, String correctiveSetId) throws SQLException {
        var fragmentSql = """
                select status, count(*) total
                  from mt101_build_fragment
                 where fragment_set_id = ?
                 group by status
                """;
        var fragments = new LinkedHashMap<String, Long>();
        Long processExecutionId = null;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(fragmentSql)) {
            statement.setString(1, correctiveSetId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    fragments.put(normalize(rs.getString("status")), rs.getLong("total"));
                }
            }
            try (var meta = connection.prepareStatement(
                    "select process_execution_id from mt101_build_fragment where fragment_set_id = ? limit 1")) {
                meta.setString(1, correctiveSetId);
                try (var rs = meta.executeQuery()) {
                    if (rs.next()) {
                        var value = rs.getLong(1);
                        processExecutionId = rs.wasNull() ? null : value;
                    }
                }
            }
        }
        if (fragments.isEmpty()) {
            return new LifecycleStatus(null, false);
        }
        if (fragments.containsKey("REJECTED")) {
            return new LifecycleStatus("FAILED", false);
        }
        var total = fragments.values().stream().mapToLong(Long::longValue).sum();
        if (allIn(fragments, total, "SENT")) {
            return archiveLifecycle(dataSource, correctiveSetId, processExecutionId, total);
        }
        if (allIn(fragments, total, "ARCHIVED", "SENT")) {
            return new LifecycleStatus("ARCHIVED", false);
        }
        if (allIn(fragments, total, "VALIDATED", "ARCHIVED", "SENT")) {
            return new LifecycleStatus("VALIDATED", false);
        }
        return new LifecycleStatus("BUILT", false);
    }

    private LifecycleStatus archiveLifecycle(DataSource dataSource,
                                             String correctiveSetId,
                                             Long processExecutionId,
                                             long expected) throws SQLException {
        var sql = """
                select a.status, count(*) total
                  from mt101_archive a
                  join mt101_build_fragment f
                    on f.senders_reference = a.senders_reference
                   and (a.process_execution_id = f.process_execution_id or a.process_execution_id is null)
                 where f.fragment_set_id = ?
                """;
        if (processExecutionId != null) {
            sql += " and (a.process_execution_id = ? or a.process_execution_id is null)";
        }
        sql += " group by a.status";
        var archived = new LinkedHashMap<String, Long>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, correctiveSetId);
            if (processExecutionId != null) {
                statement.setLong(2, processExecutionId);
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    archived.put(normalize(rs.getString("status")), rs.getLong("total"));
                }
            }
        }
        var archiveTotal = archived.values().stream().mapToLong(Long::longValue).sum();
        if (archiveTotal < expected) {
            return new LifecycleStatus("SENT", false);
        }
        if (allIn(archived, expected, "RECONCILED")) {
            return new LifecycleStatus("RECONCILED", true);
        }
        if (allIn(archived, expected, "CONFIRMED", "RECONCILED")) {
            return new LifecycleStatus("CONFIRMED", false);
        }
        return new LifecycleStatus("SENT", false);
    }

    public boolean updateLifecycleIfAdvanced(DataSource dataSource, RebuildRun run, String nextStatus) throws SQLException {
        if (nextStatus == null || nextStatus.isBlank() || run == null) {
            return false;
        }
        var current = normalize(run.status());
        var next = normalize(nextStatus);
        if (current.equals(next)) {
            return false;
        }
        var currentRank = lifecycleRank(run.status());
        var nextRank = lifecycleRank(nextStatus);
        if (nextRank <= currentRank && !"FAILED".equals(next)) {
            return false;
        }
        markStatus(dataSource, run.rebuildRunId(), next, "FAILED".equals(next) ? "corrective set rejected" : null);
        return true;
    }

    private int lifecycleRank(String status) {
        return switch (normalize(status)) {
            case "REQUESTED" -> 10;
            case "APPROVED" -> 20;
            case "BUILDING" -> 30;
            case "BUILT" -> 40;
            case "VALIDATED" -> 50;
            case "ARCHIVED" -> 60;
            case "SENT" -> 70;
            case "CONFIRMED" -> 80;
            case "RECONCILED", "RESOLVED" -> 90;
            case "FAILED", "CANCELLED" -> 100;
            default -> 0;
        };
    }

    private boolean allIn(Map<String, Long> counts, long expected, String... statuses) {
        var allowed = java.util.Set.of(statuses);
        var total = counts.entrySet().stream()
                .filter(entry -> allowed.contains(entry.getKey()))
                .mapToLong(Map.Entry::getValue)
                .sum();
        return expected > 0 && total == expected;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    public void updateSelectionStats(DataSource dataSource,
                                     String rebuildRunId,
                                     long selectedRows,
                                     int affectedFragments) throws SQLException {
        var sql = "update mt101_rebuild_run set selected_rows = ?, affected_fragments = ?, "
                + "updated_at = current_timestamp where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, selectedRows);
            statement.setInt(2, affectedFragments);
            statement.setString(3, rebuildRunId);
            statement.executeUpdate();
        }
    }

    public int insertSelectionFromFragmentRecords(DataSource dataSource,
                                                  String rebuildRunId,
                                                  String fragmentSetId,
                                                  Collection<String> sendersReferences) throws SQLException {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return 0;
        }
        var sql = "insert into mt101_rebuild_selection "
                + "(rebuild_run_id, fragment_set_id, source_file_hash, source_record_number, record_index, "
                + " staging_id, original_senders_reference, original_transaction_reference, status) "
                + "select ?, fragment_set_id, source_file_hash, source_record_number, source_record_number - 1, "
                + "       staging_id, current_senders_reference, current_transaction_reference, 'SELECTED' "
                + "  from mt101_fragment_record "
                + " where fragment_set_id = ? "
                + "   and current_senders_reference in (" + placeholders(sendersReferences.size()) + ") "
                + "on conflict do nothing";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, rebuildRunId);
            statement.setString(parameter++, fragmentSetId);
            for (var reference : sendersReferences) {
                statement.setString(parameter++, reference);
            }
            return statement.executeUpdate();
        }
    }

    public long countSelection(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select count(*) from mt101_rebuild_selection where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0L;
            }
        }
    }

    public int attachCorrectiveRecords(DataSource dataSource,
                                       String rebuildRunId,
                                       String correctiveSetId,
                                       String originalFragmentSetId) throws SQLException {
        var sql = """
                update mt101_fragment_record fr
                   set original_fragment_set_id = ?,
                       original_senders_reference = sel.original_senders_reference,
                       original_transaction_reference = sel.original_transaction_reference,
                       rebuild_run_id = ?
                  from mt101_rebuild_selection sel
                 where sel.rebuild_run_id = ?
                   and fr.fragment_set_id = ?
                   and fr.source_record_number = sel.source_record_number
                   and (sel.source_file_hash is null or fr.source_file_hash = sel.source_file_hash)
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, originalFragmentSetId);
            statement.setString(2, rebuildRunId);
            statement.setString(3, rebuildRunId);
            statement.setString(4, correctiveSetId);
            return statement.executeUpdate();
        }
    }

    public List<String> referencesFromSelection(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select distinct original_senders_reference from mt101_rebuild_selection "
                + "where rebuild_run_id = ? and original_senders_reference is not null "
                + "order by original_senders_reference";
        var result = new ArrayList<String>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(rs.getString(1));
                }
            }
        }
        return result;
    }

    private String placeholders(int count) {
        return String.join(", ", java.util.Collections.nCopies(count, "?"));
    }

    private LocalDateTime timestamp(java.sql.ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }

    public record RebuildRun(
            String rebuildRunId,
            String originalFragmentSetId,
            String correctiveSetId,
            String status,
            String requestedBy,
            String approvedBy,
            String executedBy,
            String requestReason,
            String approvalReason,
            long selectedRows,
            int affectedFragments,
            String errorMessage,
            String referenceCode,
            LocalDateTime createdAt,
            LocalDateTime approvedAt,
            LocalDateTime executedAt,
            LocalDateTime builtAt,
            LocalDateTime completedAt,
            LocalDateTime updatedAt
    ) {
    }

    public record LifecycleStatus(String status, boolean terminal) {
    }
}
