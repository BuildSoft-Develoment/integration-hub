package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-008, T-016
 */
class Mt101ParseTaskProviderTest {

    private Mt101ParseTaskProvider provider;

    @BeforeEach
    void setUp() {
        provider = new Mt101ParseTaskProvider();
    }

    @Test
    void parsesEnvelopeSequenceAAndTransactionsFromRawRecord() {
        var raw = buildRawRecord();
        var context = newContextWithReadResult(List.of(raw));

        var result = provider.execute(context, Map.of("executionMode", "once"));

        assertTrue(result.success(), () -> "expected success: " + result.details());
        assertEquals(1, result.outputs().get("messageCount"));
        assertEquals(2, result.outputs().get("transactionCount"));
        assertEquals(0, result.outputs().get("errorCount"));

        @SuppressWarnings("unchecked")
        var messages = (List<Mt101Message>) result.outputs().get("records");
        var message = messages.get(0);

        // Envelope.
        assertNotNull(message.envelope());
        assertEquals("SGOBFRPPAXXX", message.envelope().senderLt());
        assertEquals("BCPLPEPLXXXX", message.envelope().receiverLt());
        assertEquals("3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c", message.envelope().uetr());

        // Sequence A.
        assertEquals("PROC-1", message.sequenceA().sendersReference());
        assertEquals(1, message.sequenceA().messageIndex());
        assertEquals(1, message.sequenceA().messageTotal());
        assertEquals(LocalDate.of(2026, 6, 9), message.sequenceA().requestedExecutionDate());
        assertNotNull(message.sequenceA().orderingCustomer());
        assertEquals("H", message.sequenceA().orderingCustomer().option());
        assertEquals("001-10200200", message.sequenceA().orderingCustomer().account());

        // Transacciones.
        assertEquals(2, message.transactions().size());
        var tx1 = message.transactions().get(0);
        assertEquals("TX-001", tx1.transactionReference());
        assertEquals("PEN", tx1.amount().currency());
        assertEquals(new BigDecimal("20000"), tx1.amount().value());
        assertEquals("OUR", tx1.detailsOfCharges());
        assertNotNull(tx1.beneficiary());
        assertEquals("0072-987654321", tx1.beneficiary().account());

        var tx2 = message.transactions().get(1);
        assertEquals("TX-002", tx2.transactionReference());
        assertEquals(new BigDecimal("15500.5"), tx2.amount().value());
        assertEquals("SHA", tx2.detailsOfCharges());

        // Control totals.
        assertEquals(new BigDecimal("35500.5"), message.controlTotals().totalsByCurrency().get("PEN"));
    }

    @Test
    void emitsErrorForMalformedRecordWithoutAbortingBatch() {
        var raw = new LinkedHashMap<String, Object>();
        raw.put("sequenceA", "not-a-map"); // intentional bad shape
        raw.put("sequenceB", List.of());
        var context = newContextWithReadResult(List.of(new ReadRecord(raw), buildRawRecord()));

        var result = provider.execute(context, Map.of("executionMode", "once"));

        assertFalse(result.success(),
                "1 record falla; el batch debe marcarse failure pero continuar con el segundo");
        assertEquals(1, result.outputs().get("messageCount"),
                "el record valido debe parsearse igual");
        assertEquals(1, result.outputs().get("errorCount"));
    }

    @Test
    void skipsWhenNoRawRecords() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("readResult", new ReadResult(List.of(), 0));
        context.attributes().put("taskOutputs", Map.of());
        var result = provider.execute(context, Map.of("executionMode", "once"));
        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
    }

    @Test
    void readsFromTaskOutputsWhenInputConfigured() {
        var raw = buildRawRecord();
        var context = new TaskContext(1L, 1L);
        // No readResult disponible (caso embebido):
        context.attributes().put("taskOutputs", Map.of("read-swift.records", List.of(raw)));

        var result = provider.execute(context, Map.of(
                "executionMode", "once",
                "input", Map.of("sourceTaskRef", "read-swift", "sourceOutput", "records")));

        assertTrue(result.success());
        @SuppressWarnings("unchecked")
        var messages = (List<Mt101Message>) result.outputs().get("records");
        assertEquals(1, messages.size());
        assertEquals("PROC-1", messages.get(0).sequenceA().sendersReference());
    }

    @Test
    void preservesNullsForOptionalFields() {
        // Mensaje minimo sin block3 ni 21R ni FX.
        var raw = new LinkedHashMap<String, Object>();
        raw.put("block1", "F01XXXXXXXXXXXX0000000000");
        raw.put("block2", "I101YYYYYYYYYYYYN");
        raw.put("sequenceA", new LinkedHashMap<>(Map.of(
                "20", "MIN",
                "28D", "1/1",
                "30", "260101",
                "50H", "/A\nNAME")));
        raw.put("sequenceB", List.of(new LinkedHashMap<>(Map.of(
                "21", "T1",
                "32B", "USD100,",
                "59", "/B\nBEN",
                "71A", "OUR"))));

        var result = provider.execute(newContextWithReadResult(List.of(new ReadRecord(raw))),
                Map.of("executionMode", "once"));

        assertTrue(result.success());
        @SuppressWarnings("unchecked")
        var messages = (List<Mt101Message>) result.outputs().get("records");
        var msg = messages.get(0);
        assertNull(msg.envelope().uetr(), "sin block3 no debe inventar uetr");
        assertNull(msg.sequenceA().customerSpecifiedReference());
        assertNull(msg.transactions().get(0).fxDealReference());
    }

    // --- helpers ---

    private TaskContext newContextWithReadResult(List<ReadRecord> records) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("readResult", new ReadResult(records, records.size()));
        context.attributes().put("taskOutputs", Map.of());
        return context;
    }

    /** Reproduce el shape que produce {@code SwiftMtReaderProvider} para un MT101 tipico. */
    private ReadRecord buildRawRecord() {
        var values = new LinkedHashMap<String, Object>();
        values.put("block1", "F01SGOBFRPPAXXX0000000000");
        values.put("block2", "I101BCPLPEPLXXXXN");
        values.put("block3", new LinkedHashMap<>(Map.of("121", "3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c")));
        var seqA = new LinkedHashMap<String, String>();
        seqA.put("20", "PROC-1");
        seqA.put("28D", "1/1");
        seqA.put("30", "260609");
        seqA.put("50H", "/001-10200200\nEMPRESA INTEGRADORA SAC\nLIMA PE");
        seqA.put("52A", "BCPLPEPLXXX");
        values.put("sequenceA", seqA);
        var seqB = new java.util.ArrayList<Map<String, String>>();
        var tx1 = new LinkedHashMap<String, String>();
        tx1.put("21", "TX-001");
        tx1.put("32B", "PEN20000,");
        tx1.put("57A", "BCPLPEPL");
        tx1.put("59", "/0072-987654321\nJUAN PEREZ");
        tx1.put("70", "SUELDO MAYO");
        tx1.put("71A", "OUR");
        seqB.add(tx1);
        var tx2 = new LinkedHashMap<String, String>();
        tx2.put("21", "TX-002");
        tx2.put("32B", "PEN15500,5");
        tx2.put("57A", "BBVAPEPLXXX");
        tx2.put("59", "/0011-123456789\nMARIA GARCIA");
        tx2.put("70", "PROVEEDOR");
        tx2.put("71A", "SHA");
        seqB.add(tx2);
        values.put("sequenceB", seqB);
        values.put("block5", new LinkedHashMap<>(Map.of("CHK", "000000000000")));
        return new ReadRecord(values);
    }
}
