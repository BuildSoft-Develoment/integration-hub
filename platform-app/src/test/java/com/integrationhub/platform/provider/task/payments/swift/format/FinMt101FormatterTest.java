package com.integrationhub.platform.provider.task.payments.swift.format;

import com.integrationhub.platform.spi.payments.Mt101Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-001, T-006
 */
class FinMt101FormatterTest {

    private FinMt101Formatter formatter;

    @BeforeEach
    void setUp() {
        formatter = new FinMt101Formatter();
    }

    @Test
    void emitsAllFiveBlocks() {
        var output = formatter.format(sampleMessage());
        assertTrue(output.startsWith("{1:F01SGOBFRPPAXXX0000000000}"));
        assertTrue(output.contains("{2:I101BCPLPEPLXXXXN}"));
        assertTrue(output.contains("{3:{121:"));
        assertTrue(output.contains("{4:\r\n"));
        assertTrue(output.contains("-}{5:{CHK:000000000000}}"));
    }

    @Test
    void emitsSequenceATagsInOrder() {
        var output = formatter.format(sampleMessage());
        var block4 = output.substring(output.indexOf("{4:"), output.indexOf("-}"));
        assertTrue(block4.contains(":20:PROC-42\r\n"));
        assertTrue(block4.contains(":28D:1/1\r\n"));
        assertTrue(block4.contains(":50H:/001-10200200\r\n"));
        assertTrue(block4.contains("EMPRESA INTEGRADORA SAC\r\n"));
        assertTrue(block4.contains(":52A:BCPLPEPLXXX\r\n"));
        assertTrue(block4.contains(":30:260609\r\n"));
        assertTrue(block4.indexOf(":20:") < block4.indexOf(":28D:"));
        assertTrue(block4.indexOf(":28D:") < block4.indexOf(":30:"));
        assertTrue(block4.indexOf(":30:") < block4.indexOf(":21:"));
    }

    @Test
    void emitsTransactionTagsWithCorrectCharges() {
        var output = formatter.format(sampleMessage());
        assertTrue(output.contains(":21:TX-001\r\n"));
        assertTrue(output.contains(":32B:PEN20000,\r\n"));
        assertTrue(output.contains(":57A:BCPLPEPL\r\n"));
        assertTrue(output.contains(":59:/0072-987654321\r\nJUAN PEREZ\r\n"));
        assertTrue(output.contains(":70:SUELDO MAYO\r\n"));
        assertTrue(output.contains(":71A:OUR\r\n"));
        assertTrue(output.contains(":21:TX-002\r\n"));
        assertTrue(output.contains(":71A:SHA\r\n"));
    }

    @Test
    void formatsDecimalAmountWithCommaSeparator() {
        var message = singleTransactionMessage(new BigDecimal("15500.50"));
        var output = formatter.format(message);
        assertTrue(output.contains(":32B:PEN15500,5\r\n"),
                () -> "expected comma decimal in: " + output);
    }

    @Test
    void formatsIntegerAmountWithTrailingComma() {
        var message = singleTransactionMessage(new BigDecimal("100"));
        var output = formatter.format(message);
        assertTrue(output.contains(":32B:PEN100,\r\n"));
    }

    @Test
    void omitsBlock3WhenNoUetr() {
        var message = sampleMessageWithoutUetr();
        var output = formatter.format(message);
        assertFalse(output.contains("{3:"));
    }

    @Test
    void padsSenderLtWhenShorterThanTwelveChars() {
        var message = new Mt101Message(
                new Mt101Message.Envelope("AAA", "BBB", null, "N"),
                sampleSequenceA(),
                List.of(sampleTransaction()),
                new Mt101Message.ControlTotals(1, Map.of("PEN", BigDecimal.ONE)),
                null, null);
        var output = formatter.format(message);
        assertTrue(output.startsWith("{1:F01AAAXXXXXXXXX0000000000}"));
        assertTrue(output.contains("{2:I101BBBXXXXXXXXXN}"));
    }

    @Test
    void rejectsNullMessage() {
        assertThrows(IllegalArgumentException.class, () -> formatter.format(null));
    }

    @Test
    void rejectsMessageWithoutSequenceA() {
        var message = new Mt101Message(null, null, List.of(), null, null, null);
        assertThrows(IllegalArgumentException.class, () -> formatter.format(message));
    }

    @Test
    void formatIdIsFin() {
        assertEquals("FIN", formatter.format());
    }

    // --- helpers ---

    private Mt101Message sampleMessage() {
        var totals = new LinkedHashMap<String, BigDecimal>();
        totals.put("PEN", new BigDecimal("35500.50"));
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX",
                        "3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c", "N"),
                sampleSequenceA(),
                List.of(
                        new Mt101Message.Transaction(
                                1, "TX-001", null, null,
                                new Mt101Message.Amount("PEN", new BigDecimal("20000.00")),
                                null, null, null,
                                new Mt101Message.Party("A", null, "BCPLPEPL", List.of()),
                                new Mt101Message.Party("", "0072-987654321", null, List.of("JUAN PEREZ")),
                                "SUELDO MAYO", null, null, "OUR", null, null),
                        new Mt101Message.Transaction(
                                2, "TX-002", null, null,
                                new Mt101Message.Amount("PEN", new BigDecimal("15500.50")),
                                null, null, null,
                                new Mt101Message.Party("A", null, "BBVAPEPLXXX", List.of()),
                                new Mt101Message.Party("", "0011-123456789", null, List.of("MARIA GARCIA")),
                                "PROVEEDOR", null, null, "SHA", null, null)),
                new Mt101Message.ControlTotals(2, totals),
                null, null);
    }

    private Mt101Message sampleMessageWithoutUetr() {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", null, "N"),
                sampleSequenceA(),
                List.of(sampleTransaction()),
                new Mt101Message.ControlTotals(1, Map.of("PEN", BigDecimal.ONE)),
                null, null);
    }

    private Mt101Message singleTransactionMessage(BigDecimal amount) {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", null, "N"),
                sampleSequenceA(),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", amount),
                        null, null, null, null,
                        new Mt101Message.Party("", "X", null, List.of()),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", amount)),
                null, null);
    }

    private Mt101Message.SequenceA sampleSequenceA() {
        return new Mt101Message.SequenceA(
                "PROC-42", null, 1, 1,
                LocalDate.of(2026, 6, 9),
                null,
                new Mt101Message.Party("H", "001-10200200", null,
                        List.of("EMPRESA INTEGRADORA SAC")),
                new Mt101Message.Party("A", null, "BCPLPEPLXXX", List.of()),
                null);
    }

    private Mt101Message.Transaction sampleTransaction() {
        return new Mt101Message.Transaction(
                1, "TX-1", null, null,
                new Mt101Message.Amount("PEN", BigDecimal.ONE),
                null, null, null, null,
                new Mt101Message.Party("", "X", null, List.of()),
                null, null, null, "OUR", null, null);
    }
}
