package com.integrationhub.platform.provider.task.payments.iso20022;

import com.integrationhub.platform.provider.task.payments.iso20022.mapper.Pain001ToMt101Mapper;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-008 (inbound pain.001)
 */
class Pain001ParseTaskProviderTest {

    private Pain001ParseTaskProvider provider;

    @BeforeEach
    void setUp() {
        provider = new Pain001ParseTaskProvider(new Pain001ToMt101Mapper());
    }

    @Test
    void typeIsPain001Parse() {
        assertEquals("PAIN001_PARSE", provider.type());
    }

    @Test
    void mapsReaderRecordToMt101MessageWithExpectedOutputs() {
        var record = new ReadRecord(painShape("M-1", "2026-06-09", List.of(
                txShape("TX-1", "100.50", "PEN", "DEBT"),
                txShape("TX-2", "250.00", "PEN", "SHAR")
        )));
        var context = new TaskContext(1L, 1L);

        var result = provider.executeRecords(context, Map.of(), List.of(record), null);

        assertTrue(result.success(), () -> "expected success but: " + result.details());
        assertEquals(1, result.outputs().get("messageCount"));
        assertEquals(2, result.outputs().get("transactionCount"));
        assertEquals(0, result.outputs().get("errorCount"));

        @SuppressWarnings("unchecked")
        var totals = (Map<String, BigDecimal>) result.outputs().get("totalsByCurrency");
        assertEquals(new BigDecimal("350.50"), totals.get("PEN"));

        @SuppressWarnings("unchecked")
        var records = (List<Mt101Message>) result.outputs().get("records");
        assertEquals(1, records.size());
        assertEquals("PAIN001_XML", records.get(0).format());
        assertEquals("M-1", records.get(0).sequenceA().sendersReference());
        assertEquals("OUR", records.get(0).transactions().get(0).detailsOfCharges());
        assertEquals("SHA", records.get(0).transactions().get(1).detailsOfCharges());

        @SuppressWarnings("unchecked")
        var headers = (List<Mt101Message.SequenceA>) result.outputs().get("headers");
        @SuppressWarnings("unchecked")
        var transactions = (List<Mt101Message.Transaction>) result.outputs().get("transactions");
        assertEquals(1, headers.size());
        assertEquals(2, transactions.size(), "transactions output aplana todas las txs de todos los mensajes");
    }

    @Test
    void readsFromTaskOutputsWhenReaderResultEmpty() {
        var painRecord = new ReadRecord(painShape("FROM-TASK", null, List.of(
                txShape("X-1", "5.00", "USD", "CRED")
        )));
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("ingest-pain001.records", List.of(painRecord)));

        var result = provider.executeRecords(context, Map.of(
                "input", Map.of("sourceTaskRef", "ingest-pain001", "sourceOutput", "records")
        ), List.of(), null);

        assertTrue(result.success());
        @SuppressWarnings("unchecked")
        var records = (List<Mt101Message>) result.outputs().get("records");
        assertEquals(1, records.size());
        assertEquals("FROM-TASK", records.get(0).sequenceA().sendersReference());
        assertEquals("BEN", records.get(0).transactions().get(0).detailsOfCharges());
    }

    @Test
    void acceptsTaskOutputItemsAsMapsAndConvertsToReadRecord() {
        var rawMap = painShape("FROM-MAP", null, List.of(
                txShape("X-1", "1.00", "EUR", null)
        ));
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("upstream.records", List.of(rawMap)));

        var result = provider.executeRecords(context, Map.of(
                "input", Map.of("sourceTaskRef", "upstream")
        ), List.of(), null);

        @SuppressWarnings("unchecked")
        var records = (List<Mt101Message>) result.outputs().get("records");
        assertEquals("FROM-MAP", records.get(0).sequenceA().sendersReference());
    }

    @Test
    void capturesPerRecordMappingErrorsWithoutFailingWholeBatch() {
        var good = new ReadRecord(painShape("OK", null, List.of(
                txShape("T", "1.00", "PEN", "DEBT")
        )));
        var brokenAmount = new ReadRecord(painShape("BAD-AMT", null, List.of(
                txShape("T", "not-a-number", "PEN", "DEBT")
        )));
        var context = new TaskContext(1L, 1L);

        var result = provider.executeRecords(context, Map.of(), List.of(good, brokenAmount), null);

        assertFalse(result.success(), "batch con errores debe reportar failure");
        assertEquals(1, result.outputs().get("messageCount"));
        assertEquals(1, result.outputs().get("errorCount"));
        @SuppressWarnings("unchecked")
        var errors = (List<Map<String, Object>>) result.outputs().get("errors");
        assertEquals(1, errors.get(0).get("recordIndex"));
        assertNotNull(errors.get(0).get("error"));
    }

    @Test
    void skipsWhenNoRecords() {
        var context = new TaskContext(1L, 1L);
        var result = provider.executeRecords(context, Map.of(), List.of(), null);
        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
    }

    // --- helpers ---

    private Map<String, Object> painShape(String messageId, String requestedExecutionDate,
                                          List<Map<String, Object>> transactions) {
        var shape = new LinkedHashMap<String, Object>();
        shape.put("messageId", messageId);
        var pmtInf = new LinkedHashMap<String, Object>();
        pmtInf.put("paymentInfoId", messageId);
        pmtInf.put("paymentMethod", "TRF");
        if (requestedExecutionDate != null) pmtInf.put("requestedExecutionDate", requestedExecutionDate);
        pmtInf.put("transactions", transactions);
        shape.put("paymentInformation", pmtInf);
        return shape;
    }

    private Map<String, Object> txShape(String endToEndId, String amount, String currency, String chargeBearer) {
        var tx = new LinkedHashMap<String, Object>();
        tx.put("endToEndId", endToEndId);
        tx.put("amount", amount);
        tx.put("currency", currency);
        if (chargeBearer != null) tx.put("chargeBearer", chargeBearer);
        return tx;
    }
}
