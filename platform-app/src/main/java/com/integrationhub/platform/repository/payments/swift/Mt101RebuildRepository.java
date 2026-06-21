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
                       created_at, approved_at, executed_at, built_at, completed_at, updated_at
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
        var total = fragments.values().stream().mapToLong(Long::longValue).sum();
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
            case "PARTIALLY_FAILED" -> 75;
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
                + "where status in ('BUILDING', 'BUILT', 'VALIDATED', 'ARCHIVED', 'SENT', 'PARTIALLY_FAILED', 'CONFIRMED')";
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

    /** B2': solicita el envio del correctivo (maker) con estado explicito PAY. */
    public int requestPay(DataSource dataSource, String rebuildRunId, String requestedBy) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'REQUESTED', pay_requested_by = ?, "
                + "pay_requested_at = current_timestamp, pay_claimed_by = null, pay_claimed_at = null, "
                + "pay_approved_by = null, pay_approved_at = null, pay_completed_at = null, "
                + "pay_error_message = null, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and status = 'ARCHIVED' "
                + "and pay_status in ('NOT_REQUESTED', 'FAILED')";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, requestedBy);
            statement.setString(2, rebuildRunId);
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

    /**
     * Claim atomico REQUESTED -> EXECUTING. Solo la transaccion que gana este update
     * puede invocar el provider MT101_PAY; asi se evita doble envio concurrente.
     */
    public boolean claimPayForExecution(DataSource dataSource, String rebuildRunId, String approvedBy) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'EXECUTING', pay_claimed_by = ?, "
                + "pay_claimed_at = current_timestamp, pay_approved_by = ?, pay_approved_at = current_timestamp, "
                + "updated_at = current_timestamp "
                + "where rebuild_run_id = ? and status = 'ARCHIVED' and pay_status = 'REQUESTED' "
                + "and pay_requested_by is not null and pay_requested_by <> ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, approvedBy);
            statement.setString(2, approvedBy);
            statement.setString(3, rebuildRunId);
            statement.setString(4, approvedBy);
            return statement.executeUpdate() == 1;
        }
    }

    /** B2': registra que el PAY correctivo ejecuto sin error local. */
    public void markPaySent(DataSource dataSource, String rebuildRunId) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'SENT', pay_completed_at = current_timestamp, "
                + "pay_error_message = null, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and pay_status = 'EXECUTING'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, rebuildRunId);
            statement.executeUpdate();
        }
    }

    /** B2': registra fallo de PAY; el operador debe solicitar de nuevo si corresponde. */
    public void markPayFailed(DataSource dataSource, String rebuildRunId, String errorMessage) throws SQLException {
        var sql = "update mt101_rebuild_run set pay_status = 'FAILED', pay_error_message = ?, "
                + "pay_completed_at = current_timestamp, updated_at = current_timestamp "
                + "where rebuild_run_id = ? and pay_status = 'EXECUTING'";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, errorMessage);
            statement.setString(2, rebuildRunId);
            statement.executeUpdate();
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
