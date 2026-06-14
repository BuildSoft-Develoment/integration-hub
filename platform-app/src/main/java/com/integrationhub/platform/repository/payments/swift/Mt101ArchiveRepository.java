package com.integrationhub.platform.repository.payments.swift;

import com.integrationhub.platform.spi.task.payments.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDate;

/** Repository JDBC para persistir envelopes, archives y transacciones MT101. */
@ApplicationScoped
public class Mt101ArchiveRepository {

    public ArchiveInsertResult insertArchivedMessage(Connection connection,
                                                     Mt101Message message,
                                                     Long processExecutionId,
                                                     String storedPayload,
                                                     String hash,
                                                     int retentionDays) throws SQLException {
        var envelopeId = insertEnvelope(connection, message, hash, processExecutionId, storedPayload);
        var archiveId = insertArchive(connection, message, envelopeId, storedPayload, retentionDays);
        insertTransactions(connection, archiveId, message);
        return new ArchiveInsertResult(archiveId, envelopeId);
    }

    private long insertEnvelope(Connection connection,
                                Mt101Message message,
                                String hash,
                                Long processExecutionId,
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
            if (processExecutionId == null) {
                statement.setNull(9, Types.BIGINT);
            } else {
                statement.setLong(9, processExecutionId);
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
                + "(envelope_id, sender_lt, senders_reference, customer_specified_reference, message_index, message_total, "
                + " requested_execution_date, instructing_party_kind, instructing_party_value, "
                + " ordering_customer_kind, ordering_customer_account, ordering_customer_name_addr, "
                + " account_servicing_kind, account_servicing_value, status, format, retention_until) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            var sequenceA = message.sequenceA();
            var envelope = message.envelope();
            statement.setLong(1, envelopeId);
            statement.setString(2, envelope == null ? null : envelope.senderLt());
            statement.setString(3, sequenceA == null ? null : sequenceA.sendersReference());
            statement.setString(4, sequenceA == null ? null : sequenceA.customerSpecifiedReference());
            if (sequenceA == null) {
                statement.setNull(5, Types.INTEGER);
                statement.setNull(6, Types.INTEGER);
            } else {
                statement.setInt(5, sequenceA.messageIndex());
                statement.setInt(6, sequenceA.messageTotal());
            }
            statement.setObject(7, sequenceA == null ? null : sequenceA.requestedExecutionDate(), Types.DATE);
            var instructingParty = sequenceA == null ? null : sequenceA.instructingParty();
            statement.setString(8, instructingParty == null ? null : instructingParty.option());
            statement.setString(9, partyValue(instructingParty));
            var orderingCustomer = sequenceA == null ? null : sequenceA.orderingCustomer();
            statement.setString(10, orderingCustomer == null ? null : orderingCustomer.option());
            statement.setString(11, orderingCustomer == null ? null : orderingCustomer.account());
            statement.setString(12, orderingCustomer == null ? null
                    : String.join("\n", orderingCustomer.nameAndAddress()));
            var accountServicing = sequenceA == null ? null : sequenceA.accountServicingInstitution();
            statement.setString(13, accountServicing == null ? null : accountServicing.option());
            statement.setString(14, partyValue(accountServicing));
            statement.setString(15, "ARCHIVED");
            statement.setString(16, message.format());
            statement.setObject(17, LocalDate.now().plusDays(retentionDays), Types.DATE);
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

    public record ArchiveInsertResult(long archiveId, long envelopeId) {
    }
}
