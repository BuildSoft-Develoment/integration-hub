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
        var messages = Mt101MessageInputResolver.readMessages(context, configuration, type());
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
                    entry.put("message", message);
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
                + " requested_execution_date, instructing_party_kind, instructing_party_value, "
                + " ordering_customer_kind, ordering_customer_account, ordering_customer_name_addr, "
                + " account_servicing_kind, account_servicing_value, status, format, retention_until) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
            var instructingParty = sequenceA == null ? null : sequenceA.instructingParty();
            statement.setString(7, instructingParty == null ? null : instructingParty.option());
            statement.setString(8, partyValue(instructingParty));
            var orderingCustomer = sequenceA == null ? null : sequenceA.orderingCustomer();
            statement.setString(9, orderingCustomer == null ? null : orderingCustomer.option());
            statement.setString(10, orderingCustomer == null ? null : orderingCustomer.account());
            statement.setString(11, orderingCustomer == null ? null
                    : String.join("\n", orderingCustomer.nameAndAddress()));
            var accountServicing = sequenceA == null ? null : sequenceA.accountServicingInstitution();
            statement.setString(12, accountServicing == null ? null : accountServicing.option());
            statement.setString(13, partyValue(accountServicing));
            statement.setString(14, "COMPOSED");
            statement.setString(15, message.format());
            statement.setObject(16, LocalDate.now().plusDays(retentionDays), Types.DATE);
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
                + "(archive_id, sequence_number, transaction_reference, fx_deal_reference, instruction_code, "
                + " amount_currency, amount_value, ordering_customer_kind, ordering_customer_account, "
                + " ordering_customer_name_addr, account_servicing_kind, account_servicing_value, intermediary, "
                + " account_with_institution, beneficiary_kind, beneficiary_account, beneficiary_name_addr, "
                + " remittance_information, regulatory_reporting, original_amount_currency, original_amount_value, "
                + " details_of_charges, charges_account, exchange_rate) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            for (var tx : message.transactions()) {
                statement.setLong(1, archiveId);
                statement.setInt(2, tx.sequenceNumber());
                statement.setString(3, tx.transactionReference());
                statement.setString(4, tx.fxDealReference());
                statement.setString(5, tx.instructionCode());
                statement.setString(6, tx.amount() == null ? null : tx.amount().currency());
                if (tx.amount() == null || tx.amount().value() == null) {
                    statement.setNull(7, Types.NUMERIC);
                } else {
                    statement.setBigDecimal(7, tx.amount().value());
                }
                var orderingCustomer = tx.orderingCustomer();
                statement.setString(8, orderingCustomer == null ? null : orderingCustomer.option());
                statement.setString(9, orderingCustomer == null ? null : orderingCustomer.account());
                statement.setString(10, orderingCustomer == null ? null
                        : String.join("\n", orderingCustomer.nameAndAddress()));
                var accountServicing = tx.accountServicingInstitution();
                statement.setString(11, accountServicing == null ? null : accountServicing.option());
                statement.setString(12, partyValue(accountServicing));
                statement.setString(13, partyValue(tx.intermediary()));
                statement.setString(14, partyValue(tx.accountWithInstitution()));
                var beneficiary = tx.beneficiary();
                statement.setString(15, beneficiary == null ? null : beneficiary.option());
                statement.setString(16, beneficiary == null ? null : beneficiary.account());
                statement.setString(17, beneficiary == null ? null
                        : String.join("\n", beneficiary.nameAndAddress()));
                statement.setString(18, tx.remittanceInformation());
                statement.setString(19, tx.regulatoryReporting());
                statement.setString(20, tx.originalAmount() == null ? null : tx.originalAmount().currency());
                if (tx.originalAmount() == null || tx.originalAmount().value() == null) {
                    statement.setNull(21, Types.NUMERIC);
                } else {
                    statement.setBigDecimal(21, tx.originalAmount().value());
                }
                statement.setString(22, tx.detailsOfCharges());
                statement.setString(23, tx.chargesAccount());
                if (tx.exchangeRate() == null) {
                    statement.setNull(24, Types.NUMERIC);
                } else {
                    statement.setBigDecimal(24, tx.exchangeRate());
                }
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
        if (keyMaterial.startsWith("${")) {
            throw new IllegalStateException(
                    "encryptionSecretRef llegó sin resolver: '" + keyMaterial
                            + "'. La configuración debe pasar por JsonConfigurationMapper.toMap() "
                            + "para expandir ${secret:...} antes de invocar al provider.");
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

    private String partyValue(Mt101Message.Party party) {
        if (party == null) {
            return null;
        }
        if (party.bic() != null && !party.bic().isBlank()) {
            return party.bic();
        }
        if (party.account() != null && !party.account().isBlank()) {
            return party.account();
        }
        if (party.nameAndAddress() != null && !party.nameAndAddress().isEmpty()) {
            return String.join("\n", party.nameAndAddress());
        }
        return null;
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
