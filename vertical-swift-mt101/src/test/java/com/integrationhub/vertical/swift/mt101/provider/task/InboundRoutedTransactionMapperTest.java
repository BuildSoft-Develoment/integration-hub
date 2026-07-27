package com.integrationhub.vertical.swift.mt101.provider.task;

import com.integrationhub.vertical.swift.mt101.provider.InboundRoutedTransactionMapper;

import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Cubre el mapeo del dominio SWIFT a filas de {@code inbound_routed_transaction}: una fila por transaccion,
 * campos de cabecera ({@code sendersReference}/{@code uetr}) compartidos, campos por-transaccion tomados de la
 * secuencia B, y null-safety de {@code sequenceA}/{@code envelope}/{@code beneficiary}/{@code amount}.
 */
class InboundRoutedTransactionMapperTest {

    private final InboundRoutedTransactionMapper mapper = new InboundRoutedTransactionMapper();

    private Mt101Message.Transaction tx(String ref, Mt101Message.Amount amount, Mt101Message.Party beneficiary) {
        return new Mt101Message.Transaction(1, ref, null, null, amount, null, null, null, null, beneficiary,
                null, null, null, null, null, null);
    }

    private Mt101Message.SequenceA seqA(String sendersReference) {
        return new Mt101Message.SequenceA(sendersReference, null, 1, 1, null, null, null, null, null);
    }

    @Test
    void mapsHeaderAndPerTransactionFields() {
        var beneficiary = new Mt101Message.Party("A", "ACC-9", "BENEBIC", List.of("Beneficiary Name", "Line 2"));
        var message = new Mt101Message(
                new Mt101Message.Envelope("SND", "RCV", "UETR-1", "N"),
                seqA("REF-100"),
                List.of(
                        tx("TX-1", new Mt101Message.Amount("USD", new BigDecimal("100.50")), beneficiary),
                        tx("TX-2", new Mt101Message.Amount("EUR", new BigDecimal("42.00")), null)),
                null, "{}", "JSON");

        var rows = mapper.toRows(message, "INB-7", 55L, "BOOK_TRANSFER");

        assertEquals(2, rows.size());
        var first = rows.get(0);
        assertEquals("INB-7", first.inboundSetId());
        assertEquals(55L, first.processExecutionId());
        assertEquals("REF-100", first.sendersReference());
        assertEquals("UETR-1", first.uetr());
        assertEquals("BOOK_TRANSFER", first.routedAs());
        assertEquals("TX-1", first.transactionReference());
        assertEquals("ACC-9", first.account());
        assertEquals("Beneficiary Name", first.beneficiaryName());
        assertEquals("USD", first.amountCurrency());
        assertEquals(new BigDecimal("100.50"), first.amountValue());

        var second = rows.get(1);
        assertEquals("TX-2", second.transactionReference());
        assertEquals("EUR", second.amountCurrency());
        // Cabecera (sendersReference/uetr) compartida por todas las filas del mensaje.
        assertEquals("REF-100", second.sendersReference());
        assertEquals("UETR-1", second.uetr());
        // Sin beneficiario -> account/nombre nulos.
        assertNull(second.account());
        assertNull(second.beneficiaryName());
    }

    @Test
    void nullSequenceAndEnvelopeYieldNullHeaderFields() {
        var message = new Mt101Message(null, null,
                List.of(tx("TX-9", null, null)), null, "{}", "JSON");

        var rows = mapper.toRows(message, "INB-1", 1L, "REJECT");

        assertEquals(1, rows.size());
        var row = rows.get(0);
        assertNull(row.sendersReference());
        assertNull(row.uetr());
        // Sin amount -> currency/value nulos.
        assertNull(row.amountCurrency());
        assertNull(row.amountValue());
        assertEquals("REJECT", row.routedAs());
    }

    @Test
    void beneficiaryWithoutNameYieldsNullBeneficiaryName() {
        var beneficiary = new Mt101Message.Party("A", "ACC-1", "BIC", List.of());
        var message = new Mt101Message(null, seqA("R"),
                List.of(tx("TX-1", null, beneficiary)), null, "{}", "JSON");

        var rows = mapper.toRows(message, "INB-1", 1L, "X");

        assertEquals("ACC-1", rows.get(0).account());
        assertNull(rows.get(0).beneficiaryName());
    }

    @Test
    void emptyTransactionsYieldEmptyRows() {
        var message = new Mt101Message(null, seqA("R"), List.of(), null, "{}", "JSON");
        assertTrue(mapper.toRows(message, "INB-1", 1L, "X").isEmpty());
    }
}
