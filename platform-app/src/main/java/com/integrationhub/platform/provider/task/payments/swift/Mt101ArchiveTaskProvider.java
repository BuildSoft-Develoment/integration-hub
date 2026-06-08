package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.archive.AesGcmPayloadEncryptor;
import com.integrationhub.platform.provider.task.payments.swift.archive.PayloadEncryptor;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Task provider {@code MT101_ARCHIVE}: persiste cada {@link Mt101Message} de la
 * tarea anterior como envelope + archive + transactions en la BD configurada via
 * {@code connectionRef}. Calcula hash SHA-256 del {@code rawPayload} y opcionalmente
 * lo cifra (AES-GCM 256) si {@code encryptColumn}+{@code encryptionSecretRef} estan
 * configurados.
 *
 * <p>Output publica el {@code archiveId} por mensaje (clave para {@code MT101_PAY}).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-003, RF-014, RF-021, T-008, T-020
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ArchiveTaskProvider implements TaskProvider {

    private static final String DEFAULT_TABLE = "mt101_archive";
    private static final int DEFAULT_RETENTION_DAYS = 3650;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;

    public Mt101ArchiveTaskProvider(DataSource defaultDataSource,
                                    ConnectionPoolManager connectionPoolManager) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
    }

    @Override
    public String type() {
        return "MT101_ARCHIVE";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var messages = readMessages(context, configuration);
        if (messages.isEmpty()) {
            return TaskResult.success("MT101_ARCHIVE skipped because there are no messages to archive");
        }

        var connectionRef = stringValue(configuration.get("connectionRef"), null);
        var dataSource = resolveDataSource(connectionRef);
        var encryptor = resolveEncryptor(configuration);
        var retentionDays = intValue(configuration.get("retentionDays"), DEFAULT_RETENTION_DAYS);

        var archived = new ArrayList<Map<String, Object>>(messages.size());
        var totalBytes = 0L;

        try (Connection connection = dataSource.getConnection()) {
            var previousAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                for (var message : messages) {
                    var raw = message.rawPayload();
                    if (raw == null) {
                        throw new IllegalStateException("Mt101Message.rawPayload is required for archiving");
                    }
                    totalBytes += raw.getBytes(StandardCharsets.UTF_8).length;
                    var stored = encryptor != null ? encryptor.encrypt(raw) : raw;
                    var hash = sha256Hex(raw);

                    var envelopeId = insertEnvelope(connection, message, hash, context, stored);
                    var archiveId = insertArchive(connection, message, envelopeId, stored, retentionDays);
                    insertTransactions(connection, archiveId, message);

                    var entry = new LinkedHashMap<String, Object>();
                    entry.put("archiveId", archiveId);
                    entry.put("envelopeId", envelopeId);
                    entry.put("sendersReference", message.sequenceA() == null ? null
                            : message.sequenceA().sendersReference());
                    entry.put("hash", hash);
                    entry.put("encrypted", encryptor != null);
                    archived.add(entry);
                }
                connection.commit();
            } catch (SQLException | RuntimeException error) {
                connection.rollback();
                throw error;
            } finally {
                connection.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot archive MT101 messages", error);
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("archivedCount", archived.size());
        outputs.put("totalBytes", totalBytes);
        outputs.put("targetTable", DEFAULT_TABLE);
        outputs.put("records", archived);

        return TaskResult.success(
                "MT101_ARCHIVE archived " + archived.size() + " messages (" + totalBytes + " bytes)",
                outputs);
    }

    private long insertEnvelope(Connection connection,
                                Mt101Message message,
                                String hash,
                                TaskContext context,
                                String storedPayload) throws SQLException {
        var sql = "insert into swift_message_envelope "
                + "(message_type, sender_lt, receiver_lt, uetr, priority, raw_payload, payload_hash, source_file_name, process_execution_id) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            var envelope = message.envelope();
            statement.setString(1, "101");
            statement.setString(2, envelope == null ? null : envelope.senderLt());
            statement.setString(3, envelope == null ? null : envelope.receiverLt());
            statement.setString(4, envelope == null ? null : envelope.uetr());
            statement.setString(5, envelope == null ? null : envelope.priority());
            statement.setString(6, storedPayload);
            statement.setString(7, hash);
            statement.setNull(8, Types.VARCHAR);
            if (context.processExecutionId() == null) {
                statement.setNull(9, Types.BIGINT);
            } else {
                statement.setLong(9, context.processExecutionId());
            }
            statement.executeUpdate();
            try (var keys = statement.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getLong(1);
                }
                throw new SQLException("No generated key returned for swift_message_envelope");
            }
        }
    }

    private long insertArchive(Connection connection,
                               Mt101Message message,
                               long envelopeId,
                               String storedPayload,
                               int retentionDays) throws SQLException {
        var sql = "insert into mt101_archive "
                + "(envelope_id, senders_reference, customer_specified_reference, message_index, message_total, "
                + " requested_execution_date, ordering_customer_kind, ordering_customer_account, "
                + " ordering_customer_name_addr, account_servicing_kind, account_servicing_value, "
                + " status, format, retention_until) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            var sequenceA = message.sequenceA();
            statement.setLong(1, envelopeId);
            statement.setString(2, sequenceA == null ? null : sequenceA.sendersReference());
            statement.setString(3, sequenceA == null ? null : sequenceA.customerSpecifiedReference());
            if (sequenceA == null) {
                statement.setNull(4, Types.INTEGER);
                statement.setNull(5, Types.INTEGER);
            } else {
                statement.setInt(4, sequenceA.messageIndex());
                statement.setInt(5, sequenceA.messageTotal());
            }
            statement.setObject(6, sequenceA == null ? null : sequenceA.requestedExecutionDate(), Types.DATE);
            var orderingCustomer = sequenceA == null ? null : sequenceA.orderingCustomer();
            statement.setString(7, orderingCustomer == null ? null : orderingCustomer.option());
            statement.setString(8, orderingCustomer == null ? null : orderingCustomer.account());
            statement.setString(9, orderingCustomer == null ? null
                    : String.join("\n", orderingCustomer.nameAndAddress()));
            var accountServicing = sequenceA == null ? null : sequenceA.accountServicingInstitution();
            statement.setString(10, accountServicing == null ? null : accountServicing.option());
            statement.setString(11, accountServicing == null ? null
                    : (accountServicing.bic() != null ? accountServicing.bic() : accountServicing.account()));
            statement.setString(12, "COMPOSED");
            statement.setString(13, message.format());
            statement.setObject(14, LocalDate.now().plusDays(retentionDays), Types.DATE);
            statement.executeUpdate();
            try (var keys = statement.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getLong(1);
                }
                throw new SQLException("No generated key returned for mt101_archive");
            }
        }
    }

    private void insertTransactions(Connection connection, long archiveId, Mt101Message message) throws SQLException {
        if (message.transactions() == null || message.transactions().isEmpty()) {
            return;
        }
        var sql = "insert into mt101_transaction "
                + "(archive_id, sequence_number, transaction_reference, amount_currency, amount_value, "
                + " beneficiary_kind, beneficiary_account, beneficiary_name_addr, account_with_institution, "
                + " remittance_information, details_of_charges) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            for (var tx : message.transactions()) {
                statement.setLong(1, archiveId);
                statement.setInt(2, tx.sequenceNumber());
                statement.setString(3, tx.transactionReference());
                statement.setString(4, tx.amount() == null ? null : tx.amount().currency());
                if (tx.amount() == null || tx.amount().value() == null) {
                    statement.setNull(5, Types.NUMERIC);
                } else {
                    statement.setBigDecimal(5, tx.amount().value());
                }
                var beneficiary = tx.beneficiary();
                statement.setString(6, beneficiary == null ? null : beneficiary.option());
                statement.setString(7, beneficiary == null ? null : beneficiary.account());
                statement.setString(8, beneficiary == null ? null
                        : String.join("\n", beneficiary.nameAndAddress()));
                var accountWith = tx.accountWithInstitution();
                statement.setString(9, accountWith == null ? null : accountWith.bic());
                statement.setString(10, tx.remittanceInformation());
                statement.setString(11, tx.detailsOfCharges());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    /**
     * Construye el encryptor si la configuracion lo solicita. La clave
     * ({@code encryptionSecretRef}) llega ya resuelta por
     * {@code JsonConfigurationMapper.toMap} (que expande {@code ${secret:...}} antes
     * de invocar al provider). Por eso aqui no se inyecta {@code SecretValueProvider}:
     * lo que recibimos es el material de clave en claro.
     */
    private PayloadEncryptor resolveEncryptor(Map<String, Object> configuration) {
        var encryptColumn = stringValue(configuration.get("encryptColumn"), null);
        var keyMaterial = stringValue(configuration.get("encryptionSecretRef"), null);
        if (encryptColumn == null || keyMaterial == null) {
            return null;
        }
        return new AesGcmPayloadEncryptor(keyMaterial);
    }

    private String sha256Hex(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Mt101Message> readMessages(TaskContext context, Map<String, Object> configuration) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()) {
            return List.of();
        }
        if (!(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            throw new IllegalArgumentException("MT101_ARCHIVE requires configuration.input");
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("MT101_ARCHIVE input.sourceTaskRef is required");
        }
        var sourceOutput = stringValue(((Map<String, Object>) rawInput).get("sourceOutput"), "records");
        var key = sourceTaskRef + "." + sourceOutput;
        var raw = taskOutputs.get(key);
        if (raw == null) {
            return List.of();
        }
        if (!(raw instanceof List<?> rawList)) {
            throw new IllegalArgumentException(
                    "Expected " + key + " to be List<Mt101Message> but got " + raw.getClass().getName());
        }
        var result = new ArrayList<Mt101Message>(rawList.size());
        for (var item : rawList) {
            if (item instanceof Mt101Message msg) {
                result.add(msg);
            } else if (item != null) {
                throw new IllegalArgumentException(
                        "Expected Mt101Message items at " + key + " but got " + item.getClass().getName());
            }
        }
        return result;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
    }
}
