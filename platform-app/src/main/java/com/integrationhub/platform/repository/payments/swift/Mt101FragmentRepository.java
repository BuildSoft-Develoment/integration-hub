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
        var sql = "insert into mt101_build_fragment "
                + "(fragment_set_id, process_execution_id, task_definition_id, source_table, source_row_from, source_row_to, "
                + " fragment_index, fragment_total, senders_reference, payload_hash, raw_payload, message_json, status) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var fragment : fragments) {
                statement.setString(1, fragment.fragmentSetId());
                if (fragment.processExecutionId() == null) statement.setNull(2, Types.BIGINT);
                else statement.setLong(2, fragment.processExecutionId());
                if (fragment.taskDefinitionId() == null) statement.setNull(3, Types.BIGINT);
                else statement.setLong(3, fragment.taskDefinitionId());
                statement.setString(4, fragment.sourceTable());
                statement.setLong(5, fragment.rowFrom());
                statement.setLong(6, fragment.rowTo());
                statement.setInt(7, fragment.fragmentIndex());
                statement.setInt(8, fragment.fragmentTotal());
                statement.setString(9, fragment.sendersReference());
                statement.setString(10, fragment.payloadHash());
                statement.setString(11, fragment.rawPayload());
                statement.setString(12, fragment.messageJson());
                statement.setString(13, "BUILT");
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

    public List<FragmentLookupRow> findBySourceRow(DataSource dataSource,
                                                   Long recordNumber,
                                                   String sourceTable,
                                                   Long processExecutionId,
                                                   String fragmentSetId,
                                                   int limit) throws SQLException {
        var sql = new StringBuilder("""
                select fragment_set_id, process_execution_id, task_definition_id, source_table,
                       source_row_from, source_row_to, fragment_index, fragment_total,
                       senders_reference, status, error_message, created_at, updated_at
                  from mt101_build_fragment
                 where source_row_from <= ?
                   and source_row_to >= ?
                """);
        var parameters = new ArrayList<Object>();
        parameters.add(recordNumber);
        parameters.add(recordNumber);
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
                            rs.getLong("source_row_from"),
                            rs.getLong("source_row_to"),
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
            long rowFrom,
            long rowTo,
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
            long sourceRowFrom,
            long sourceRowTo,
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
