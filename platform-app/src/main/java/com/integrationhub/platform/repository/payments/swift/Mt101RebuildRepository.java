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

    public void createRun(java.sql.Connection connection,
                          String rebuildRunId,
                          String originalFragmentSetId,
                          String correctiveSetId,
                          String requestedBy,
                          String requestReason,
                          String referenceCode,
                          String connectionRef) throws SQLException {
        // B1: el id del run/correctivo lo genera el servidor a partir del reference_code
        // (secuencia de BD, base36). El cliente no puede reutilizar un set existente.
        // R-d: se guarda el connectionRef para que el scheduler resuelva el datasource.
        var insert = "insert into mt101_rebuild_run "
                + "(rebuild_run_id, original_fragment_set_id, corrective_set_id, requested_by, request_reason, "
                + " reference_code, connection_ref, status) "
                + "values (?, ?, ?, ?, ?, ?, ?, 'REQUESTED')";
        try (var statement = connection.prepareStatement(insert)) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, originalFragmentSetId);
            statement.setString(3, correctiveSetId);
            statement.setString(4, requestedBy);
            statement.setString(5, requestReason);
            statement.setString(6, referenceCode);
            statement.setString(7, blankToNull(connectionRef));
            statement.executeUpdate();
        }
    }

    public void createChildRun(java.sql.Connection connection,
                               String rebuildRunId,
                               String originalFragmentSetId,
                               String correctiveSetId,
                               String requestedBy,
                               String requestReason,
                               String referenceCode,
                               String connectionRef,
                               String parentRebuildRunId,
                               String parentCorrectiveSetId,
                               int correctiveGeneration) throws SQLException {
        var insert = "insert into mt101_rebuild_run "
                + "(rebuild_run_id, original_fragment_set_id, corrective_set_id, requested_by, request_reason, "
                + " reference_code, connection_ref, parent_rebuild_run_id, parent_corrective_set_id, "
                + " corrective_generation, status) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED')";
        try (var statement = connection.prepareStatement(insert)) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, originalFragmentSetId);
            statement.setString(3, correctiveSetId);
            statement.setString(4, requestedBy);
            statement.setString(5, requestReason);
            statement.setString(6, referenceCode);
            statement.setString(7, blankToNull(connectionRef));
            statement.setString(8, parentRebuildRunId);
            statement.setString(9, parentCorrectiveSetId);
            statement.setInt(10, Math.max(correctiveGeneration, 2));
            statement.executeUpdate();
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Reserva el siguiente codigo de referencia unico (secuencia de BD, base36). */
    public String nextReferenceCode(DataSource dataSource) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            return nextReferenceCode(connection);
        }
    }

    /** True si el set ya existe como lote de fragmentos (B1: evita sobrescribir lotes). */
    public boolean fragmentSetExists(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "select 1 from mt101_build_fragment where fragment_set_id = ? limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                return rs.next();
            }
        }
    }

    public int nextChildGeneration(DataSource dataSource, String parentRebuildRunId) throws SQLException {
        var sql = """
                select coalesce(max(corrective_generation), 1) + 1
                  from mt101_rebuild_run
                 where rebuild_run_id = ?
                    or parent_rebuild_run_id = ?
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, parentRebuildRunId);
            statement.setString(2, parentRebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? Math.max(rs.getInt(1), 2) : 2;
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
                       reference_code, connection_ref, pay_status, pay_requested_by, pay_approved_by,
                       pay_requested_payload_hash, pay_claimed_payload_hash, pay_lease_until,
                       pay_uncertain_reason, pay_error_message,
                       created_at, approved_at, executed_at, built_at, completed_at, updated_at,
                       pay_request_reason, pay_request_ticket,
                       pay_resolved_by, pay_resolved_at, pay_resolution_reason
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
                        rs.getString("connection_ref"),
                        rs.getString("pay_status"),
                        rs.getString("pay_requested_by"),
                        rs.getString("pay_approved_by"),
                        rs.getString("pay_requested_payload_hash"),
                        rs.getString("pay_claimed_payload_hash"),
                        timestamp(rs, "pay_lease_until"),
                        rs.getString("pay_uncertain_reason"),
                        rs.getString("pay_error_message"),
                        timestamp(rs, "created_at"),
                        timestamp(rs, "approved_at"),
                        timestamp(rs, "executed_at"),
                        timestamp(rs, "built_at"),
                        timestamp(rs, "completed_at"),
                        timestamp(rs, "updated_at"),
                        rs.getString("pay_request_reason"),
                        rs.getString("pay_request_ticket"),
                        rs.getString("pay_resolved_by"),
                        timestamp(rs, "pay_resolved_at"),
                        rs.getString("pay_resolution_reason"));
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

    public List<RebuildRun> listRunsByOriginalSet(DataSource dataSource, String originalFragmentSetId, int limit) throws SQLException {
        var sql = """
                select rebuild_run_id
                  from mt101_rebuild_run
                 where original_fragment_set_id = ?
                 order by created_at desc
                 limit ?
                """;
        var result = new ArrayList<RebuildRun>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, originalFragmentSetId);
            statement.setInt(2, Math.max(limit, 1));
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
        var rejected = fragments.getOrDefault("REJECTED", 0L);
        var sent = fragments.getOrDefault("SENT", 0L);
        var total = fragments.values().stream().mapToLong(Long::longValue).sum();
        if (rejected > 0 && sent > 0) {
            return new LifecycleStatus("PARTIALLY_SENT", false);
        }
        if (rejected > 0 && rejected == total) {
            return new LifecycleStatus("FAILED", false);
        }
        if (rejected > 0) {
            return new LifecycleStatus("PARTIALLY_FAILED", false);
        }
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
            case "PARTIALLY_SENT", "PARTIALLY_FAILED" -> 75;
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

    public void updateSelectionStats(java.sql.Connection connection,
                                     String rebuildRunId,
                                     long selectedRows,
                                     int affectedFragments) throws SQLException {
        var sql = "update mt101_rebuild_run set selected_rows = ?, affected_fragments = ?, "
                + "updated_at = current_timestamp where rebuild_run_id = ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setLong(1, selectedRows);
            statement.setInt(2, affectedFragments);
            statement.setString(3, rebuildRunId);
            statement.executeUpdate();
        }
    }

    public int insertSelectionFromFragmentRecords(java.sql.Connection connection,
                                                  String rebuildRunId,
                                                  String fragmentSetId,
                                                  Collection<String> sendersReferences) throws SQLException {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return 0;
        }
        // B2: congela el payload aprobado por fila (hash SHA-256 + version del staging al
        // momento de solicitar). Al ejecutar se compara contra el staging actual.
        var sql = "insert into mt101_rebuild_selection "
                + "(rebuild_run_id, fragment_set_id, source_file_hash, source_record_number, record_index, "
                + " staging_id, original_senders_reference, original_transaction_reference, "
                + " source_task_definition_id, source_name, "
                + " selected_payload_hash, selected_staging_version, status) "
                + "select ?, fr.fragment_set_id, fr.source_file_hash, fr.source_record_number, fr.source_record_number - 1, "
                + "       fr.staging_id, fr.current_senders_reference, fr.current_transaction_reference, "
                + "       fr.source_task_definition_id, fr.source_name, "
                + "       encode(sha256(s.payload_json::bytea), 'hex'), s.version, 'SELECTED' "
                + "  from mt101_fragment_record fr "
                + "  left join staging_record s on s.id = fr.staging_id "
                + " where fr.fragment_set_id = ? "
                + "   and fr.staging_id is not null "
                + "   and fr.current_senders_reference in (" + placeholders(sendersReferences.size()) + ") "
                + "on conflict do nothing";
        try (var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, rebuildRunId);
            statement.setString(parameter++, fragmentSetId);
            for (var reference : sendersReferences) {
                statement.setString(parameter++, reference);
            }
            return statement.executeUpdate();
        }
    }

    public long countSelection(java.sql.Connection connection, String rebuildRunId) throws SQLException {
        var sql = "select count(*) from mt101_rebuild_selection where rebuild_run_id = ?";
        try (var statement = connection.prepareStatement(sql)) {
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
                   and sel.staging_id is not null
                   and fr.staging_id = sel.staging_id
                   and fr.source_record_number = sel.source_record_number
                   and fr.source_file_hash = sel.source_file_hash
                   and fr.source_task_definition_id is not distinct from sel.source_task_definition_id
                   and fr.source_name is not distinct from sel.source_name
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, originalFragmentSetId);
            statement.setString(2, rebuildRunId);
            statement.setString(3, rebuildRunId);
            statement.setString(4, correctiveSetId);
            var attached = statement.executeUpdate();
            mapCorrectiveReferences(connection, rebuildRunId);
            return attached;
        }
    }

    private void mapCorrectiveReferences(java.sql.Connection connection, String rebuildRunId) throws SQLException {
        var sql = """
                update mt101_rebuild_selection sel
                   set corrective_senders_reference = fr.current_senders_reference,
                       corrective_transaction_reference = fr.current_transaction_reference,
                       status = 'BUILT',
                       lifecycle_updated_at = current_timestamp
                  from mt101_fragment_record fr
                 where sel.rebuild_run_id = ?
                   and fr.rebuild_run_id = sel.rebuild_run_id
                   and sel.staging_id is not null
                   and fr.staging_id = sel.staging_id
                   and fr.source_record_number = sel.source_record_number
                   and fr.source_file_hash = sel.source_file_hash
                   and fr.source_task_definition_id is not distinct from sel.source_task_definition_id
                   and fr.source_name is not distinct from sel.source_name
                """;
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.executeUpdate();
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

    /**
     * B2: cuantas filas seleccionadas cambiaron en staging despues de aprobar (hash o
     * version distintos del snapshot). > 0 => la aprobacion ya no cubre los datos reales.
     */
    public int countStaleSelections(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select count(*) from mt101_rebuild_selection sel "
                + "join staging_record s on s.id = sel.staging_id "
                + "where sel.rebuild_run_id = ? "
                + "  and (sel.selected_staging_version is distinct from s.version "
                + "       or sel.selected_payload_hash is distinct from encode(sha256(s.payload_json::bytea), 'hex'))";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    /** B2: revoca la aprobacion (APPROVED -> REQUESTED) cuando el staging cambio tras aprobar. */
    public int revertApprovalToRequested(DataSource dataSource, String rebuildRunId, String reason) throws SQLException {
        var sql = "update mt101_rebuild_run set status = 'REQUESTED', approved_by = null, approved_at = null, "
                + "error_message = ?, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and status = 'APPROVED'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, reason);
            statement.setString(2, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    /**
     * B2: true si la fila esta en un run APPROVED/BUILDING (datos congelados): no se admite
     * corregirla hasta que el run termine o se invalide. Connection-scoped para correr dentro
     * de la transaccion de la correccion.
     */
    public boolean isRowLockedByActiveRun(java.sql.Connection connection,
                                          String fragmentSetId,
                                          String sourceFileHash,
                                          long recordNumber,
                                          long stagingId) throws SQLException {
        var sql = "select 1 from mt101_rebuild_selection sel "
                + "join mt101_rebuild_run run on run.rebuild_run_id = sel.rebuild_run_id "
                + "where sel.fragment_set_id = ? "
                + "  and sel.source_file_hash = ? "
                + "  and sel.source_record_number = ? "
                + "  and sel.staging_id = ? "
                + "  and run.status in ('APPROVED', 'BUILDING') limit 1";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.setString(2, sourceFileHash);
            statement.setLong(3, recordNumber);
            statement.setLong(4, stagingId);
            try (var rs = statement.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * R6/R-d: sets originales con un run correctivo en curso (lifecycle no terminal) y el
     * connectionRef con que se crearon, para que el scheduler resuelva el datasource correcto.
     */
    public List<ActiveSet> findActiveOriginalSets(DataSource dataSource) throws SQLException {
        var sql = "select distinct original_fragment_set_id, connection_ref from mt101_rebuild_run "
                + "where status in ('BUILDING', 'BUILT', 'VALIDATED', 'ARCHIVED', 'SENT', 'PARTIALLY_SENT', 'PARTIALLY_FAILED', 'CONFIRMED')";
        var result = new ArrayList<ActiveSet>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql);
             var rs = statement.executeQuery()) {
            while (rs.next()) {
                result.add(new ActiveSet(rs.getString(1), rs.getString(2)));
            }
        }
        return result;
    }

    public record ActiveSet(String originalFragmentSetId, String connectionRef) {
    }

    /** R6: marca el instante de la ultima sincronizacion de lifecycle del run. */
    public void touchLifecycleSync(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "update mt101_rebuild_run set last_lifecycle_sync_at = current_timestamp where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.executeUpdate();
        }
    }

    /** Hash deterministico del set correctivo ARCHIVED que el maker solicita enviar. */
    public String archivedCorrectivePayloadHash(DataSource dataSource, String correctiveSetId) throws SQLException {
        var sql = """
                select encode(sha256(string_agg(senders_reference || ':' || payload_hash, '|' order by senders_reference)::bytea), 'hex') as payload_hash,
                       count(*) filter (where status = 'ARCHIVED') as archived_count,
                       count(*) as total_count
                  from mt101_build_fragment
                 where fragment_set_id = ?
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, correctiveSetId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                var archived = rs.getLong("archived_count");
                var total = rs.getLong("total_count");
                if (total == 0 || archived != total) {
                    return null;
                }
                return rs.getString("payload_hash");
            }
        }
    }

    /**
     * B2': solicita el envio del correctivo (maker) y registra la accion PAY_REQUESTED en UNA sola
     * transaccion (P0.1 v24): si falla el insert de auditoria, se revierte el cambio de pay_status. No
     * quedan estados sin evidencia ni evidencia sin estado.
     */
    public int requestPayWithAction(DataSource dataSource, String rebuildRunId, String requestedBy,
                                    String payloadHash, String configHash, String requestReason,
                                    String requestTicket, String previousStatus) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var updated = requestPay(connection, rebuildRunId, requestedBy, payloadHash, configHash,
                        requestReason, requestTicket);
                if (updated > 0) {
                    recordPayAction(connection, rebuildRunId, "PAY_REQUESTED", previousStatus, "REQUESTED",
                            requestedBy, requestReason, requestTicket, payloadHash, configHash);
                }
                connection.commit();
                return updated;
            } catch (SQLException error) {
                connection.rollback();
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        }
    }

    /**
     * v39 (atomicidad maker-checker): cambia el run a REQUESTED, persiste el hash del CONJUNTO de planes y
     * registra PAY_REQUESTED + PAY_PLAN_PREPARED en UNA sola transaccion bajo el advisory lock por run. Asi no
     * quedan estados intermedios: REQUESTED-sin-hash, hash-sin-PAY_PLAN_PREPARED, etc. Los intents/specs ya se
     * persistieron antes (idempotentes); el conjunto (planSet) se calculo sobre ellos. Devuelve filas afectadas.
     */
    /**
     * v40-bis (RESERVA EXCLUSIVA para preparar el plan): transiciona el run a PREPARING_PLAN de forma ATOMICA
     * (un solo UPDATE condicional, sin estados intermedios) desde un estado ELEGIBLE
     * (NOT_REQUESTED/FAILED/INVALIDATED) o desde una reserva CAIDA (PREPARING_PLAN cuya marca de tiempo supera la
     * ventana de obsolescencia {@code staleSeconds}). Devuelve 1 si la reserva se gana, 0 si no es elegible o si
     * otro maker ya esta preparando (reserva vigente) o hay una solicitud/despacho en curso. Como el UPDATE es
     * atomico, dos makers concurrentes NO pueden reservar a la vez: solo uno gana y prepara los specs en
     * exclusiva (los demas reciben 0). El advisory lock serializa ademas contra la cadena de acciones del run.
     */
    public int reservePayForPlanPreparation(DataSource dataSource, String rebuildRunId, int staleSeconds)
            throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'PREPARING_PLAN', "
                + "pay_plan_reserved_at = current_timestamp, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and status = 'ARCHIVED' "
                + "and (pay_status in ('NOT_REQUESTED', 'FAILED', 'INVALIDATED') "
                + "     or (pay_status = 'PREPARING_PLAN' "
                + "         and pay_plan_reserved_at < current_timestamp - make_interval(secs => ?)))";
        return inTransaction(dataSource, connection -> {
            lockRunForActionChain(connection, rebuildRunId);
            try (var statement = connection.prepareStatement(sql)) {
                statement.setString(1, rebuildRunId);
                statement.setInt(2, staleSeconds);
                return statement.executeUpdate();
            }
        });
    }

    /**
     * v40-bis: libera la RESERVA de preparacion (PREPARING_PLAN -> NOT_REQUESTED) cuando la solicitud NO llega a
     * concretarse a REQUESTED (fallo de compilacion/preparacion). Solo actua si el run sigue en PREPARING_PLAN
     * (idempotente y race-safe: si la solicitud ya concreto a REQUESTED, no toca nada). Tras liberar, el run
     * vuelve a ser re-solicitable y {@link #deleteOrphanPreparedIntents} puede limpiar specs PREPARED parciales.
     */
    public int releasePayPlanReservation(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'NOT_REQUESTED', pay_plan_reserved_at = null, "
                + "updated_at = current_timestamp where rebuild_run_id = ? and pay_status = 'PREPARING_PLAN'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    public int requestPayWithPlanSet(DataSource dataSource, String rebuildRunId, String requestedBy,
                                     String payloadHash, String configHash, String requestReason,
                                     String requestTicket, String previousStatus, PayPlanSet planSet)
            throws SQLException {
        return inTransaction(dataSource, connection -> {
            lockRunForActionChain(connection, rebuildRunId);
            var updated = requestPay(connection, rebuildRunId, requestedBy, payloadHash, configHash,
                    requestReason, requestTicket);
            if (updated == 0) {
                return 0;
            }
            try (var statement = connection.prepareStatement("update mt101_rebuild_run set pay_plan_version = ?, "
                    + "pay_plan_count = ?, pay_plan_set_hash = ?, updated_at = current_timestamp "
                    + "where rebuild_run_id = ?")) {
                statement.setString(1, planSet.version());
                statement.setInt(2, planSet.count());
                statement.setString(3, planSet.setHash());
                statement.setString(4, rebuildRunId);
                statement.executeUpdate();
            }
            recordPayAction(connection, rebuildRunId, "PAY_REQUESTED", previousStatus, "REQUESTED",
                    requestedBy, requestReason, requestTicket, payloadHash, configHash);
            recordPayAction(connection, rebuildRunId, "PAY_PLAN_PREPARED", "REQUESTED", "REQUESTED",
                    requestedBy, "compiled and persisted " + planSet.count() + " executable plan(s); set hash "
                            + planSet.setHash(), null, payloadHash, configHash);
            return updated;
        });
    }

    /**
     * v39 (Caso A): si la solicitud atómica no llega a concretarse, elimina los intents PREPARED HUÉRFANOS —
     * los que NO pertenecen a ninguna solicitud activa (run en NOT_REQUESTED/FAILED/INVALIDATED). Race-safe:
     * si una solicitud concurrente ya posee el run (REQUESTED/EXECUTING), no borra nada. Devuelve filas
     * eliminadas. Asi un request fallido no deja planes huérfanos no aprobables.
     */
    public int deleteOrphanPreparedIntents(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "delete from mt101_corrective_pay_fragment f where f.rebuild_run_id = ? "
                + "and f.pay_status = 'PREPARED' and exists (select 1 from mt101_rebuild_run r "
                + "where r.rebuild_run_id = f.rebuild_run_id "
                + "and r.pay_status in ('NOT_REQUESTED', 'FAILED', 'INVALIDATED'))";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    private int requestPay(java.sql.Connection connection, String rebuildRunId, String requestedBy,
                           String payloadHash, String configHash,
                           String requestReason, String requestTicket) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'REQUESTED', pay_requested_by = ?, "
                + "pay_requested_at = current_timestamp, pay_claimed_by = null, pay_claimed_at = null, "
                + "pay_approved_by = null, pay_approved_at = null, pay_completed_at = null, "
                + "pay_requested_payload_hash = ?, pay_claimed_payload_hash = null, "
                + "pay_requested_config_hash = ?, pay_claimed_config_hash = null, pay_lease_until = null, "
                + "pay_request_reason = ?, pay_request_ticket = ?, "
                + "pay_resolved_by = null, pay_resolved_at = null, pay_resolution_reason = null, "
                + "pay_plan_reserved_at = null, "
                + "pay_uncertain_reason = null, pay_error_message = null, updated_at = current_timestamp "
                // v40-bis: la solicitud concreta SOLO desde la reserva exclusiva (PREPARING_PLAN) que el mismo
                // maker gano antes de compilar/persistir el plan: nadie mas pudo escribir specs en el intervalo.
                + "where rebuild_run_id = ? and status = 'ARCHIVED' "
                + "and pay_status = 'PREPARING_PLAN'";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, requestedBy);
            statement.setString(2, payloadHash);
            statement.setString(3, configHash);
            statement.setString(4, blankToNull(requestReason));
            statement.setString(5, blankToNull(requestTicket));
            statement.setString(6, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    /** B2': quien solicito el envio (para la segregacion de funciones del PAY). */
    public String payRequestedBy(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select pay_requested_by from mt101_rebuild_run where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    public String payRequestedConfigHash(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select pay_requested_config_hash from mt101_rebuild_run where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    public static final String PAY_PLAN_SET_VERSION = "MT101_PAY_PLAN_SET_V1";

    /**
     * v37 fase 2: hash AGREGADO del conjunto de planes ejecutables del run, en orden canonico por
     * {@code corrective_senders_reference}, concatenando {@code reference|payload_hash|dispatch_spec_hash}.
     * Es el artefacto que el maker prepara y el checker aprueba: "plan aprobado = plan ejecutado" a nivel de
     * conjunto, no solo de configuracion equivalente.
     */
    public PayPlanSet computePayPlanSet(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select corrective_senders_reference, payload_hash, dispatch_spec_hash "
                + "from mt101_corrective_pay_fragment where rebuild_run_id = ? "
                + "order by corrective_senders_reference";
        var canonical = new StringBuilder();
        var count = 0;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    canonical.append(rs.getString(1) == null ? "" : rs.getString(1)).append('|')
                            .append(rs.getString(2) == null ? "" : rs.getString(2)).append('|')
                            .append(rs.getString(3) == null ? "" : rs.getString(3)).append('\n');
                    count++;
                }
            }
        }
        return new PayPlanSet(PAY_PLAN_SET_VERSION, count, sha256Hex(canonical.toString()));
    }

    public record PayPlanSet(String version, int count, String setHash) {
    }

    private static String sha256Hex(String value) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    /** v37 fase 2: persiste el conjunto de planes aprobable en el run (al solicitar el PAY). */
    public void persistPayPlanSet(DataSource dataSource, String rebuildRunId, PayPlanSet planSet) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_plan_version = ?, pay_plan_count = ?, pay_plan_set_hash = ?, "
                + "updated_at = current_timestamp where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, planSet.version());
            statement.setInt(2, planSet.count());
            statement.setString(3, planSet.setHash());
            statement.setString(4, rebuildRunId);
            statement.executeUpdate();
        }
    }

    public String payPlanSetHash(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select pay_plan_set_hash from mt101_rebuild_run where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    /**
     * Claim atomico REQUESTED -> EXECUTING. Solo la transaccion que gana este update
     * puede invocar el provider MT101_PAY; asi se evita doble envio concurrente.
     */
    /** P0.1 v24: ejecuta una unidad de trabajo en UNA transaccion (estado + accion auditada juntos). */
    @FunctionalInterface
    private interface TxWork<T> {
        T run(java.sql.Connection connection) throws SQLException;
    }

    private <T> T inTransaction(DataSource dataSource, TxWork<T> work) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                var result = work.run(connection);
                connection.commit();
                return result;
            } catch (SQLException error) {
                connection.rollback();
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        }
    }

    public boolean claimPayForExecution(DataSource dataSource, String rebuildRunId, String approvedBy,
                                        String payloadHash, String configHash, LocalDateTime leaseUntil) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            return claimPayForExecution(connection, rebuildRunId, approvedBy, payloadHash, configHash, leaseUntil);
        }
    }

    /** P0.1 v24: claim + accion PAY_CLAIMED en una sola transaccion (si no reclama, no registra). */
    public boolean claimPayForExecutionWithAction(DataSource dataSource, String rebuildRunId, String approvedBy,
                                                  String payloadHash, String configHash, LocalDateTime leaseUntil)
            throws SQLException {
        return inTransaction(dataSource, connection -> {
            var claimed = claimPayForExecution(connection, rebuildRunId, approvedBy, payloadHash, configHash, leaseUntil);
            if (claimed) {
                recordPayAction(connection, rebuildRunId, "PAY_CLAIMED", "REQUESTED", "EXECUTING",
                        approvedBy, null, null, payloadHash, configHash);
            }
            return claimed;
        });
    }

    private boolean claimPayForExecution(java.sql.Connection connection, String rebuildRunId, String approvedBy,
                                         String payloadHash, String configHash, LocalDateTime leaseUntil) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'EXECUTING', pay_claimed_by = ?, "
                + "pay_claimed_at = current_timestamp, pay_approved_by = ?, pay_approved_at = current_timestamp, "
                + "pay_claimed_payload_hash = ?, pay_claimed_config_hash = ?, pay_lease_until = ?, "
                + "updated_at = current_timestamp "
                + "where rebuild_run_id = ? and status = 'ARCHIVED' and pay_status = 'REQUESTED' "
                + "and pay_requested_by is not null and pay_requested_by <> ? "
                + "and pay_requested_payload_hash = ? and pay_requested_config_hash = ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, approvedBy);
            statement.setString(2, approvedBy);
            statement.setString(3, payloadHash);
            statement.setString(4, configHash);
            statement.setObject(5, leaseUntil);
            statement.setString(6, rebuildRunId);
            statement.setString(7, approvedBy);
            statement.setString(8, payloadHash);
            statement.setString(9, configHash);
            return statement.executeUpdate() == 1;
        }
    }

    /** P0.1 v24: invalida la solicitud + accion PAY_INVALIDATED en una sola transaccion. */
    public int invalidatePayRequestWithAction(DataSource dataSource, String rebuildRunId, String reason,
                                              String actor, String previousStatus, String payloadHash,
                                              String configHash) throws SQLException {
        return inTransaction(dataSource, connection -> {
            var invalidated = invalidatePayRequest(connection, rebuildRunId, reason);
            if (invalidated > 0) {
                recordPayAction(connection, rebuildRunId, "PAY_INVALIDATED", previousStatus, "INVALIDATED",
                        actor, reason, null, payloadHash, configHash);
            }
            return invalidated;
        });
    }

    public int invalidatePayRequest(DataSource dataSource, String rebuildRunId, String reason) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            return invalidatePayRequest(connection, rebuildRunId, reason);
        }
    }

    private int invalidatePayRequest(java.sql.Connection connection, String rebuildRunId, String reason) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'INVALIDATED', pay_error_message = ?, "
                + "pay_completed_at = current_timestamp, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and pay_status = 'REQUESTED'";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, reason);
            statement.setString(2, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    /**
     * P0.1 v24: marca el resultado terminal del PAY (SENT/PARTIALLY_SENT/FAILED) y registra su accion en
     * UNA sola transaccion. El tipo de accion se deriva del estado: SENT->PAY_SENT, PARTIALLY_SENT->
     * PAY_PARTIALLY_SENT, FAILED->PAY_REJECTED.
     */
    public void markPayCompletedWithAction(DataSource dataSource, String rebuildRunId, String payStatus,
                                           String errorMessage, String actor, String actionReason,
                                           String payloadHash, String configHash) throws SQLException {
        var actionType = switch (payStatus) {
            case "SENT" -> "PAY_SENT";
            case "PARTIALLY_SENT" -> "PAY_PARTIALLY_SENT";
            case "INVALIDATED" -> "PAY_INVALIDATED";
            default -> "PAY_REJECTED";
        };
        inTransaction(dataSource, connection -> {
            var updated = markPayCompleted(connection, rebuildRunId, payStatus, errorMessage);
            if (updated > 0) {
                recordPayAction(connection, rebuildRunId, actionType, "EXECUTING", payStatus,
                        actor, actionReason, null, payloadHash, configHash);
            }
            return null;
        });
    }

    /** B2': registra que el PAY correctivo ejecuto sin error local. */
    public void markPaySent(DataSource dataSource, String rebuildRunId) throws SQLException {
        markPayCompleted(dataSource, rebuildRunId, "SENT", null);
    }

    /** B2': registra resultado global del PAY correctivo. */
    public void markPayCompleted(DataSource dataSource, String rebuildRunId, String payStatus,
                                 String errorMessage) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            markPayCompleted(connection, rebuildRunId, payStatus, errorMessage);
        }
    }

    private int markPayCompleted(java.sql.Connection connection, String rebuildRunId, String payStatus,
                                 String errorMessage) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = ?, pay_completed_at = current_timestamp, "
                + "pay_lease_until = null, pay_error_message = ?, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and pay_status = 'EXECUTING'";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, payStatus);
            statement.setString(2, errorMessage);
            statement.setString(3, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    /**
     * P2 v20: resultado de MT101_STATUS tras un PAY ya enviado. Estado separado de pay_status:
     * un fallo de la consulta posterior NO revierte el pago, solo da visibilidad operativa.
     */
    public void markStatusSync(DataSource dataSource, String rebuildRunId, String status, String error) throws SQLException {
        var sql = "update mt101_rebuild_run set status_sync_status = ?, status_sync_error = ?, "
                + "updated_at = current_timestamp where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setString(2, error);
            statement.setString(3, rebuildRunId);
            statement.executeUpdate();
        }
    }

    /** P2 v20: resultado de MT101_RECONCILE tras un PAY ya enviado (no revierte el pago). */
    public void markReconciliation(DataSource dataSource, String rebuildRunId, String status, String error) throws SQLException {
        var sql = "update mt101_rebuild_run set reconciliation_status = ?, reconciliation_error = ?, "
                + "updated_at = current_timestamp where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setString(2, error);
            statement.setString(3, rebuildRunId);
            statement.executeUpdate();
        }
    }

    /** P2 v20: estados de sincronizacion post-PAY (STATUS/RECONCILE) para visibilidad operativa. */
    public PayStageSync payStageSync(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select status_sync_status, reconciliation_status from mt101_rebuild_run where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return new PayStageSync("PENDING", "PENDING");
                }
                return new PayStageSync(rs.getString("status_sync_status"), rs.getString("reconciliation_status"));
            }
        }
    }

    public record PayStageSync(String statusSyncStatus, String reconciliationStatus) {
    }

    /**
     * P0.2 v21: true si algun fragmento del run ya fue despachado (DISPATCHING/SENT/UNCERTAIN).
     * Tras un fallo, si esto es true NO se debe marcar el PAY FAILED (reusable -> doble pago):
     * el mensaje pudo llegar al banco; corresponde UNCERTAIN para conciliacion.
     */
    public boolean hasDispatchedPayFragments(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select 1 from mt101_corrective_pay_fragment where rebuild_run_id = ? "
                + "and pay_status in ('DISPATCHING', 'SENT', 'UNCERTAIN') limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next();
            }
        }
    }

    /** B2': registra fallo de PAY; el operador debe solicitar de nuevo si corresponde. */
    public void markPayFailed(DataSource dataSource, String rebuildRunId, String errorMessage) throws SQLException {
        markPayCompleted(dataSource, rebuildRunId, "FAILED", errorMessage);
    }

    /**
     * v23: registra una accion del ciclo PAY en el historial INMUTABLE {@code mt101_corrective_pay_action}.
     * Append-only: nunca actualiza ni borra; cada transicion deja un rastro durable independiente de la
     * fila (mutable) de {@code mt101_rebuild_run}.
     */
    public void recordPayAction(DataSource dataSource, String rebuildRunId, String actionType,
                                String previousStatus, String newStatus, String actor,
                                String reason, String ticket, String payloadHash, String configHash)
            throws SQLException {
        // v26: en transaccion para que el advisory lock de la cadena (xact) sea efectivo.
        inTransaction(dataSource, connection -> {
            recordPayAction(connection, rebuildRunId, actionType, previousStatus, newStatus, actor,
                    reason, ticket, payloadHash, configHash);
            return null;
        });
    }

    /** Variante transaccional: inserta la accion en la conexion dada (misma tx que el cambio de estado). */
    private void recordPayAction(java.sql.Connection connection, String rebuildRunId, String actionType,
                                 String previousStatus, String newStatus, String actor,
                                 String reason, String ticket, String payloadHash, String configHash)
            throws SQLException {
        // v25: cadena criptografica. previous_action_hash = hash de la accion anterior del run;
        // action_hash = sha256(previous | campos). Alterar/borrar/insertar una fila rompe la cadena.
        // v26: lock advisory por rebuild_run_id (mismo xact) para SERIALIZAR los inserts del run: dos
        // transacciones concurrentes (scheduler/aprobacion/resolucion) no pueden leer el mismo hash
        // previo ni bifurcar la cadena. El lock se libera al commit/rollback de la transaccion.
        lockRunForActionChain(connection, rebuildRunId);
        var storedReason = blankToNull(reason);
        var storedTicket = blankToNull(ticket);
        var previousHash = lastActionHash(connection, rebuildRunId);
        var createdAt = LocalDateTime.now();
        var actionHash = actionChainHash(previousHash, rebuildRunId, actionType, previousStatus, newStatus,
                actor, storedReason, storedTicket, payloadHash, configHash, createdAt);
        var sql = "insert into mt101_corrective_pay_action "
                + "(rebuild_run_id, action_type, previous_status, new_status, actor, reason, ticket, "
                + "payload_hash, config_hash, previous_action_hash, action_hash, created_at) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, actionType);
            statement.setString(3, previousStatus);
            statement.setString(4, newStatus);
            statement.setString(5, actor);
            statement.setString(6, storedReason);
            statement.setString(7, storedTicket);
            statement.setString(8, payloadHash);
            statement.setString(9, configHash);
            statement.setString(10, previousHash);
            statement.setString(11, actionHash);
            statement.setObject(12, createdAt);
            statement.executeUpdate();
        }
    }

    /** v26: lock advisory transaccional por run (namespace 0x504159 = "PAY") para serializar la cadena. */
    private void lockRunForActionChain(java.sql.Connection connection, String rebuildRunId) throws SQLException {
        try (var statement = connection.prepareStatement("select pg_advisory_xact_lock(5259865, hashtext(?))")) {
            statement.setString(1, rebuildRunId);
            statement.executeQuery().close();
        }
    }

    private String lastActionHash(java.sql.Connection connection, String rebuildRunId) throws SQLException {
        var sql = "select action_hash from mt101_corrective_pay_action where rebuild_run_id = ? "
                + "order by id desc limit 1";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    /** v25: hash encadenado de una accion = sha256(previous | campos canonicos de la fila). */
    private String actionChainHash(String previousHash, String rebuildRunId, String actionType,
                                   String previousStatus, String newStatus, String actor, String reason,
                                   String ticket, String payloadHash, String configHash, LocalDateTime createdAt) {
        var canonical = String.join("|",
                previousHash == null ? "GENESIS" : previousHash,
                nz(rebuildRunId), nz(actionType), nz(previousStatus), nz(newStatus), nz(actor),
                nz(reason), nz(ticket), nz(payloadHash), nz(configHash),
                createdAt == null ? "" : createdAt.toString());
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(canonical.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    private static String nz(String value) {
        return value == null ? "" : value;
    }

    /**
     * v23: congela un snapshot (JSON) de la config de MT101_STATUS en el momento del PAY, para que la
     * resolucion diferida de un PAY_UNCERTAIN consulte el perfil usado al enviar, no la config vigente.
     */
    public void freezePayStatusConfig(DataSource dataSource, String rebuildRunId, String snapshotJson)
            throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status_config_snapshot = ?, updated_at = current_timestamp "
                + "where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, snapshotJson);
            statement.setString(2, rebuildRunId);
            statement.executeUpdate();
        }
    }

    /** v23: snapshot congelado de la config de MT101_STATUS, o {@code null} si no se congelo. */
    public String payStatusConfigSnapshot(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select pay_status_config_snapshot from mt101_rebuild_run where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    /** v26 #4: congela el snapshot (JSON redactado) de la config de MT101_RECONCILE en el momento del PAY. */
    public void freezePayReconcileConfig(DataSource dataSource, String rebuildRunId, String snapshotJson)
            throws SQLException {
        var sql = "update mt101_rebuild_run set pay_reconcile_config_snapshot = ?, updated_at = current_timestamp "
                + "where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, snapshotJson);
            statement.setString(2, rebuildRunId);
            statement.executeUpdate();
        }
    }

    /** v26 #4: snapshot congelado de la config de MT101_RECONCILE, o {@code null} si no se congelo. */
    public String payReconcileConfigSnapshot(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select pay_reconcile_config_snapshot from mt101_rebuild_run where rebuild_run_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    /** v24: historial append-only completo de acciones PAY de un run (orden cronologico). */
    public List<PayAction> payActions(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select action_type, previous_status, new_status, actor, reason, ticket, "
                + "payload_hash, config_hash, previous_action_hash, action_hash, created_at "
                + "from mt101_corrective_pay_action where rebuild_run_id = ? order by id";
        var result = new ArrayList<PayAction>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new PayAction(
                            rs.getString("action_type"),
                            rs.getString("previous_status"),
                            rs.getString("new_status"),
                            rs.getString("actor"),
                            rs.getString("reason"),
                            rs.getString("ticket"),
                            rs.getString("payload_hash"),
                            rs.getString("config_hash"),
                            rs.getString("previous_action_hash"),
                            rs.getString("action_hash"),
                            timestamp(rs, "created_at")));
                }
            }
        }
        return result;
    }

    public record PayAction(String actionType, String previousStatus, String newStatus,
                            String actor, String reason, String ticket,
                            String payloadHash, String configHash,
                            String previousActionHash, String actionHash, LocalDateTime createdAt) {
    }

    /** P0.1 v24: PAY incierto + accion PAY_UNCERTAIN en una sola transaccion. */
    public void markPayUncertainWithAction(DataSource dataSource, String rebuildRunId, String reason,
                                           String actor, String payloadHash, String configHash) throws SQLException {
        inTransaction(dataSource, connection -> {
            var updated = markPayUncertain(connection, rebuildRunId, reason);
            if (updated > 0) {
                recordPayAction(connection, rebuildRunId, "PAY_UNCERTAIN", "EXECUTING", "UNCERTAIN",
                        actor, reason, null, payloadHash, configHash);
            }
            return null;
        });
    }

    /** B2': PAY incierto; no se reintenta automaticamente para evitar doble envio. */
    public void markPayUncertain(DataSource dataSource, String rebuildRunId, String reason) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            markPayUncertain(connection, rebuildRunId, reason);
        }
    }

    private int markPayUncertain(java.sql.Connection connection, String rebuildRunId, String reason) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'UNCERTAIN', pay_uncertain_reason = ?, "
                + "pay_error_message = ?, pay_completed_at = current_timestamp, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and pay_status = 'EXECUTING'";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, reason);
            statement.setString(2, reason);
            statement.setString(3, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    /** P0.1 v24: resolucion del PAY incierto + accion PAY_RESOLVED en una sola transaccion. */
    public void markPayResolutionWithAction(DataSource dataSource, String rebuildRunId, String payStatus,
                                            String reason, String resolvedBy) throws SQLException {
        var normalized = payStatus == null ? "UNCERTAIN" : payStatus.trim().toUpperCase(Locale.ROOT);
        inTransaction(dataSource, connection -> {
            var updated = markPayResolution(connection, rebuildRunId, normalized, reason, resolvedBy);
            if (updated > 0) {
                recordPayAction(connection, rebuildRunId, "PAY_RESOLVED", "UNCERTAIN", normalized,
                        resolvedBy, reason, null, null, null);
            }
            return null;
        });
    }

    public void markPayResolution(DataSource dataSource, String rebuildRunId, String payStatus,
                                  String reason, String resolvedBy) throws SQLException {
        var normalized = payStatus == null ? "UNCERTAIN" : payStatus.trim().toUpperCase(Locale.ROOT);
        try (var connection = dataSource.getConnection()) {
            markPayResolution(connection, rebuildRunId, normalized, reason, resolvedBy);
        }
    }

    private int markPayResolution(java.sql.Connection connection, String rebuildRunId, String normalized,
                                  String reason, String resolvedBy) throws SQLException {
        // v22: evidencia durable de la resolucion del PAY incierto (actor/fecha/motivo).
        var sql = """
                update mt101_rebuild_run
                   set pay_status = ?,
                       pay_completed_at = current_timestamp,
                       pay_lease_until = null,
                       pay_uncertain_reason = case when ? = 'UNCERTAIN' then ? else null end,
                       pay_error_message = ?,
                       pay_resolved_by = ?,
                       pay_resolved_at = current_timestamp,
                       pay_resolution_reason = ?,
                       updated_at = current_timestamp
                 where rebuild_run_id = ?
                   and pay_status in ('UNCERTAIN', 'EXECUTING', 'PARTIALLY_SENT', 'FAILED')
                """;
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, normalized);
            statement.setString(2, normalized);
            statement.setString(3, reason);
            statement.setString(4, reason);
            statement.setString(5, resolvedBy);
            statement.setString(6, reason);
            statement.setString(7, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    /**
     * v29: aceptacion TARDIA tras vencer el lease. Si el lease vencio durante {@code Transport.send()} y el
     * scheduler marco el run UNCERTAIN (y el/los fragmento(s) DISPATCHING->UNCERTAIN), pero el envio fue
     * finalmente ACEPTADO y TODOS los fragmentos quedaron SENT, se RESUELVE el run UNCERTAIN->SENT con una
     * accion PAY_RESOLVED append-only y SIN reenviar (el banco ya recibio). Si queda algun fragmento no-SENT
     * (DISPATCHING/UNCERTAIN/...), se MANTIENE UNCERTAIN para conciliar por MT101_STATUS. Serializado con el
     * scheduler por el MISMO advisory lock por run -> determinista. Devuelve 1 si resolvio; 0 si no aplica.
     */
    public int resolveLateAcceptedPayRun(DataSource dataSource, String rebuildRunId, String actor) throws SQLException {
        return inTransaction(dataSource, connection -> {
            // Mismo advisory lock por run que el scheduler de lease: la resolucion tardia no se solapa con
            // una clasificacion de lease en curso (lectura del run + de los fragmentos consistente).
            lockRunForActionChain(connection, rebuildRunId);
            // Solo aplica si el scheduler dejo el run UNCERTAIN; no toca runs terminales del flujo normal.
            if (!"UNCERTAIN".equals(currentPayStatus(connection, rebuildRunId))) {
                return 0;
            }
            long total = 0;
            long sent = 0;
            long conflicts = 0;
            try (var statement = connection.prepareStatement(
                    "select count(*) total, count(*) filter (where pay_status = 'SENT') sent, "
                            + "count(*) filter (where pay_conflict) conflicts "
                            + "from mt101_corrective_pay_fragment where rebuild_run_id = ?")) {
                statement.setString(1, rebuildRunId);
                try (var rs = statement.executeQuery()) {
                    if (rs.next()) {
                        total = rs.getLong("total");
                        sent = rs.getLong("sent");
                        conflicts = rs.getLong("conflicts");
                    }
                }
            }
            // Regla v29: solo se auto-resuelve a SENT si TODOS los fragmentos quedaron SENT; cualquier
            // fragmento pendiente mantiene el run UNCERTAIN (conciliar por STATUS, sin reenvio ciego).
            // v36: ademas, NUNCA se auto-resuelve si hay un fragmento en conflicto (pay_conflict=true): un
            // PAY_CONFLICT exige conciliacion MANUAL; un STATUS/RECONCILE contradictorio no debe auto-cerrarse.
            if (total == 0 || sent != total || conflicts > 0) {
                return 0;
            }
            var reason = "late acceptance after lease expiry: all " + total
                    + " fragment(s) confirmed SENT; run resolved without resend";
            var sql = "update mt101_rebuild_run set pay_status = 'SENT', pay_uncertain_reason = null, "
                    + "pay_completed_at = current_timestamp, pay_lease_until = null, "
                    + "pay_resolved_by = ?, pay_resolved_at = current_timestamp, pay_resolution_reason = ?, "
                    + "updated_at = current_timestamp where rebuild_run_id = ? and pay_status = 'UNCERTAIN'";
            int updated;
            try (var statement = connection.prepareStatement(sql)) {
                statement.setString(1, actor);
                statement.setString(2, reason);
                statement.setString(3, rebuildRunId);
                updated = statement.executeUpdate();
            }
            if (updated == 0) {
                return 0;
            }
            recordPayAction(connection, rebuildRunId, "PAY_RESOLVED", "UNCERTAIN", "SENT",
                    actor, reason, null, null, null);
            return 1;
        });
    }

    private String currentPayStatus(java.sql.Connection connection, String rebuildRunId) throws SQLException {
        try (var statement = connection.prepareStatement(
                "select pay_status from mt101_rebuild_run where rebuild_run_id = ?")) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private static final String LEASE_SCHEDULER_ACTOR = "system:pay-lease-scheduler";

    /**
     * P0.1+P0.2 v25: resuelve los leases de PAY vencidos. Cada run se procesa en UNA transaccion
     * (estado + fragmentos + accion append-only del scheduler), y se DISTINGUE "no iniciado" de
     * "realmente incierto":
     *  - si algun fragmento ya se despacho (DISPATCHING/SENT/UNCERTAIN) -> run UNCERTAIN (solo
     *    STATUS/conciliacion, el banco pudo recibir).
     *  - si NO se despacho nada (cayo entre el claim y el primer envio) -> run INVALIDATED, re-solicitable
     *    (no hubo llamada al banco). Sin fallback: no todo EXECUTING se vuelve UNCERTAIN a ciegas.
     */
    public int markExpiredPayExecutionsUncertain(DataSource dataSource, LocalDateTime now) throws SQLException {
        var ids = new ArrayList<String>();
        var selectSql = "select rebuild_run_id from mt101_rebuild_run where pay_status = 'EXECUTING' "
                + "and pay_lease_until is not null and pay_lease_until < ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(selectSql)) {
            statement.setObject(1, now);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getString(1));
                }
            }
        }
        var processed = 0;
        for (var id : ids) {
            processed += inTransaction(dataSource, connection -> resolveExpiredPayLease(connection, id, now));
        }
        return processed;
    }

    private int resolveExpiredPayLease(java.sql.Connection connection, String rebuildRunId, LocalDateTime now)
            throws SQLException {
        // v27 P0.1: mismo advisory lock por run que el claim del dispatcher -> serializa scheduler<->dispatcher.
        lockRunForActionChain(connection, rebuildRunId);
        var dispatched = hasDispatchedPayFragments(connection, rebuildRunId);
        var newStatus = dispatched ? "UNCERTAIN" : "INVALIDATED";
        var actionType = dispatched ? "PAY_UNCERTAIN" : "PAY_INVALIDATED";
        var reason = dispatched
                ? "PAY lease expired after dispatch; reconcile with MT101_STATUS before any retry"
                : "PAY lease expired before any dispatch; no bank call made; re-requestable";
        var updated = updateRunPayStatusOnLeaseExpiry(connection, rebuildRunId, now, newStatus, reason);
        if (updated == 0) {
            return 0;
        }
        markPayFragmentsOnLeaseExpiry(connection, rebuildRunId, newStatus, reason);
        recordPayAction(connection, rebuildRunId, actionType, "EXECUTING", newStatus,
                LEASE_SCHEDULER_ACTOR, reason, null, null, null);
        return 1;
    }

    private boolean hasDispatchedPayFragments(java.sql.Connection connection, String rebuildRunId) throws SQLException {
        var sql = "select 1 from mt101_corrective_pay_fragment where rebuild_run_id = ? "
                + "and pay_status in ('DISPATCHING', 'SENT', 'UNCERTAIN') limit 1";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                return rs.next();
            }
        }
    }

    private int updateRunPayStatusOnLeaseExpiry(java.sql.Connection connection, String rebuildRunId,
                                                LocalDateTime now, String newStatus, String reason) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = ?, "
                + "pay_uncertain_reason = case when ? = 'UNCERTAIN' then ? else null end, "
                + "pay_error_message = ?, pay_completed_at = current_timestamp, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and pay_status = 'EXECUTING' "
                + "and pay_lease_until is not null and pay_lease_until < ?";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, newStatus);
            statement.setString(2, newStatus);
            statement.setString(3, reason);
            statement.setString(4, reason);
            statement.setString(5, rebuildRunId);
            statement.setObject(6, now);
            return statement.executeUpdate();
        }
    }

    private void markPayFragmentsOnLeaseExpiry(java.sql.Connection connection, String rebuildRunId,
                                               String newStatus, String reason) throws SQLException {
        // UNCERTAIN: PREPARED/DISPATCHING -> UNCERTAIN. INVALIDATED: solo PREPARED -> INVALIDATED.
        var fromStatuses = "UNCERTAIN".equals(newStatus) ? "('PREPARED', 'DISPATCHING')" : "('PREPARED')";
        var sql = "update mt101_corrective_pay_fragment set pay_status = ?, error_message = ?, "
                + "updated_at = current_timestamp where rebuild_run_id = ? and pay_status in " + fromStatuses;
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, newStatus);
            statement.setString(2, reason);
            statement.setString(3, rebuildRunId);
            statement.executeUpdate();
        }
    }

    /** Refresca el detalle durable de PAY por fragmento correctivo completo. */
    public int refreshPayFragmentsFromCorrectiveSet(DataSource dataSource, String rebuildRunId,
                                                    String correctiveSetId) throws SQLException {
        var sql = """
                insert into mt101_corrective_pay_fragment
                    (rebuild_run_id, corrective_set_id, corrective_senders_reference,
                     source_file_hash, source_record_number, staging_id,
                     payload_hash, idempotency_key, pay_status, error_message)
                select ?, f.fragment_set_id, f.senders_reference,
                       min(sel.source_file_hash),
                       min(sel.source_record_number),
                       min(sel.staging_id),
                       f.payload_hash,
                       f.senders_reference,
                       case
                           when f.status = 'SENT' then 'SENT'
                           when f.status = 'REJECTED' then 'REJECTED'
                           else f.status
                       end,
                       max(f.error_message)
                  from mt101_build_fragment f
                  left join mt101_rebuild_selection sel
                    on sel.rebuild_run_id = ?
                   and sel.corrective_senders_reference = f.senders_reference
                 where f.fragment_set_id = ?
                 group by f.fragment_set_id, f.senders_reference, f.payload_hash, f.status
                on conflict (rebuild_run_id, corrective_senders_reference) do update
                    set pay_status = excluded.pay_status,
                        error_message = excluded.error_message,
                        payload_hash = excluded.payload_hash,
                        updated_at = current_timestamp
                    where mt101_corrective_pay_fragment.pay_status
                          not in ('DISPATCHING', 'SENT', 'REJECTED', 'UNCERTAIN', 'INVALIDATED')
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, rebuildRunId);
            statement.setString(3, correctiveSetId);
            return statement.executeUpdate();
        }
    }

    /** Inserta la intencion durable antes de invocar el gateway de PAY. */
    public int preparePayIntents(DataSource dataSource, String rebuildRunId,
                                 Collection<PayFragmentIntent> intents) throws SQLException {
        if (intents == null || intents.isEmpty()) {
            return 0;
        }
        var sql = """
                insert into mt101_corrective_pay_fragment
                    (rebuild_run_id, corrective_set_id, corrective_senders_reference,
                     source_file_hash, source_record_number, staging_id,
                     payload_hash, idempotency_key, transport, endpoint_ref, approved_routed_as,
                     dispatch_destination, dispatch_plan_hash,
                     dispatch_spec_version, dispatch_spec_json, dispatch_spec_hash,
                     pay_status, attempts, prepared_at, error_message)
                select ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PREPARED', 0, current_timestamp, null
                where exists (select 1 from mt101_rebuild_run r where r.rebuild_run_id = ?
                              and r.pay_status = 'PREPARING_PLAN')
                on conflict (rebuild_run_id, corrective_senders_reference) do update
                    set payload_hash = excluded.payload_hash,
                        idempotency_key = excluded.idempotency_key,
                        transport = excluded.transport,
                        endpoint_ref = excluded.endpoint_ref,
                        approved_routed_as = excluded.approved_routed_as,
                        dispatch_destination = excluded.dispatch_destination,
                        dispatch_plan_hash = excluded.dispatch_plan_hash,
                        dispatch_spec_version = excluded.dispatch_spec_version,
                        dispatch_spec_json = excluded.dispatch_spec_json,
                        dispatch_spec_hash = excluded.dispatch_spec_hash,
                        pay_status = 'PREPARED',
                        attempts = 0,
                        prepared_at = current_timestamp,
                        error_message = null,
                        updated_at = current_timestamp
                    where mt101_corrective_pay_fragment.pay_status
                          not in ('DISPATCHING', 'SENT', 'REJECTED', 'UNCERTAIN', 'INVALIDATED')
                """;
        var updated = 0;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var intent : intents) {
                statement.setString(1, rebuildRunId);
                statement.setString(2, intent.correctiveSetId());
                statement.setString(3, intent.correctiveSendersReference());
                statement.setString(4, intent.sourceFileHash());
                if (intent.sourceRecordNumber() == null) {
                    statement.setNull(5, java.sql.Types.BIGINT);
                } else {
                    statement.setLong(5, intent.sourceRecordNumber());
                }
                if (intent.stagingId() == null) {
                    statement.setNull(6, java.sql.Types.BIGINT);
                } else {
                    statement.setLong(6, intent.stagingId());
                }
                statement.setString(7, intent.payloadHash());
                statement.setString(8, intent.idempotencyKey());
                statement.setString(9, intent.transport());
                statement.setString(10, intent.endpointRef());
                statement.setString(11, intent.approvedRoutedAs());
                statement.setString(12, intent.dispatchDestination());
                statement.setString(13, intent.dispatchPlanHash());
                statement.setString(14, intent.dispatchSpecVersion());
                statement.setString(15, intent.dispatchSpecJson());
                statement.setString(16, intent.dispatchSpecHash());
                // v40-bis: el upsert SOLO escribe si el run esta RESERVADO por este maker (PREPARING_PLAN):
                // impide que una segunda solicitud reescriba specs de un plan REQUESTED/EXECUTING y que dos makers
                // concurrentes mezclen specs (solo uno gana la reserva exclusiva antes de compilar).
                statement.setString(17, rebuildRunId);
                statement.addBatch();
                updated++;
            }
            statement.executeBatch();
        }
        return updated;
    }

    /**
     * Marca un fragmento como DISPATCHING justo antes de invocar el transporte externo. P0.2 v24: el
     * claim exige que el {@code payload_hash} y {@code routed_as} ACTUALES coincidan con los aprobados
     * en el ledger (plan por fragmento inmutable): solo despacha lo aprobado, sin re-resolver dinamico.
     */
    public int markPayFragmentDispatching(DataSource dataSource,
                                          String rebuildRunId,
                                          String correctiveSendersReference,
                                          String currentPayloadHash,
                                          String currentRoutedAs,
                                          String currentPlanHash) throws SQLException {
        return markPayFragmentDispatching(dataSource, rebuildRunId, correctiveSendersReference,
                currentPayloadHash, currentRoutedAs, currentPlanHash, null);
    }

    public int markPayFragmentDispatching(DataSource dataSource,
                                          String rebuildRunId,
                                          String correctiveSendersReference,
                                          String currentPayloadHash,
                                          String currentRoutedAs,
                                          String currentPlanHash,
                                          String expectedDispatchSpecHash) throws SQLException {
        return markPayFragmentDispatching(dataSource, rebuildRunId, correctiveSendersReference,
                currentPayloadHash, currentRoutedAs, currentPlanHash, expectedDispatchSpecHash, null);
    }

    public int markPayFragmentDispatching(DataSource dataSource,
                                          String rebuildRunId,
                                          String correctiveSendersReference,
                                          String currentPayloadHash,
                                          String currentRoutedAs,
                                          String currentPlanHash,
                                          String expectedDispatchSpecHash,
                                          String expectedDispatchSpecJson) throws SQLException {
        // v26: el claim valida el PLAN COMPLETO aprobado: payload_hash + routed_as + dispatch_plan_hash
        // (transport|ruta|destino|correlacion|payload). "Plan aprobado = plan usado", demostrable.
        // v27 P0.1: ademas valida el RUN padre en el MISMO update atomico: solo despacha si el run sigue
        // EXECUTING y el lease no vencio. Como el scheduler solo invalida/marca-incierto leases VENCIDOS,
        // las ventanas son disjuntas: ningun fragmento puede ir a DISPATCHING tras vencer el lease ni
        // despues de que el scheduler invalide el run (no hay carrera scheduler<->dispatcher).
        // v37 (P0.2): enlaza ATOMICAMENTE el dispatch_spec_hash. v38: enlaza ademas el dispatch_spec_json EXACTO
        // (no solo su hash): el ledger no pudo cambiar entre la lectura y el claim ni siquiera con un hash igual.
        var specBinding = (expectedDispatchSpecHash == null ? ""
                : " and f.dispatch_spec_hash is not distinct from ?")
                + (expectedDispatchSpecJson == null ? ""
                : " and f.dispatch_spec_json is not distinct from ?");
        var sql = """
                update mt101_corrective_pay_fragment f
                   set pay_status = 'DISPATCHING',
                       attempts = attempts + 1,
                       dispatched_at = current_timestamp,
                       updated_at = current_timestamp
                  from mt101_rebuild_run r
                 where f.rebuild_run_id = r.rebuild_run_id
                   and f.rebuild_run_id = ?
                   and f.corrective_senders_reference = ?
                   and f.pay_status = 'PREPARED'
                   and f.payload_hash = ?
                   and f.approved_routed_as is not distinct from ?
                   and f.dispatch_plan_hash is not distinct from ?
                   and r.pay_status = 'EXECUTING'
                   and r.pay_lease_until is not null
                   and r.pay_lease_until > current_timestamp
                """ + specBinding;
        return inTransaction(dataSource, connection -> {
            // v27 P0.1: mismo advisory lock por run que el scheduler -> claim y resolucion de lease son
            // mutuamente exclusivos (ni el limite exacto del lease puede producir DISPATCHING + run invalidado).
            lockRunForActionChain(connection, rebuildRunId);
            try (var statement = connection.prepareStatement(sql)) {
                statement.setString(1, rebuildRunId);
                statement.setString(2, correctiveSendersReference);
                statement.setString(3, currentPayloadHash);
                statement.setString(4, currentRoutedAs);
                statement.setString(5, currentPlanHash);
                var index = 6;
                if (expectedDispatchSpecHash != null) {
                    statement.setString(index++, expectedDispatchSpecHash);
                }
                if (expectedDispatchSpecJson != null) {
                    statement.setString(index, expectedDispatchSpecJson);
                }
                return statement.executeUpdate();
            }
        });
    }

    /**
     * v38: un fragmento ya RECLAMADO (DISPATCHING) cuya MATERIALIZACION falla ANTES del envio (p.ej. fallo de
     * Vault al re-resolver secretos, o version de spec invalida) NO llamo al banco -> se marca INVALIDATED
     * (re-solicitable), nunca UNCERTAIN ni se exige STATUS. Sin pago, sin doble pago, sin run colgado.
     */
    public int invalidatePayFragmentMaterializeFailure(DataSource dataSource, String rebuildRunId,
                                                       String correctiveSendersReference, String reason) throws SQLException {
        var sql = "update mt101_corrective_pay_fragment set pay_status = 'INVALIDATED', error_message = ?, "
                + "updated_at = current_timestamp where rebuild_run_id = ? and corrective_senders_reference = ? "
                + "and pay_status = 'DISPATCHING'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, reason);
            statement.setString(2, rebuildRunId);
            statement.setString(3, correctiveSendersReference);
            return statement.executeUpdate();
        }
    }

    /** v37 (P0.2): la spec persistida no coincide con su hash (manipulada): INVALIDA y no se llama al banco. */
    public int invalidatePayFragmentTamperedSpec(DataSource dataSource, String rebuildRunId,
                                                 String correctiveSendersReference) throws SQLException {
        var sql = "update mt101_corrective_pay_fragment set pay_status = 'INVALIDATED', "
                + "error_message = 'persisted dispatch spec does not match its hash (tampered); not dispatched', "
                + "updated_at = current_timestamp where rebuild_run_id = ? and corrective_senders_reference = ? "
                + "and pay_status = 'PREPARED'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, correctiveSendersReference);
            return statement.executeUpdate();
        }
    }

    /**
     * P0.2 v24+v26: si una intencion PREPARED ya no coincide con el plan aprobado (payload, ruta o el
     * plan_hash completo cambiados tras el claim), se marca INVALIDATED y NO se envia. Devuelve 1 si
     * invalido (drift detectado).
     */
    public int invalidatePayFragmentOnPlanDrift(DataSource dataSource,
                                                String rebuildRunId,
                                                String correctiveSendersReference,
                                                String currentPayloadHash,
                                                String currentRoutedAs,
                                                String currentPlanHash) throws SQLException {
        var sql = """
                update mt101_corrective_pay_fragment
                   set pay_status = 'INVALIDATED',
                       error_message = 'payload, route or dispatch plan changed after approval; not dispatched',
                       updated_at = current_timestamp
                 where rebuild_run_id = ?
                   and corrective_senders_reference = ?
                   and pay_status = 'PREPARED'
                   and (payload_hash <> ? or approved_routed_as is distinct from ?
                        or dispatch_plan_hash is distinct from ?)
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, correctiveSendersReference);
            statement.setString(3, currentPayloadHash);
            statement.setString(4, currentRoutedAs);
            statement.setString(5, currentPlanHash);
            return statement.executeUpdate();
        }
    }

    /** v37: lee la especificacion ejecutable persistida (contrato de despacho) de un fragmento PREPARED. */
    public PreparedDispatchSpec readPreparedDispatchSpec(DataSource dataSource, String rebuildRunId,
                                                         String correctiveSendersReference) throws SQLException {
        var sql = "select dispatch_spec_json, dispatch_spec_hash, approved_routed_as, payload_hash, dispatch_plan_hash "
                + "from mt101_corrective_pay_fragment where rebuild_run_id = ? and corrective_senders_reference = ? "
                + "and pay_status = 'PREPARED'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, correctiveSendersReference);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new PreparedDispatchSpec(rs.getString("dispatch_spec_json"), rs.getString("dispatch_spec_hash"),
                        rs.getString("approved_routed_as"), rs.getString("payload_hash"),
                        rs.getString("dispatch_plan_hash"));
            }
        }
    }

    public record PreparedDispatchSpec(String specJson, String specHash, String approvedRoutedAs, String payloadHash,
                                       String dispatchPlanHash) {
    }

    /**
     * v37: un run correctivo SIN especificacion ejecutable persistida NO tiene fallback al resolver vigente:
     * el fragmento PREPARED se INVALIDA (requiere solicitar PAY de nuevo) y NO se llama al banco.
     */
    public int invalidatePayFragmentMissingSpec(DataSource dataSource, String rebuildRunId,
                                                String correctiveSendersReference) throws SQLException {
        var sql = "update mt101_corrective_pay_fragment set pay_status = 'INVALIDATED', "
                + "error_message = 'no persisted dispatch spec (executable plan); request PAY again', "
                + "updated_at = current_timestamp where rebuild_run_id = ? and corrective_senders_reference = ? "
                + "and pay_status = 'PREPARED'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, correctiveSendersReference);
            return statement.executeUpdate();
        }
    }

    /**
     * Completa el detalle de PAY desde el resultado real del provider (gateway ref/intentos).
     * v33: recepción centralizada bajo el MISMO advisory lock por run que usan scheduler, dispatcher y
     * resolución tardía. Un resultado solo transiciona el fragmento desde {@code DISPATCHING} o
     * {@code UNCERTAIN}: NUNCA sobrescribe en silencio un estado TERMINAL (SENT/REJECTED/INVALIDATED). Si un
     * ACCEPTED tardío (SENT) llega cuando el fragmento ya fue resuelto a REJECTED/INVALIDATED (p.ej. por una
     * resolución STATUS terminal), no se sobrescribe: se registra una acción {@code PAY_CONFLICT} append-only
     * y el run se mantiene {@code UNCERTAIN} para conciliación manual (estado real ambiguo: el banco aceptó,
     * pero una resolución previa lo dio por no enviado). Sin fallback: no hay escritura ciega.
     */
    public PayFragmentWriteResult updatePayFragmentResults(DataSource dataSource, String rebuildRunId,
                                        Collection<PayFragmentResult> results) throws SQLException {
        if (results == null || results.isEmpty()) {
            return new PayFragmentWriteResult(0, List.of());
        }
        return inTransaction(dataSource, connection -> {
            lockRunForActionChain(connection, rebuildRunId);
            // v34/v35 (hallazgos 2/3): un resultado TERMINAL de transporte (SENT o REJECTED) solo puede llegar
            // desde DISPATCHING o UNCERTAIN (hubo claim/dispatch previo); un bug interno no puede registrar un
            // terminal sin claim. Un resultado NO terminal (UNCERTAIN) puede llegar desde un estado no terminal
            // (PREPARED/ARCHIVED/DISPATCHING/UNCERTAIN). En ningun caso se sobrescribe un terminal ya resuelto.
            var base = "update mt101_corrective_pay_fragment set gateway_reference = ?, attempts = ?, "
                    + "pay_status = ?, error_message = ?, dispatched_at = current_timestamp, updated_at = current_timestamp "
                    + "where rebuild_run_id = ? and corrective_senders_reference = ? and ";
            var updated = 0;
            var conflicts = new ArrayList<String>();
            try (var terminalStatement = connection.prepareStatement(base + "pay_status in ('DISPATCHING', 'UNCERTAIN')");
                 var openStatement = connection.prepareStatement(base + "pay_status not in ('SENT', 'REJECTED', 'INVALIDATED')")) {
                for (var result : results) {
                    if (result == null || result.correctiveSendersReference() == null
                            || result.correctiveSendersReference().isBlank()) {
                        continue;
                    }
                    // SENT y REJECTED (terminales de transporte) exigen claim previo; UNCERTAIN no.
                    var statement = isTerminalPayStatus(result.payStatus()) ? terminalStatement : openStatement;
                    statement.setString(1, result.gatewayReference());
                    statement.setInt(2, Math.max(result.attempts(), 0));
                    statement.setString(3, result.payStatus());
                    statement.setString(4, result.errorMessage());
                    statement.setString(5, rebuildRunId);
                    statement.setString(6, result.correctiveSendersReference());
                    var rows = statement.executeUpdate();
                    updated += rows;
                    if (rows == 0 && isTerminalPayStatus(result.payStatus())
                            && isTerminalConflict(connection, rebuildRunId, result.correctiveSendersReference(),
                            result.payStatus())) {
                        conflicts.add(result.correctiveSendersReference());
                    }
                }
            }
            if (!conflicts.isEmpty()) {
                recordTerminalPayConflict(connection, rebuildRunId, conflicts,
                        "gateway result", "gateway");
            }
            return new PayFragmentWriteResult(updated, List.copyOf(conflicts));
        });
    }

    /** Resultado de una escritura de fragmentos: filas aplicadas + referencias en conflicto terminal. */
    public record PayFragmentWriteResult(int updated, List<String> conflictReferences) {
    }

    private static boolean isTerminalPayStatus(String status) {
        return "SENT".equals(status) || "REJECTED".equals(status) || "INVALIDATED".equals(status);
    }

    /**
     * v34: un resultado terminal entrante CONTRADICE el estado terminal actual del fragmento (ambos terminales
     * y distintos). p.ej. el ledger ya SENT y STATUS dice REJECTED, o ya REJECTED y llega SENT.
     */
    private boolean isTerminalConflict(java.sql.Connection connection, String rebuildRunId, String reference,
                                       String incomingStatus) throws SQLException {
        var current = currentFragmentStatus(connection, rebuildRunId, reference);
        return isTerminalPayStatus(current) && !incomingStatus.equals(current);
    }

    private String currentFragmentStatus(java.sql.Connection connection, String rebuildRunId,
                                         String reference) throws SQLException {
        try (var statement = connection.prepareStatement("select pay_status from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = ? and corrective_senders_reference = ?")) {
            statement.setString(1, rebuildRunId);
            statement.setString(2, reference);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private static final String LATE_CONFLICT_ACTOR = "system:pay-late-conflict";

    /**
     * v33/v34: un resultado terminal entrante (de gateway o de STATUS) CONTRADICE una resolución terminal
     * previa del fragmento (el banco aceptó algo dado por no enviado, o STATUS rechaza algo ya marcado SENT).
     * No se sobrescribe el fragmento (la fila se conserva); se registra {@code PAY_CONFLICT} append-only y el
     * run se fuerza a {@code UNCERTAIN} (estado real ambiguo) para conciliación manual — nunca un terminal
     * silencioso, ni un re-request ciego, ni ignorar el resultado. Protección simétrica en ambos sentidos.
     */
    private void recordTerminalPayConflict(java.sql.Connection connection, String rebuildRunId,
                                           List<String> conflicts, String incomingKind, String source)
            throws SQLException {
        var reason = "terminal conflict on fragment(s) " + String.join(", ", conflicts) + ": " + incomingKind
                + " contradicts an existing terminal ledger state; manual reconciliation required, "
                + "no silent overwrite and no ignore (source=" + source + ")";
        var previous = currentPayStatus(connection, rebuildRunId);
        try (var statement = connection.prepareStatement("update mt101_rebuild_run set pay_status = 'UNCERTAIN', "
                + "pay_uncertain_reason = ?, pay_error_message = ?, pay_completed_at = null, "
                + "updated_at = current_timestamp where rebuild_run_id = ?")) {
            statement.setString(1, reason);
            statement.setString(2, reason);
            statement.setString(3, rebuildRunId);
            statement.executeUpdate();
        }
        // v35 (hallazgo 1): marca durable y explicita por fragmento. El fragmento conserva su pay_status real
        // (no se sobrescribe) pero queda pay_conflict=true para que API/UI no malinterpreten el estado.
        try (var statement = connection.prepareStatement("update mt101_corrective_pay_fragment "
                + "set pay_conflict = true, pay_conflict_reason = ?, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and corrective_senders_reference = ?")) {
            for (var reference : conflicts) {
                statement.setString(1, reason);
                statement.setString(2, rebuildRunId);
                statement.setString(3, reference);
                statement.executeUpdate();
            }
        }
        recordPayAction(connection, rebuildRunId, "PAY_CONFLICT", previous, "UNCERTAIN",
                LATE_CONFLICT_ACTOR, reason, null, null, null);
    }

    /**
     * Resuelve fragmentos inciertos desde MT101_STATUS sin alterar intentos de PAY ni reenviar.
     * v34 (hallazgo 1, simetría): bajo el MISMO advisory lock por run. Solo transiciona desde un estado no
     * terminal (UNCERTAIN/DISPATCHING/PREPARED); NUNCA sobrescribe un terminal ya resuelto. Si STATUS reporta
     * un resultado TERMINAL (SENT/REJECTED) que CONTRADICE el terminal actual del ledger (p.ej. STATUS dice
     * REJECTED pero el fragmento ya quedó SENT por una aceptación tardía), no se ignora en silencio: se
     * registra {@code PAY_CONFLICT} append-only y el run se fuerza a {@code UNCERTAIN} para conciliación manual.
     */
    public PayFragmentWriteResult resolvePayFragmentResults(DataSource dataSource, String rebuildRunId,
                                         Collection<PayFragmentResult> results,
                                         String resolutionSource) throws SQLException {
        if (results == null || results.isEmpty()) {
            return new PayFragmentWriteResult(0, List.of());
        }
        var sql = """
                update mt101_corrective_pay_fragment
                   set gateway_reference = coalesce(?, gateway_reference),
                       pay_status = ?,
                       error_message = ?,
                       resolution_source = ?,
                       resolved_at = current_timestamp,
                       updated_at = current_timestamp
                 where rebuild_run_id = ?
                   and corrective_senders_reference = ?
                   and pay_status in ('UNCERTAIN', 'DISPATCHING', 'PREPARED')
                """;
        return inTransaction(dataSource, connection -> {
            lockRunForActionChain(connection, rebuildRunId);
            var updated = 0;
            var conflicts = new ArrayList<String>();
            try (var statement = connection.prepareStatement(sql)) {
                for (var result : results) {
                    if (result == null || result.correctiveSendersReference() == null
                            || result.correctiveSendersReference().isBlank()) {
                        continue;
                    }
                    statement.setString(1, result.gatewayReference());
                    statement.setString(2, result.payStatus());
                    statement.setString(3, result.errorMessage());
                    statement.setString(4, resolutionSource == null ? "STATUS_API" : resolutionSource);
                    statement.setString(5, rebuildRunId);
                    statement.setString(6, result.correctiveSendersReference());
                    var rows = statement.executeUpdate();
                    updated += rows;
                    if (rows == 0 && isTerminalPayStatus(result.payStatus())
                            && isTerminalConflict(connection, rebuildRunId, result.correctiveSendersReference(),
                            result.payStatus())) {
                        conflicts.add(result.correctiveSendersReference());
                    }
                }
            }
            if (!conflicts.isEmpty()) {
                recordTerminalPayConflict(connection, rebuildRunId, conflicts,
                        "MT101_STATUS result", resolutionSource == null ? "STATUS_API" : resolutionSource);
            }
            return new PayFragmentWriteResult(updated, List.copyOf(conflicts));
        });
    }

    public int syncCorrectiveBuildFragmentsFromPay(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = """
                update mt101_build_fragment f
                   set status = cpf.pay_status,
                       error_message = cpf.error_message,
                       updated_at = current_timestamp
                  from mt101_corrective_pay_fragment cpf
                 where cpf.rebuild_run_id = ?
                   and cpf.pay_status in ('SENT', 'REJECTED')
                   and f.fragment_set_id = cpf.corrective_set_id
                   and f.senders_reference = cpf.corrective_senders_reference
                   and f.status not in ('SENT', 'REJECTED', 'SUPERSEDED')
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    public int markPayFragmentsUncertain(DataSource dataSource, String rebuildRunId, String reason) throws SQLException {
        var sql = "update mt101_corrective_pay_fragment set pay_status = 'UNCERTAIN', "
                + "error_message = ?, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and pay_status in ('PREPARED', 'DISPATCHING')";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, reason);
            statement.setString(2, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    public List<Map<String, Object>> correctivePayStatusRecords(DataSource dataSource, String rebuildRunId,
                                                                long afterId, int limit) throws SQLException {
        return correctivePayStatusRecords(dataSource, rebuildRunId, List.of("SENT"), afterId, limit);
    }

    public List<Map<String, Object>> correctivePayStatusRecords(DataSource dataSource,
                                                                String rebuildRunId,
                                                                Collection<String> payStatuses,
                                                                long afterId,
                                                                int limit) throws SQLException {
        var statuses = normalizedStatuses(payStatuses, List.of("SENT"));
        var sql = """
                select cpf.id, cpf.corrective_senders_reference, cpf.gateway_reference,
                       cpf.idempotency_key, f.routed_as as routed_as, a.id as archive_id
                  from mt101_corrective_pay_fragment cpf
                  left join mt101_build_fragment f
                    on f.fragment_set_id = cpf.corrective_set_id
                   and f.senders_reference = cpf.corrective_senders_reference
                  left join mt101_archive a
                    on a.senders_reference = cpf.corrective_senders_reference
                   and (a.process_execution_id = f.process_execution_id or a.process_execution_id is null)
                 where cpf.rebuild_run_id = ?
                   and cpf.pay_status in (""" + placeholders(statuses.size()) + """
                   )
                   and cpf.id > ?
                 order by cpf.id asc
                 limit ?
                """;
        var result = new ArrayList<Map<String, Object>>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, rebuildRunId);
            for (var status : statuses) {
                statement.setString(parameter++, status);
            }
            statement.setLong(parameter++, afterId);
            statement.setInt(parameter, Math.max(limit, 1));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var row = new java.util.LinkedHashMap<String, Object>();
                    row.put("ledgerId", rs.getLong("id"));
                    row.put("sendersReference", rs.getString("corrective_senders_reference"));
                    row.put("gatewayReference", rs.getString("gateway_reference"));
                    row.put("idempotencyKey", rs.getString("idempotency_key"));
                    var routedAs = rs.getString("routed_as");
                    if (routedAs != null && !routedAs.isBlank()) {
                        row.put("route", routedAs);
                    }
                    var archiveId = rs.getObject("archive_id");
                    if (archiveId != null) {
                        row.put("archiveId", rs.getLong("archive_id"));
                    }
                    result.add(row);
                }
            }
        }
        return result;
    }

    private List<String> normalizedStatuses(Collection<String> raw, List<String> defaults) {
        var source = raw == null || raw.isEmpty() ? defaults : raw;
        var result = new ArrayList<String>(source.size());
        for (var item : source) {
            if (item == null || item.isBlank()) {
                continue;
            }
            result.add(item.trim().toUpperCase(Locale.ROOT));
        }
        return result.isEmpty() ? defaults : result;
    }

    public List<String> correctivePaySentReferences(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select corrective_senders_reference from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = ? and pay_status = 'SENT' order by corrective_senders_reference";
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

    public List<String> correctivePayRejectedReferences(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "select corrective_senders_reference from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = ? and pay_status = 'REJECTED' order by corrective_senders_reference";
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

    public PayFragmentSummary payFragmentSummary(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = """
                select count(*) total,
                       count(*) filter (where pay_status = 'SENT') sent,
                       count(*) filter (where pay_status = 'REJECTED') rejected,
                       count(*) filter (where pay_status = 'INVALIDATED') invalidated,
                       count(*) filter (where pay_status not in ('SENT', 'REJECTED', 'INVALIDATED')) pending,
                       count(*) filter (where pay_conflict) conflicts
                  from mt101_corrective_pay_fragment
                 where rebuild_run_id = ?
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return new PayFragmentSummary(0, 0, 0, 0, 0, 0);
                }
                return new PayFragmentSummary(
                        rs.getLong("total"),
                        rs.getLong("sent"),
                        rs.getLong("rejected"),
                        rs.getLong("pending"),
                        rs.getLong("invalidated"),
                        rs.getLong("conflicts"));
            }
        }
    }

    /** Marca filas seleccionadas por su estado real del set correctivo. */
    public int syncSelectionStatusesFromCorrective(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = """
                update mt101_rebuild_selection sel
                   set status = case
                         when f.status = 'REJECTED' then 'REBUILD_REJECTED'
                         when f.status = 'SENT' then 'REBUILD_SENT'
                         when f.status = 'ARCHIVED' then 'REBUILD_ARCHIVED'
                         when f.status = 'VALIDATED' then 'REBUILD_VALIDATED'
                         when f.status = 'BUILT' then 'REBUILD_PENDING_VALIDATION'
                         else sel.status
                       end,
                       lifecycle_updated_at = current_timestamp
                  from mt101_fragment_record fr
                  join mt101_build_fragment f on f.id = fr.fragment_id
                 where sel.rebuild_run_id = ?
                   and fr.rebuild_run_id = sel.rebuild_run_id
                   and sel.staging_id is not null
                   and fr.staging_id = sel.staging_id
                   and fr.source_record_number = sel.source_record_number
                   and fr.source_file_hash = sel.source_file_hash
                   and fr.source_task_definition_id is not distinct from sel.source_task_definition_id
                   and fr.source_name is not distinct from sel.source_name
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    public int markSelectionLifecycle(DataSource dataSource, String rebuildRunId, String status) throws SQLException {
        var sql = "update mt101_rebuild_selection set status = ?, lifecycle_updated_at = current_timestamp "
                + "where rebuild_run_id = ? and status <> 'REBUILD_REJECTED'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setString(2, rebuildRunId);
            return statement.executeUpdate();
        }
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
            String connectionRef,
            String payStatus,
            String payRequestedBy,
            String payApprovedBy,
            String payRequestedPayloadHash,
            String payClaimedPayloadHash,
            LocalDateTime payLeaseUntil,
            String payUncertainReason,
            String payErrorMessage,
            LocalDateTime createdAt,
            LocalDateTime approvedAt,
            LocalDateTime executedAt,
            LocalDateTime builtAt,
            LocalDateTime completedAt,
            LocalDateTime updatedAt,
            String payRequestReason,
            String payRequestTicket,
            String payResolvedBy,
            LocalDateTime payResolvedAt,
            String payResolutionReason
    ) {
    }

    public record LifecycleStatus(String status, boolean terminal) {
    }

    public record PayFragmentResult(
            String correctiveSendersReference,
            String payStatus,
            String gatewayReference,
            int attempts,
            String errorMessage
    ) {
    }

    public record PayFragmentIntent(
            String correctiveSetId,
            String correctiveSendersReference,
            String sourceFileHash,
            Long sourceRecordNumber,
            Long stagingId,
            String payloadHash,
            String idempotencyKey,
            String transport,
            String endpointRef,
            String approvedRoutedAs,
            String dispatchDestination,
            String dispatchPlanHash,
            String dispatchSpecVersion,
            String dispatchSpecJson,
            String dispatchSpecHash
    ) {
    }

    public record PayFragmentSummary(long total, long sent, long rejected, long pending, long invalidated,
                                     long conflicts) {
    }
}
