package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.spi.task.payments.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-009, T-023
 */
class Mt101SplitTaskProviderTest {

    private Mt101SplitTaskProvider provider;

    @BeforeEach
    void setUp() {
        provider = new Mt101SplitTaskProvider();
    }

    @Test
    void passesThroughSmallMessageWithoutSplitting() {
        var message = messageWithTransactions(50);
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100));

        assertTrue(result.success());
        assertEquals(1, result.outputs().get("inputMessageCount"));
        assertEquals(0, result.outputs().get("splitMessageCount"));
        assertEquals(1, result.outputs().get("passthroughCount"));
        assertEquals(1, result.outputs().get("outputFragmentCount"));

        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) result.outputs().get("records");
        assertEquals(message, fragments.get(0), "passthrough must return same instance");
    }

    @Test
    void splitsByTransactionsAndRebuildsIndexTotal() {
        var message = messageWithTransactions(250);
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100,
                "rebuildIndexTotal", true));

        assertEquals(1, result.outputs().get("splitMessageCount"));
        assertEquals(3, result.outputs().get("outputFragmentCount"), "250/100 -> 3 fragments");

        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) result.outputs().get("records");
        // 100 + 100 + 50.
        assertEquals(100, fragments.get(0).transactions().size());
        assertEquals(100, fragments.get(1).transactions().size());
        assertEquals(50, fragments.get(2).transactions().size());

        // Index/total reescrito.
        assertEquals(1, fragments.get(0).sequenceA().messageIndex());
        assertEquals(3, fragments.get(0).sequenceA().messageTotal());
        assertEquals(2, fragments.get(1).sequenceA().messageIndex());
        assertEquals(3, fragments.get(2).sequenceA().messageIndex());

        // Senders reference distinto por fragmento (template default).
        assertNotEquals(fragments.get(0).sequenceA().sendersReference(),
                fragments.get(1).sequenceA().sendersReference());
    }

    @Test
    void respectsRebuildIndexTotalFalse() {
        var message = messageWithTransactions(120);
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100,
                "rebuildIndexTotal", false));

        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) result.outputs().get("records");
        // Mismo index/total que el original (1/1) - el caller controla la metadata.
        assertEquals(1, fragments.get(0).sequenceA().messageIndex());
        assertEquals(1, fragments.get(0).sequenceA().messageTotal());
    }

    @Test
    void truncatesSendersReferenceTo16Chars() {
        // Original senders_reference de 14 chars + "-2" del template = 16 chars exactos.
        var message = messageWithRef("LONG-REFERENCE", 200);
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100));

        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) result.outputs().get("records");
        for (var fragment : fragments) {
            assertTrue(fragment.sequenceA().sendersReference().length() <= 16,
                    "fragment ref must be <=16 chars: " + fragment.sequenceA().sendersReference());
        }
    }

    @Test
    void usesCustomFragmentReferenceTemplate() {
        var message = messageWithRef("REF", 200);
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 100,
                "fragmentReferenceTemplate", "F${fragmentIndex}-${sendersReference}"));

        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) result.outputs().get("records");
        assertEquals("F1-REF", fragments.get(0).sequenceA().sendersReference());
        assertEquals("F2-REF", fragments.get(1).sequenceA().sendersReference());
    }

    @Test
    void splitsByBytesWhenPayloadExceedsMaxBytes() {
        // Mensaje con 20 txs y rawPayload grande; maxBytes pequeno fuerza split.
        var raw = "X".repeat(2000);
        var message = new Mt101Message(
                envelope(), sequenceA("BIG", 1, 1),
                makeTransactions(20),
                new Mt101Message.ControlTotals(20, Map.of("PEN", BigDecimal.ONE)),
                raw, "JSON");
        var context = contextWith(List.of(message));

        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records"),
                "maxTransactionsPerFragment", 9999,
                "maxBytesPerFragment", 500));

        // 2000 bytes / 20 tx = 100 bytes/tx; 500/100 = 5 tx/fragment; 20/5 = 4 fragments.
        assertEquals(4, result.outputs().get("outputFragmentCount"));
        @SuppressWarnings("unchecked")
        var fragments = (List<Mt101Message>) result.outputs().get("records");
        assertEquals(5, fragments.get(0).transactions().size());
    }

    @Test
    void skipsWhenNoMessages() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of());
        var result = provider.execute(context, Map.of(
                "input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "records")));
        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
    }

    @Test
    void rejectsWhenInputMissing() {
        var context = contextWith(List.of(messageWithTransactions(10)));
        assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of()));
    }

    // --- helpers ---

    private TaskContext contextWith(List<Mt101Message> messages) {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("build-mt101.records", messages));
        return context;
    }

    private Mt101Message messageWithTransactions(int count) {
        return messageWithRef("PROC-1", count);
    }

    private Mt101Message messageWithRef(String reference, int count) {
        return new Mt101Message(
                envelope(), sequenceA(reference, 1, 1),
                makeTransactions(count),
                new Mt101Message.ControlTotals(count, Map.of("PEN", BigDecimal.valueOf(count * 100L))),
                "{\"x\":1}", "JSON");
    }

    private Mt101Message.Envelope envelope() {
        return new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-1", "N");
    }

    private Mt101Message.SequenceA sequenceA(String reference, int index, int total) {
        return new Mt101Message.SequenceA(reference, null, index, total, LocalDate.of(2026, 6, 9),
                null, new Mt101Message.Party("H", "001", null, List.of("ACME")),
                null, null);
    }

    private List<Mt101Message.Transaction> makeTransactions(int count) {
        var txs = new ArrayList<Mt101Message.Transaction>(count);
        for (int i = 1; i <= count; i++) {
            txs.add(new Mt101Message.Transaction(
                    i, "TX-" + i, null, null,
                    new Mt101Message.Amount("PEN", BigDecimal.valueOf(100L)),
                    null, null, null, null,
                    new Mt101Message.Party("", "ACC-" + i, null, List.of()),
                    null, null, null, "OUR", null, null));
        }
        return txs;
    }
}
