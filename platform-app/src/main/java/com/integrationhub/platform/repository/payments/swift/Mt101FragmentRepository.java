package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Repository JDBC de fragmentos masivos MT101. */
@ApplicationScoped
public class Mt101FragmentRepository {

    public void deleteFragmentSet(DataSource dataSource, String fragmentSetId) throws SQLException {
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "delete from mt101_build_fragment where fragment_set_id = ?")) {
            statement.setString(1, fragmentSetId);
            statement.executeUpdate();
        }
    }

    public void insertFragments(DataSource dataSource, List<FragmentRow> fragments) throws SQLException {
        if (fragments == null || fragments.isEmpty()) {
            return;
        }
        // source_row_from/to se mantiene = id de staging por compatibilidad con el
        // indice/lectura historicos; staging_id_* y source_record_* (fila 1-based)
        // son las claves nuevas separadas que usa el lookup por fila del archivo.
        var sql = "insert into mt101_build_fragment "
                + "(fragment_set_id, process_execution_id, task_definition_id, source_table, "
                + " source_row_from, source_row_to, staging_id_from, staging_id_to, "
                + " source_record_from, source_record_to, source_file_hash, source_records_json, "
                + " fragment_index, fragment_total, senders_reference, payload_hash, raw_payload, message_json, status) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            for (var fragment : fragments) {
                statement.setString(1, fragment.fragmentSetId());
                if (fragment.processExecutionId() == null) statement.setNull(2, Types.BIGINT);
                else statement.setLong(2, fragment.processExecutionId());
                if (fragment.taskDefinitionId() == null) statement.setNull(3, Types.BIGINT);
                else statement.setLong(3, fragment.taskDefinitionId());
                statement.setString(4, fragment.sourceTable());
                statement.setLong(5, fragment.stagingIdFrom());
                statement.setLong(6, fragment.stagingIdTo());
                statement.setLong(7, fragment.stagingIdFrom());
                statement.setLong(8, fragment.stagingIdTo());
                statement.setLong(9, fragment.sourceRecordFrom());
                statement.setLong(10, fragment.sourceRecordTo());
                statement.setString(11, fragment.sourceFileHash());
                statement.setString(12, fragment.sourceRecordsJson());
                statement.setInt(13, fragment.fragmentIndex());
                statement.setInt(14, fragment.fragmentTotal());
                statement.setString(15, fragment.sendersReference());
                statement.setString(16, fragment.payloadHash());
                statement.setString(17, fragment.rawPayload());
                statement.setString(18, fragment.messageJson());
                statement.setString(19, "BUILT");
                statement.addBatch();
            }
            statement.executeBatch();
            var fragmentIds = new ArrayList<Long>(fragments.size());
            try (var keys = statement.getGeneratedKeys()) {
                while (keys.next()) {
                    fragmentIds.add(keys.getLong(1));
                }
            }
            if (fragmentIds.size() != fragments.size()) {
                throw new SQLException("Cannot resolve generated ids for MT101 fragment lineage: expected "
                        + fragments.size() + " keys but got " + fragmentIds.size());
            }
            insertFragmentRecords(connection, fragments, fragmentIds);
        }
    }

    private void insertFragmentRecords(java.sql.Connection connection,
                                       List<FragmentRow> fragments,
                                       List<Long> fragmentIds) throws SQLException {
        var hasSourceRecords = false;
        for (var fragment : fragments) {
            if (fragment.sourceRecords() != null && !fragment.sourceRecords().isEmpty()) {
                hasSourceRecords = true;
                break;
            }
        }
        if (!hasSourceRecords) {
            return;
        }
        var sql = "insert into mt101_fragment_record "
                + "(fragment_id, fragment_set_id, source_file_hash, source_record_number, staging_id, "
                + " original_senders_reference, original_transaction_reference, "
                + " current_senders_reference, current_transaction_reference) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?) "
                + "on conflict do nothing";
        try (var statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < fragments.size(); i++) {
                var fragment = fragments.get(i);
                if (fragment.sourceRecords() == null || fragment.sourceRecords().isEmpty()) {
                    continue;
                }
                for (var entry : fragment.sourceRecords().entrySet()) {
                    if (entry.getKey() == null || entry.getKey().isBlank() || entry.getValue() == null) {
                        continue;
                    }
                    statement.setLong(1, fragmentIds.get(i));
                    statement.setString(2, fragment.fragmentSetId());
                    statement.setString(3, fragment.sourceFileHash());
                    statement.setLong(4, entry.getValue());
                    var stagingId = fragment.stagingIdsBySourceRecord() == null
                            ? null
                            : fragment.stagingIdsBySourceRecord().get(entry.getValue());
                    if (stagingId == null) {
                        statement.setNull(5, Types.BIGINT);
                    } else {
                        statement.setLong(5, stagingId);
                    }
                    statement.setString(6, fragment.sendersReference());
                    statement.setString(7, entry.getKey());
                    statement.setString(8, fragment.sendersReference());
                    statement.setString(9, entry.getKey());
                    statement.addBatch();
                }
            }
            statement.executeBatch();
        }
    }

    public List<MessageJsonRow> readPage(DataSource dataSource,
                                         String fragmentSetId,
                                         List<String> statuses,
                                         int afterIndex,
                                         int pageSize) throws SQLException {
        var sql = "select fragment_index, message_json from mt101_build_fragment where fragment_set_id = ?"
                + (statuses == null || statuses.isEmpty() ? "" : " and status in (" + placeholders(statuses.size()) + ")")
                + " and fragment_index > ?"
                + " order by fragment_index asc limit ?";
        var page = new ArrayList<MessageJsonRow>(Math.max(pageSize, 1));
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            if (statuses != null) {
                for (var status : statuses) {
                    statement.setString(parameter++, status);
                }
            }
            statement.setInt(parameter++, afterIndex);
            statement.setInt(parameter, pageSize);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    page.add(new MessageJsonRow(rs.getInt(1), rs.getString(2)));
                }
            }
        }
        return page;
    }

    public void updateStatusBatch(DataSource dataSource,
                                  String fragmentSetId,
                                  Map<String, String> errorBySendersReference,
                                  String status) throws SQLException {
        if (errorBySendersReference == null || errorBySendersReference.isEmpty()) {
            return;
        }
        var sql = "update mt101_build_fragment set status = ?, error_message = ?, updated_at = current_timestamp "
                + "where fragment_set_id = ? and senders_reference = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var entry : errorBySendersReference.entrySet()) {
                if (entry.getKey() == null || entry.getKey().isBlank()) {
                    continue;
                }
                statement.setString(1, status);
                statement.setString(2, entry.getValue());
                statement.setString(3, fragmentSetId);
                statement.setString(4, entry.getKey());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    /**
     * Localiza fragmentos por identidad exacta de fila: hash del archivo + fila 1-based.
     * El contrato operativo usa {@code mt101_fragment_record}; no cae a rangos del
     * fragmento padre porque eso vuelve ambigua la trazabilidad multiarchivo.
     */
    public List<FragmentLookupRow> findBySourceRecord(DataSource dataSource,
                                                      Long recordNumber,
                                                      String sourceFileHash,
                                                      String sourceTable,
                                                      Long processExecutionId,
                                                      String fragmentSetId,
                                                      int limit) throws SQLException {
        var sql = new StringBuilder("""
                select f.fragment_set_id, f.process_execution_id, f.task_definition_id, f.source_table,
                       f.staging_id_from, f.staging_id_to, f.source_record_from, f.source_record_to,
                       f.source_file_hash, f.fragment_index, f.fragment_total, f.senders_reference,
                       f.status, f.error_message, f.created_at, f.updated_at
                  from mt101_fragment_record r
                  join mt101_build_fragment f on f.id = r.fragment_id
                 where r.source_file_hash = ?
                   and r.source_record_number = ?
                """);
        var parameters = new ArrayList<Object>();
        parameters.add(sourceFileHash);
        parameters.add(recordNumber);
        if (sourceTable != null && !sourceTable.isBlank()) {
            sql.append(" and f.source_table = ?");
            parameters.add(sourceTable);
        }
        if (processExecutionId != null) {
            sql.append(" and f.process_execution_id = ?");
            parameters.add(processExecutionId);
        }
        if (fragmentSetId != null && !fragmentSetId.isBlank()) {
            sql.append(" and r.fragment_set_id = ?");
            parameters.add(fragmentSetId);
        }
        sql.append(" order by f.created_at desc, f.fragment_index asc limit ?");
        parameters.add(Math.max(limit, 1));

        var result = new ArrayList<FragmentLookupRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            for (int i = 0; i < parameters.size(); i++) {
                statement.setObject(i + 1, parameters.get(i));
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FragmentLookupRow(
                            rs.getString("fragment_set_id"),
                            nullableLong(rs, "process_execution_id"),
                            nullableLong(rs, "task_definition_id"),
                            rs.getString("source_table"),
                            rs.getLong("staging_id_from"),
                            rs.getLong("staging_id_to"),
                            nullableLong(rs, "source_record_from"),
                            nullableLong(rs, "source_record_to"),
                            rs.getString("source_file_hash"),
                            rs.getInt("fragment_index"),
                            rs.getInt("fragment_total"),
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("error_message"),
                            timestamp(rs, "created_at"),
                            timestamp(rs, "updated_at")));
                }
            }
        }
        return result;
    }

    /**
     * Fragmentos con al menos una fila exacta dentro de [recordFrom, recordTo] para
     * un archivo concreto. Se apoya en {@code mt101_fragment_record}; no usa rangos
     * del padre como fallback.
     */
    public List<FragmentLookupRow> findBySourceRowRange(DataSource dataSource,
                                                        long recordFrom,
                                                        long recordTo,
                                                        String sourceFileHash,
                                                        String fragmentSetId,
                                                        int limit) throws SQLException {
        var sql = new StringBuilder("""
                select distinct f.fragment_set_id, f.process_execution_id, f.task_definition_id, f.source_table,
                       f.staging_id_from, f.staging_id_to, f.source_record_from, f.source_record_to,
                       f.source_file_hash, f.fragment_index, f.fragment_total, f.senders_reference,
                       f.status, f.error_message, f.created_at, f.updated_at
                  from mt101_fragment_record r
                  join mt101_build_fragment f on f.id = r.fragment_id
                 where r.source_file_hash = ?
                   and r.source_record_number >= ?
                   and r.source_record_number <= ?
                """);
        var parameters = new ArrayList<Object>();
        parameters.add(sourceFileHash);
        parameters.add(recordFrom);
        parameters.add(recordTo);
        if (fragmentSetId != null && !fragmentSetId.isBlank()) {
            sql.append(" and r.fragment_set_id = ?");
            parameters.add(fragmentSetId);
        }
        sql.append(" order by f.source_record_from asc, f.fragment_index asc limit ?");
        parameters.add(Math.max(limit, 1));

        var result = new ArrayList<FragmentLookupRow>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql.toString())) {
            for (int i = 0; i < parameters.size(); i++) {
                statement.setObject(i + 1, parameters.get(i));
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FragmentLookupRow(
                            rs.getString("fragment_set_id"),
                            nullableLong(rs, "process_execution_id"),
                            nullableLong(rs, "task_definition_id"),
                            rs.getString("source_table"),
                            rs.getLong("staging_id_from"),
                            rs.getLong("staging_id_to"),
                            nullableLong(rs, "source_record_from"),
                            nullableLong(rs, "source_record_to"),
                            rs.getString("source_file_hash"),
                            rs.getInt("fragment_index"),
                            rs.getInt("fragment_total"),
                            rs.getString("senders_reference"),
                            rs.getString("status"),
                            rs.getString("error_message"),
                            timestamp(rs, "created_at"),
                            timestamp(rs, "updated_at")));
                }
            }
        }
        return result;
    }

    /** Correctivo que reemplaza una fila original exacta dentro de un fragment set. */
    public FragmentLookupRow findCorrectiveByOriginalSourceRecord(DataSource dataSource,
                                                                  String originalFragmentSetId,
                                                                  String sourceFileHash,
                                                                  long sourceRecordNumber) throws SQLException {
        var sql = """
                select f.fragment_set_id, f.process_execution_id, f.task_definition_id, f.source_table,
                       f.staging_id_from, f.staging_id_to, f.source_record_from, f.source_record_to,
                       f.source_file_hash, f.fragment_index, f.fragment_total, f.senders_reference,
                       f.status, f.error_message, f.created_at, f.updated_at
                  from mt101_fragment_record r
                  join mt101_build_fragment f on f.id = r.fragment_id
                 where r.original_fragment_set_id = ?
                   and r.source_file_hash = ?
                   and r.source_record_number = ?
                   and r.rebuild_run_id is not null
                 order by f.created_at desc, f.fragment_index asc
                 limit 1
                """;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, originalFragmentSetId);
            statement.setString(2, sourceFileHash);
            statement.setLong(3, sourceRecordNumber);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new FragmentLookupRow(
                        rs.getString("fragment_set_id"),
                        nullableLong(rs, "process_execution_id"),
                        nullableLong(rs, "task_definition_id"),
                        rs.getString("source_table"),
                        rs.getLong("staging_id_from"),
                        rs.getLong("staging_id_to"),
                        nullableLong(rs, "source_record_from"),
                        nullableLong(rs, "source_record_to"),
                        rs.getString("source_file_hash"),
                        rs.getInt("fragment_index"),
                        rs.getInt("fragment_total"),
                        rs.getString("senders_reference"),
                        rs.getString("status"),
                        rs.getString("error_message"),
                        timestamp(rs, "created_at"),
                        timestamp(rs, "updated_at"));
            }
        }
    }

    /**
     * Transiciona en bloque los fragmentos de un set que estan en {@code fromStatus}
     * hacia {@code toStatus} (p.ej. REJECTED -> BUILT para revalidar). Limpia
     * {@code error_message} al resetear. Devuelve cuantos fragmentos cambiaron.
     */
    public int resetStatus(DataSource dataSource,
                           String fragmentSetId,
                           String fromStatus,
                           String toStatus) throws SQLException {
        var sql = "update mt101_build_fragment set status = ?, error_message = null, updated_at = current_timestamp "
                + "where fragment_set_id = ? and status = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, toStatus);
            statement.setString(2, fragmentSetId);
            statement.setString(3, fromStatus);
            return statement.executeUpdate();
        }
    }

    /** Metadata del set (de cualquier fragmento) para re-construir scoped a filas corregidas. */
    public SetMetadata findSetMetadata(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "select process_execution_id, task_definition_id, source_table "
                + "from mt101_build_fragment where fragment_set_id = ? limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new SetMetadata(
                        nullableLong(rs, "process_execution_id"),
                        nullableLong(rs, "task_definition_id"),
                        rs.getString("source_table"));
            }
        }
    }

    public record SetMetadata(Long processExecutionId, Long taskDefinitionId, String sourceTable) {
    }

    /**
     * Resuelve la identidad del lote por fragmentSetId o por processExecutionId (lo
     * que el operador conoce tras correr el proceso). Devuelve null si no hay set.
     */
    public LoteRef loteRef(DataSource dataSource, String fragmentSetId, Long processExecutionId) throws SQLException {
        var bySet = fragmentSetId != null && !fragmentSetId.isBlank();
        var sql = "select fragment_set_id, process_execution_id, source_table, source_file_hash "
                + "from mt101_build_fragment where "
                + (bySet ? "fragment_set_id = ?" : "process_execution_id = ?")
                + " order by fragment_index asc limit 1";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            if (bySet) {
                statement.setString(1, fragmentSetId.trim());
            } else {
                statement.setLong(1, processExecutionId);
            }
            try (var rs = statement.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new LoteRef(rs.getString("fragment_set_id"), nullableLong(rs, "process_execution_id"),
                        rs.getString("source_table"), rs.getString("source_file_hash"));
            }
        }
    }

    public record LoteRef(String fragmentSetId, Long processExecutionId, String sourceTable, String sourceFileHash) {
    }

    /** Conteo de fragmentos por estado de un set (resumen del lote para la UI). */
    public List<StatusCount> statusCountsBySet(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "select status, count(*) as total from mt101_build_fragment "
                + "where fragment_set_id = ? group by status order by status";
        var result = new ArrayList<StatusCount>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new StatusCount(rs.getString("status"), rs.getLong("total")));
                }
            }
        }
        return result;
    }

    public record StatusCount(String status, long count) {
    }

    public Map<TransactionKey, FragmentRecordLineage> fragmentRecordLineageByTransactions(
            DataSource dataSource,
            String fragmentSetId,
            Collection<TransactionKey> transactions) throws SQLException {
        if (transactions == null || transactions.isEmpty()) {
            return Map.of();
        }
        var keys = transactions.stream()
                .filter(key -> key != null
                        && key.sendersReference() != null && !key.sendersReference().isBlank()
                        && key.transactionReference() != null && !key.transactionReference().isBlank())
                .distinct()
                .toList();
        if (keys.isEmpty()) {
            return Map.of();
        }
        var sql = "select current_senders_reference, current_transaction_reference, source_file_hash, "
                + "source_record_number, staging_id from mt101_fragment_record "
                + "where fragment_set_id = ? and (current_senders_reference, current_transaction_reference) in ("
                + String.join(", ", java.util.Collections.nCopies(keys.size(), "(?, ?)")) + ")";
        var result = new LinkedHashMap<TransactionKey, FragmentRecordLineage>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            for (var key : keys) {
                statement.setString(parameter++, key.sendersReference());
                statement.setString(parameter++, key.transactionReference());
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    var key = new TransactionKey(
                            rs.getString("current_senders_reference"),
                            rs.getString("current_transaction_reference"));
                    result.put(key, new FragmentRecordLineage(
                            rs.getString("source_file_hash"),
                            nullableLong(rs, "source_record_number"),
                            nullableLong(rs, "staging_id")));
                }
            }
        }
        return result;
    }

    public record TransactionKey(String sendersReference, String transactionReference) {
    }

    public record FragmentRecordLineage(String sourceFileHash, Long sourceRecordNumber, Long stagingId) {
    }

    /** Estado actual por {@code :20:} dentro de un set, usado antes de mutaciones correctivas. */
    public Map<String, String> statusesByReferences(DataSource dataSource,
                                                    String fragmentSetId,
                                                    Collection<String> sendersReferences) throws SQLException {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return Map.of();
        }
        var sql = "select senders_reference, status from mt101_build_fragment "
                + "where fragment_set_id = ? and senders_reference in (" + placeholders(sendersReferences.size()) + ")";
        var result = new LinkedHashMap<String, String>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, fragmentSetId);
            for (var reference : sendersReferences) {
                statement.setString(parameter++, reference);
            }
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.put(rs.getString("senders_reference"), rs.getString("status"));
                }
            }
        }
        return result;
    }

    /**
     * Marca como SUPERSEDED los fragmentos del set indicados por {@code :20:},
     * apuntando al set correctivo que los reemplaza. Devuelve cuantos cambiaron.
     */
    public int markSupersededByReferences(DataSource dataSource,
                                          String fragmentSetId,
                                          java.util.Collection<String> sendersReferences,
                                          String correctiveSetId,
                                          String requiredStatus) throws SQLException {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return 0;
        }
        var sql = "update mt101_build_fragment set status = 'SUPERSEDED', superseded_by = ?, "
                + "updated_at = current_timestamp where fragment_set_id = ? and senders_reference = ? and status = ?";
        var updated = 0;
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var reference : sendersReferences) {
                if (reference == null || reference.isBlank()) {
                    continue;
                }
                statement.setString(1, correctiveSetId);
                statement.setString(2, fragmentSetId);
                statement.setString(3, reference);
                statement.setString(4, requiredStatus);
                updated += statement.executeUpdate();
            }
        }
        return updated;
    }

    /**
     * Borra los fragmentos de un set (cascade a {@code mt101_fragment_record}). Se usa
     * para limpiar fragmentos correctivos huerfanos tras un rebuild fallido.
     */
    public int deleteByFragmentSet(DataSource dataSource, String fragmentSetId) throws SQLException {
        var sql = "delete from mt101_build_fragment where fragment_set_id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            return statement.executeUpdate();
        }
    }

    /**
     * Revierte a {@code REJECTED} los fragmentos del set original que un run correctivo
     * dejo {@code SUPERSEDED} (rollback de un supersede parcial tras fallo del rebuild).
     */
    public int revertSupersededBy(DataSource dataSource, String fragmentSetId, String correctiveSetId) throws SQLException {
        var sql = "update mt101_build_fragment set status = 'REJECTED', superseded_by = null, "
                + "updated_at = current_timestamp where fragment_set_id = ? and superseded_by = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            statement.setString(2, correctiveSetId);
            return statement.executeUpdate();
        }
    }

    public Map<String, String> nullErrors(Collection<String> sendersReferences) {
        var result = new LinkedHashMap<String, String>();
        if (sendersReferences == null) {
            return result;
        }
        for (var reference : sendersReferences) {
            result.put(reference, null);
        }
        return result;
    }

    private String placeholders(int count) {
        return String.join(", ", java.util.Collections.nCopies(count, "?"));
    }

    public record FragmentRow(
            String fragmentSetId,
            Long processExecutionId,
            Long taskDefinitionId,
            String sourceTable,
            long stagingIdFrom,
            long stagingIdTo,
            long sourceRecordFrom,
            long sourceRecordTo,
            String sourceFileHash,
            String sourceRecordsJson,
            Map<String, Long> sourceRecords,
            Map<Long, Long> stagingIdsBySourceRecord,
            int fragmentIndex,
            int fragmentTotal,
            String sendersReference,
            String payloadHash,
            String rawPayload,
            String messageJson
    ) {
    }

    public record MessageJsonRow(int fragmentIndex, String messageJson) {
    }

    public record FragmentLookupRow(
            String fragmentSetId,
            Long processExecutionId,
            Long taskDefinitionId,
            String sourceTable,
            long stagingIdFrom,
            long stagingIdTo,
            Long sourceRecordFrom,
            Long sourceRecordTo,
            String sourceFileHash,
            int fragmentIndex,
            int fragmentTotal,
            String sendersReference,
            String status,
            String errorMessage,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
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
