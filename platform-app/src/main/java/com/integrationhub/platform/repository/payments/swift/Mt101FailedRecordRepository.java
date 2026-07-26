package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Repository JDBC de la cola de cuarentena de filas MT101 fallidas. */
@ApplicationScoped
public class Mt101FailedRecordRepository {

    /**
     * Inserta filas en cuarentena de forma idempotente (ON CONFLICT DO NOTHING sobre
     * el indice de dedup). Devuelve cuantas filas nuevas se insertaron.
     */
    public int insertBatch(DataSource dataSource, List<FailedRecordRow> rows) throws SQLException {
        if (rows == null || rows.isEmpty()) {
            return 0;
        }
        var sql = "insert into mt101_failed_record "
                + "(fragment_set_id, senders_reference, transaction_reference, source_file_hash, "
                + " source_record_number, staging_id, source_task_definition_id, source_name, "
                + " rule_code, rule_set, severity, message) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                + "on conflict (fragment_set_id, coalesce(senders_reference, ''), "
                + "             coalesce(transaction_reference, ''), coalesce(rule_code, ''), "
                + "             coalesce(staging_id, 0)) do nothing";
        var inserted = 0;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var row : rows) {
                statement.setString(1, row.fragmentSetId());
                statement.setString(2, row.sendersReference());
                statement.setString(3, row.transactionReference());
                statement.setString(4, row.sourceFileHash());
                if (row.sourceRecordNumber() == null) statement.setNull(5, Types.BIGINT);
                else statement.setLong(5, row.sourceRecordNumber());
                if (row.stagingId() == null) statement.setNull(6, Types.BIGINT);
                else statement.setLong(6, row.stagingId());
                if (row.sourceTaskDefinitionId() == null) statement.setNull(7, Types.BIGINT);
                else statement.setLong(7, row.sourceTaskDefinitionId());
                statement.setString(8, row.sourceName());
                statement.setString(9, row.ruleCode());
                statement.setString(10, row.ruleSet());
                statement.setString(11, row.severity());
                statement.setString(12, row.message());
                statement.addBatch();
            }
            for (var count : statement.executeBatch()) {
                if (count > 0) {
                    inserted += count;
                } else if (count == Statement.SUCCESS_NO_INFO) {
                    inserted++;
                }
            }
        }
        return inserted;
    }

    public List<FailedRecord> findBySet(DataSource dataSource,
                                        String fragmentSetId,
                                        String status,
                                        int limit) throws SQLException {
        var sql = new StringBuilder("""
                select id, fragment_set_id, senders_reference, transaction_reference, source_file_hash,
                       source_record_number, staging_id, source_task_definition_id, source_name,
                       rule_code, rule_set, severity, message, status, created_at, resolved_at
                  from mt101_failed_record
                 where fragment_set_id = ?
                """);
        if (status != null && !status.isBlank()) {
            sql.append(" and status = ?");
        }
        sql.append(" order by source_record_number asc nulls last, id asc limit ?");

        var result = new ArrayList<FailedRecord>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            if (status != null && !status.isBlank()) {
                statement.setString(parameter++, status);
            }
            statement.setInt(parameter, Math.max(limit, 1));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FailedRecord(
                            rs.getLong("id"),
                            rs.getString("fragment_set_id"),
                            rs.getString("senders_reference"),
                            rs.getString("transaction_reference"),
                            rs.getString("source_file_hash"),
                            nullableLong(rs, "source_record_number"),
                            nullableLong(rs, "staging_id"),
                            nullableLong(rs, "source_task_definition_id"),
                            rs.getString("source_name"),
                            rs.getString("rule_code"),
                            rs.getString("rule_set"),
                            rs.getString("severity"),
                            rs.getString("message"),
                            rs.getString("status"),
                            timestamp(rs, "created_at"),
                            timestamp(rs, "resolved_at")));
                }
            }
        }
        return result;
    }

    public List<FailedRecord> findBySetPage(DataSource dataSource,
                                            String fragmentSetId,
                                            String status,
                                            long afterId,
                                            int limit) throws SQLException {
        return findBySetPage(dataSource, fragmentSetId, status, null, null, null, null, null, afterId, limit);
    }

    public List<FailedRecord> findBySetPage(DataSource dataSource,
                                            String fragmentSetId,
                                            String status,
                                            String sourceFileHash,
                                            Long sourceRecordNumber,
                                            String ruleCode,
                                            String sendersReference,
                                            String transactionReference,
                                            long afterId,
                                            int limit) throws SQLException {
        var sql = new StringBuilder("""
                select id, fragment_set_id, senders_reference, transaction_reference, source_file_hash,
                       source_record_number, staging_id, source_task_definition_id, source_name,
                       rule_code, rule_set, severity, message, status, created_at, resolved_at
                  from mt101_failed_record
                 where fragment_set_id = ?
                   and id > ?
                """);
        if (status != null && !status.isBlank()) {
            sql.append(" and status = ?");
        }
        if (sourceFileHash != null && !sourceFileHash.isBlank()) {
            sql.append(" and source_file_hash = ?");
        }
        if (sourceRecordNumber != null) {
            sql.append(" and source_record_number = ?");
        }
        if (ruleCode != null && !ruleCode.isBlank()) {
            sql.append(" and rule_code = ?");
        }
        if (sendersReference != null && !sendersReference.isBlank()) {
            sql.append(" and senders_reference = ?");
        }
        if (transactionReference != null && !transactionReference.isBlank()) {
            sql.append(" and transaction_reference = ?");
        }
        sql.append(" order by id asc limit ?");

        var result = new ArrayList<FailedRecord>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            statement.setLong(parameter++, Math.max(afterId, 0L));
            if (status != null && !status.isBlank()) {
                statement.setString(parameter++, status);
            }
            if (sourceFileHash != null && !sourceFileHash.isBlank()) {
                statement.setString(parameter++, sourceFileHash.trim());
            }
            if (sourceRecordNumber != null) {
                statement.setLong(parameter++, sourceRecordNumber);
            }
            if (ruleCode != null && !ruleCode.isBlank()) {
                statement.setString(parameter++, ruleCode.trim());
            }
            if (sendersReference != null && !sendersReference.isBlank()) {
                statement.setString(parameter++, sendersReference.trim());
            }
            if (transactionReference != null && !transactionReference.isBlank()) {
                statement.setString(parameter++, transactionReference.trim());
            }
            statement.setInt(parameter, Math.max(limit, 1));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FailedRecord(
                            rs.getLong("id"),
                            rs.getString("fragment_set_id"),
                            rs.getString("senders_reference"),
                            rs.getString("transaction_reference"),
                            rs.getString("source_file_hash"),
                            nullableLong(rs, "source_record_number"),
                            nullableLong(rs, "staging_id"),
                            nullableLong(rs, "source_task_definition_id"),
                            rs.getString("source_name"),
                            rs.getString("rule_code"),
                            rs.getString("rule_set"),
                            rs.getString("severity"),
                            rs.getString("message"),
                            rs.getString("status"),
                            timestamp(rs, "created_at"),
                            timestamp(rs, "resolved_at")));
                }
            }
        }
        return result;
    }

    public List<String> distinctSendersReferencesByStatus(DataSource dataSource,
                                                          String fragmentSetId,
                                                          String status) throws SQLException {
        var sql = "select distinct senders_reference from mt101_failed_record "
                + "where fragment_set_id = ? and status = ? and senders_reference is not null "
                + "order by senders_reference";
        var result = new ArrayList<String>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.setString(2, status);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(rs.getString(1));
                }
            }
        }
        return result;
    }

    public List<FailedRecord> findBySourceRow(DataSource dataSource,
                                              String fragmentSetId,
                                              String sourceFileHash,
                                              long sourceRecordNumber,
                                              long stagingId,
                                              String status,
                                              int limit) throws SQLException {
        var sql = new StringBuilder("""
                select id, fragment_set_id, senders_reference, transaction_reference, source_file_hash,
                       source_record_number, staging_id, source_task_definition_id, source_name,
                       rule_code, rule_set, severity, message, status, created_at, resolved_at
                  from mt101_failed_record
                 where fragment_set_id = ?
                   and source_file_hash = ?
                   and source_record_number = ?
                   and staging_id = ?
                """);
        if (status != null && !status.isBlank()) {
            sql.append(" and status = ?");
        }
        sql.append(" order by id asc limit ?");

        var result = new ArrayList<FailedRecord>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            statement.setString(parameter++, sourceFileHash);
            statement.setLong(parameter++, sourceRecordNumber);
            statement.setLong(parameter++, stagingId);
            if (status != null && !status.isBlank()) {
                statement.setString(parameter++, status);
            }
            statement.setInt(parameter, Math.max(limit, 1));
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FailedRecord(
                            rs.getLong("id"),
                            rs.getString("fragment_set_id"),
                            rs.getString("senders_reference"),
                            rs.getString("transaction_reference"),
                            rs.getString("source_file_hash"),
                            nullableLong(rs, "source_record_number"),
                            nullableLong(rs, "staging_id"),
                            nullableLong(rs, "source_task_definition_id"),
                            rs.getString("source_name"),
                            rs.getString("rule_code"),
                            rs.getString("rule_set"),
                            rs.getString("severity"),
                            rs.getString("message"),
                            rs.getString("status"),
                            timestamp(rs, "created_at"),
                            timestamp(rs, "resolved_at")));
                }
            }
        }
        return result;
    }

    /** Cuenta filas de un set en un estado (guarda contra rebuild parcial silencioso). */
    public long countByStatus(DataSource dataSource, String fragmentSetId, String status) throws SQLException {
        var sql = "select count(*) from mt101_failed_record where fragment_set_id = ? and status = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.setString(2, status);
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0L;
            }
        }
    }

    /**
     * ADR-020 (A): agrega los fallos de un set por causa ({@code rule_code}) para convertir miles de
     * filas en un puñado de decisiones. El operador luego filtra/exporta por causa. Ordenado por conteo
     * desc (la causa mas grande primero).
     */
    public List<RuleSummaryRow> summaryByRule(DataSource dataSource, String fragmentSetId, String status)
            throws SQLException {
        var sql = new StringBuilder(
                "select rule_code, max(rule_set) rule_set, max(severity) severity, count(*) cnt, "
                + "min(source_record_number) min_row, max(source_record_number) max_row "
                + "from mt101_failed_record where fragment_set_id = ?");
        if (status != null && !status.isBlank()) {
            sql.append(" and status = ?");
        }
        sql.append(" group by rule_code order by cnt desc, rule_code asc");
        var result = new ArrayList<RuleSummaryRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            statement.setString(1, fragmentSetId);
            if (status != null && !status.isBlank()) {
                statement.setString(2, status);
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new RuleSummaryRow(
                            rs.getString("rule_code"),
                            rs.getString("rule_set"),
                            rs.getString("severity"),
                            rs.getLong("cnt"),
                            nullableLong(rs, "min_row"),
                            nullableLong(rs, "max_row")));
                }
            }
        }
        return result;
    }

    /** Una causa de fallo agregada: cuantas filas la comparten + el rango de filas del archivo afectado. */
    public record RuleSummaryRow(String ruleCode, String ruleSet, String severity, long count,
                                 Long minSourceRecordNumber, Long maxSourceRecordNumber) {
    }

    /**
     * ADR-020 (C): filas para la planilla de correccion — cada fila en cuarentena joineada con su payload
     * de staging (+ version para If-Match). El servicio aplana el payload en columnas editables. Ordenado
     * por fila del archivo. Opcionalmente acotado a una causa (rule_code).
     */
    public List<CorrectionSheetRow> correctionSheetRows(DataSource dataSource, String fragmentSetId,
                                                        String status, String ruleCode, int limit)
            throws SQLException {
        var sql = new StringBuilder(
                "select f.staging_id, s.version, f.source_file_hash, f.source_record_number, "
                + "f.senders_reference, f.rule_code, f.message, s.payload_json "
                + "from mt101_failed_record f join staging_record s on s.id = f.staging_id "
                + "where f.fragment_set_id = ? and f.status = ?");
        if (ruleCode != null && !ruleCode.isBlank()) {
            sql.append(" and f.rule_code = ?");
        }
        sql.append(" order by f.source_record_number asc nulls last, f.id asc limit ?");
        var result = new ArrayList<CorrectionSheetRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            statement.setString(parameter++, status);
            if (ruleCode != null && !ruleCode.isBlank()) {
                statement.setString(parameter++, ruleCode);
            }
            statement.setInt(parameter, limit);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new CorrectionSheetRow(
                            nullableLong(rs, "staging_id"),
                            rs.getLong("version"),
                            rs.getString("source_file_hash"),
                            nullableLong(rs, "source_record_number"),
                            rs.getString("senders_reference"),
                            rs.getString("rule_code"),
                            rs.getString("message"),
                            rs.getString("payload_json")));
                }
            }
        }
        return result;
    }

    /** Una fila para la planilla de correccion: identidad para re-matchear + payload editable. */
    public record CorrectionSheetRow(Long stagingId, long version, String sourceFileHash, Long recordNumber,
                                     String sendersReference, String ruleCode, String message, String payloadJson) {
    }

    /**
     * Resuelve la cuarentena SOLO de las filas cubiertas por la seleccion del run
     * ({@code rebuild_run_id}), no por todo el set. Asi una fila nueva en cuarentena
     * insertada durante el run, o un run parcial, no se marca con el estado correctivo equivocado (P0.4).
     */
    public int updateStatusByRun(DataSource dataSource,
                                 String fragmentSetId,
                                 String rebuildRunId,
                                 String fromStatus,
                                 String toStatus) throws SQLException {
        var terminal = "RESOLVED".equalsIgnoreCase(toStatus) || "DISCARDED".equalsIgnoreCase(toStatus);
        var sql = "update mt101_failed_record set status = ?, "
                + "resolved_at = case when ? then current_timestamp else resolved_at end "
                + "where fragment_set_id = ? and status = ? "
                + "and exists (select 1 from mt101_rebuild_selection sel "
                + "where sel.rebuild_run_id = ? "
                + "and sel.fragment_set_id = mt101_failed_record.fragment_set_id "
                + "and mt101_failed_record.staging_id = sel.staging_id "
                + "and mt101_failed_record.source_file_hash = sel.source_file_hash "
                + "and mt101_failed_record.source_record_number = sel.source_record_number "
                + "and mt101_failed_record.senders_reference = sel.original_senders_reference)";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, toStatus);
            statement.setBoolean(2, terminal);
            statement.setString(3, fragmentSetId);
            statement.setString(4, fromStatus);
            statement.setString(5, rebuildRunId);
            return statement.executeUpdate();
        }
    }

    /** Cambia solo las filas seleccionadas cuyo estado granular del run coincide. */
    public int updateStatusByRunSelectionStatus(DataSource dataSource,
                                                String fragmentSetId,
                                                String rebuildRunId,
                                                String fromStatus,
                                                String selectionStatus,
                                                String toStatus) throws SQLException {
        var terminal = "RESOLVED".equalsIgnoreCase(toStatus) || "DISCARDED".equalsIgnoreCase(toStatus);
        var sql = "update mt101_failed_record set status = ?, "
                + "resolved_at = case when ? then current_timestamp else resolved_at end "
                + "where fragment_set_id = ? and status = ? "
                + "and exists (select 1 from mt101_rebuild_selection sel "
                + "where sel.rebuild_run_id = ? "
                + "and sel.status = ? "
                + "and sel.fragment_set_id = mt101_failed_record.fragment_set_id "
                + "and mt101_failed_record.staging_id = sel.staging_id "
                + "and mt101_failed_record.source_file_hash = sel.source_file_hash "
                + "and mt101_failed_record.source_record_number = sel.source_record_number "
                + "and mt101_failed_record.senders_reference = sel.original_senders_reference)";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, toStatus);
            statement.setBoolean(2, terminal);
            statement.setString(3, fragmentSetId);
            statement.setString(4, fromStatus);
            statement.setString(5, rebuildRunId);
            statement.setString(6, selectionStatus);
            return statement.executeUpdate();
        }
    }

    /**
     * H4: propaga el resultado de un run HIJO a la cuarentena de la RAÍZ. Un hijo reconstruye sólo los fragmentos
     * que su padre dejó {@code REJECTED}; cuando el hijo los ENVÍA, las filas de cuarentena de la raíz (que el padre
     * dejó {@code REBUILD_REJECTED}) deben pasar a {@code REBUILD_SENT}. El cruce es por la TUPLA ESTABLE
     * {@code (staging_id, source_file_hash, source_record_number)} — NO por {@code senders_reference}, que cambia en
     * cada generación (ese es exactamente el motivo por el que la sincronización normal no cruzaba entre generaciones).
     * Sólo toca filas raíz {@code REBUILD_REJECTED} cuya selección del hijo esté {@code REBUILD_SENT} (idempotente).
     */
    public int propagateChildSentToRootQuarantine(DataSource dataSource, String childRebuildRunId, String rootFragmentSetId)
            throws SQLException {
        var sql = """
                update mt101_failed_record fr
                   set status = 'REBUILD_SENT'
                  from mt101_rebuild_selection sel
                 where sel.rebuild_run_id = ?
                   and sel.status = 'REBUILD_SENT'
                   and fr.fragment_set_id = ?
                   and fr.status = 'REBUILD_REJECTED'
                   and fr.staging_id = sel.staging_id
                   and fr.source_file_hash = sel.source_file_hash
                   and fr.source_record_number = sel.source_record_number
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, childRebuildRunId);
            statement.setString(2, rootFragmentSetId);
            return statement.executeUpdate();
        }
    }

    /**
     * B1': reabre una fila rechazada del correctivo ({@code REBUILD_REJECTED -> QUARANTINED})
     * conservando rebuild_run_id y las referencias correctivas, para que vuelva al ciclo
     * corregir->rebuild. Connection-scoped (audita en la misma transaccion).
     */
    public int reopenRejectedRow(java.sql.Connection connection,
                                 String fragmentSetId,
                                 String sourceFileHash,
                                 long sourceRecordNumber,
                                 long stagingId) throws SQLException {
        var sql = "update mt101_failed_record set status = 'QUARANTINED', resolved_at = null "
                + "where fragment_set_id = ? and source_file_hash = ? and source_record_number = ? "
                + "and staging_id = ? "
                + "and status = 'REBUILD_REJECTED'";
        try (var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.setString(2, sourceFileHash);
            statement.setLong(3, sourceRecordNumber);
            statement.setLong(4, stagingId);
            return statement.executeUpdate();
        }
    }

    public record FailedRecordRow(
            String fragmentSetId,
            String sendersReference,
            String transactionReference,
            String sourceFileHash,
            Long sourceRecordNumber,
            Long stagingId,
            Long sourceTaskDefinitionId,
            String sourceName,
            String ruleCode,
            String ruleSet,
            String severity,
            String message
    ) {
    }

    public record FailedRecord(
            long id,
            String fragmentSetId,
            String sendersReference,
            String transactionReference,
            String sourceFileHash,
            Long sourceRecordNumber,
            Long stagingId,
            Long sourceTaskDefinitionId,
            String sourceName,
            String ruleCode,
            String ruleSet,
            String severity,
            String message,
            String status,
            LocalDateTime createdAt,
            LocalDateTime resolvedAt
    ) {
    }

    private Long nullableLong(java.sql.ResultSet rs, String column) throws SQLException {
        var value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private LocalDateTime timestamp(java.sql.ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }
}
