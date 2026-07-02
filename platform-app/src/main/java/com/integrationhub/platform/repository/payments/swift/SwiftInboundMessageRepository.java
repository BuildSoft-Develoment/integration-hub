package com.integrationhub.platform.repository.payments.swift;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Repository JDBC del store inbound MT101 ({@code swift_inbound_message}). Espejo
 * de {@link Mt101FragmentRepository} pero con keyset por {@code id} (las filas
 * inbound no tienen un indice de fragmento estable) y soporte de {@code routed_as}.
 */
@ApplicationScoped
public class SwiftInboundMessageRepository {

    public void deleteSet(DataSource dataSource, String inboundSetId) throws SQLException {
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "delete from swift_inbound_message where inbound_set_id = ?")) {
            statement.setString(1, inboundSetId);
            statement.executeUpdate();
        }
    }

    public void insertMessages(DataSource dataSource, List<InboundRow> messages) throws SQLException {
        if (messages == null || messages.isEmpty()) {
            return;
        }
        var sql = "insert into swift_inbound_message "
                + "(inbound_set_id, process_execution_id, task_definition_id, source_table, row_from, row_to, "
                + " senders_reference, payload_hash, raw_payload, message_json, status) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PARSED')";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var message : messages) {
                statement.setString(1, message.inboundSetId());
                if (message.processExecutionId() == null) statement.setNull(2, Types.BIGINT);
                else statement.setLong(2, message.processExecutionId());
                if (message.taskDefinitionId() == null) statement.setNull(3, Types.BIGINT);
                else statement.setLong(3, message.taskDefinitionId());
                statement.setString(4, message.sourceTable());
                statement.setLong(5, message.rowFrom());
                statement.setLong(6, message.rowTo());
                statement.setString(7, message.sendersReference());
                statement.setString(8, message.payloadHash());
                statement.setString(9, message.rawPayload());
                statement.setString(10, message.messageJson());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    /** Lee una pagina por keyset ({@code id > afterId}) filtrando por estado. */
    public List<MessageJsonRow> readPage(DataSource dataSource,
                                         String inboundSetId,
                                         List<String> statuses,
                                         long afterId,
                                         int pageSize) throws SQLException {
        var sql = "select id, message_json, routed_as from swift_inbound_message where inbound_set_id = ?"
                + (statuses == null || statuses.isEmpty() ? "" : " and status in (" + placeholders(statuses.size()) + ")")
                + " and id > ?"
                + " order by id asc limit ?";
        var page = new ArrayList<MessageJsonRow>(Math.max(pageSize, 1));
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            var parameter = 1;
            statement.setString(parameter++, inboundSetId);
            if (statuses != null) {
                for (var status : statuses) {
                    statement.setString(parameter++, status);
                }
            }
            statement.setLong(parameter++, afterId);
            statement.setInt(parameter, pageSize);
            try (var rs = statement.executeQuery()) {
                while (rs.next()) {
                    page.add(new MessageJsonRow(rs.getLong(1), rs.getString(2), rs.getString(3)));
                }
            }
        }
        return page;
    }

    /** Marca un lote por id con el mismo status, error y (opcional) routed_as. */
    public void updateStatusBatch(DataSource dataSource,
                                  Map<Long, String> errorById,
                                  String status,
                                  String routedAs) throws SQLException {
        if (errorById == null || errorById.isEmpty()) {
            return;
        }
        var sql = "update swift_inbound_message set status = ?, error_message = ?, routed_as = ?, "
                + "updated_at = current_timestamp where id = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var entry : errorById.entrySet()) {
                if (entry.getKey() == null) {
                    continue;
                }
                statement.setString(1, status);
                statement.setString(2, entry.getValue());
                statement.setString(3, routedAs);
                statement.setLong(4, entry.getKey());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    public long countBySetAndStatus(DataSource dataSource, String inboundSetId, String status) throws SQLException {
        var sql = "select count(*) from swift_inbound_message where inbound_set_id = ?"
                + (status == null || status.isBlank() ? "" : " and status = ?");
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, inboundSetId);
            if (status != null && !status.isBlank()) {
                statement.setString(2, status);
            }
            try (var rs = statement.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0L;
            }
        }
    }

    public Map<Long, String> nullErrors(Collection<Long> ids) {
        var result = new java.util.LinkedHashMap<Long, String>();
        if (ids == null) {
            return result;
        }
        for (var id : ids) {
            result.put(id, null);
        }
        return result;
    }

    private String placeholders(int count) {
        return String.join(", ", java.util.Collections.nCopies(count, "?"));
    }

    public record InboundRow(
            String inboundSetId,
            Long processExecutionId,
            Long taskDefinitionId,
            String sourceTable,
            long rowFrom,
            long rowTo,
            String sendersReference,
            String payloadHash,
            String rawPayload,
            String messageJson
    ) {
    }

    public record MessageJsonRow(long id, String messageJson, String routedAs) {
    }
}
