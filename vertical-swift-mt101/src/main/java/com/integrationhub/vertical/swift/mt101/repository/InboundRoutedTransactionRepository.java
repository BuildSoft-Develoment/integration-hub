package com.integrationhub.vertical.swift.mt101.repository;

import jakarta.enterprise.context.ApplicationScoped;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;

/** Repository JDBC del sink de negocio inbound ({@code inbound_routed_transaction}). */
@ApplicationScoped
public class InboundRoutedTransactionRepository {

    public void insertBatch(DataSource dataSource, List<Row> rows) throws SQLException {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        var sql = "insert into inbound_routed_transaction "
                + "(inbound_set_id, process_execution_id, senders_reference, transaction_reference, "
                + " account, beneficiary_name, amount_currency, amount_value, uetr, routed_as) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            for (var row : rows) {
                statement.setString(1, row.inboundSetId());
                if (row.processExecutionId() == null) statement.setNull(2, Types.BIGINT);
                else statement.setLong(2, row.processExecutionId());
                statement.setString(3, row.sendersReference());
                statement.setString(4, row.transactionReference());
                statement.setString(5, row.account());
                statement.setString(6, row.beneficiaryName());
                statement.setString(7, row.amountCurrency());
                if (row.amountValue() == null) statement.setNull(8, Types.NUMERIC);
                else statement.setBigDecimal(8, row.amountValue());
                statement.setString(9, row.uetr());
                statement.setString(10, row.routedAs());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    public record Row(
            String inboundSetId,
            Long processExecutionId,
            String sendersReference,
            String transactionReference,
            String account,
            String beneficiaryName,
            String amountCurrency,
            BigDecimal amountValue,
            String uetr,
            String routedAs
    ) {
    }
}
