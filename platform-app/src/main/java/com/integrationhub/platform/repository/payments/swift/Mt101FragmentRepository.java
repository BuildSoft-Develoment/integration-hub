package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
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
             var statement = connection.prepareStatement(sql)) {
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
     * Localiza el/los fragmento(s) que contienen una fila del archivo. Filtra por
     * {@code source_record_from/to} (fila 1-based real del archivo), no por id de
     * staging. {@code sourceFileHash} desambigua cuando varios archivos comparten
     * numeracion de fila.
     */
    public List<FragmentLookupRow> findBySourceRow(DataSource dataSource,
                                                   Long recordNumber,
                                                   String sourceFileHash,
                                                   String sourceTable,
                                                   Long processExecutionId,
                                                   String fragmentSetId,
                                                   int limit) throws SQLException {
        var sql = new StringBuilder("""
                select fragment_set_id, process_execution_id, task_definition_id, source_table,
                       staging_id_from, staging_id_to, source_record_from, source_record_to, source_file_hash,
                       fragment_index, fragment_total, senders_reference, status, error_message, created_at, updated_at
                  from mt101_build_fragment
                 where source_record_from <= ?
                   and source_record_to >= ?
                """);
        var parameters = new ArrayList<Object>();
        parameters.add(recordNumber);
        parameters.add(recordNumber);
        if (sourceFileHash != null && !sourceFileHash.isBlank()) {
            sql.append(" and source_file_hash = ?");
            parameters.add(sourceFileHash);
        }
        if (sourceTable != null && !sourceTable.isBlank()) {
            sql.append(" and source_table = ?");
            parameters.add(sourceTable);
        }
        if (processExecutionId != null) {
            sql.append(" and process_execution_id = ?");
            parameters.add(processExecutionId);
        }
        if (fragmentSetId != null && !fragmentSetId.isBlank()) {
            sql.append(" and fragment_set_id = ?");
            parameters.add(fragmentSetId);
        }
        sql.append(" order by created_at desc, fragment_index asc limit ?");
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
     * Fragmentos cuyo rango de fila del archivo solapa [recordFrom, recordTo]
     * (1-based). Reusa la clave de negocio {@code source_record_from/to}; sirve para
     * reprocesar solo las filas afectadas de un lote de 1M sin tocar el resto.
     */
    public List<FragmentLookupRow> findBySourceRowRange(DataSource dataSource,
                                                        long recordFrom,
                                                        long recordTo,
                                                        String sourceFileHash,
                                                        String fragmentSetId,
                                                        int limit) throws SQLException {
        var sql = new StringBuilder("""
                select fragment_set_id, process_execution_id, task_definition_id, source_table,
                       staging_id_from, staging_id_to, source_record_from, source_record_to, source_file_hash,
                       fragment_index, fragment_total, senders_reference, status, error_message, created_at, updated_at
                  from mt101_build_fragment
                 where source_record_from <= ?
                   and source_record_to >= ?
                """);
        var parameters = new ArrayList<Object>();
        parameters.add(recordTo);
        parameters.add(recordFrom);
        if (sourceFileHash != null && !sourceFileHash.isBlank()) {
            sql.append(" and source_file_hash = ?");
            parameters.add(sourceFileHash);
        }
        if (fragmentSetId != null && !fragmentSetId.isBlank()) {
            sql.append(" and fragment_set_id = ?");
            parameters.add(fragmentSetId);
        }
        sql.append(" order by source_record_from asc, fragment_index asc limit ?");
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
     * Transiciona en bloque los fragmentos de un set que estan en {@code fromStatus}
     * hacia {@code toStatus} (p.ej. REJECTED -> BUILT para revalidar, SENT -> ARCHIVED
     * para reenviar). Limpia {@code error_message} al resetear. Devuelve cuantos
     * fragmentos cambiaron.
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

    /**
     * Mapeo {@code :20: -> (source_file_hash, source_records_json)} de un set, para
     * resolver el {@code :21:} fallido a su fila exacta del archivo en la cuarentena.
     */
    public List<FragmentSourceRecords> findSourceRecordsBySet(DataSource dataSource,
                                                              String fragmentSetId) throws SQLException {
        var sql = "select senders_reference, source_file_hash, source_records_json "
                + "from mt101_build_fragment where fragment_set_id = ?";
        var result = new ArrayList<FragmentSourceRecords>();
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, fragmentSetId);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(new FragmentSourceRecords(
                            rs.getString("senders_reference"),
                            rs.getString("source_file_hash"),
                            rs.getString("source_records_json")));
                }
            }
        }
        return result;
    }

    public record FragmentSourceRecords(String sendersReference, String sourceFileHash, String sourceRecordsJson) {
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
     * Marca como SUPERSEDED los fragmentos del set indicados por {@code :20:},
     * apuntando al set correctivo que los reemplaza. Devuelve cuantos cambiaron.
     */
    public int markSupersededByReferences(DataSource dataSource,
                                          String fragmentSetId,
                                          java.util.Collection<String> sendersReferences,
                                          String correctiveSetId) throws SQLException {
        if (sendersReferences == null || sendersReferences.isEmpty()) {
            return 0;
        }
        var sql = "update mt101_build_fragment set status = 'SUPERSEDED', superseded_by = ?, "
                + "updated_at = current_timestamp where fragment_set_id = ? and senders_reference = ?";
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
                updated += statement.executeUpdate();
            }
        }
        return updated;
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
