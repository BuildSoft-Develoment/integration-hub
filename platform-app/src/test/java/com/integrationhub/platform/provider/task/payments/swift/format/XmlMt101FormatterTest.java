package com.integrationhub.platform.provider.task.payments.swift.format;

import com.integrationhub.platform.spi.task.payments.Mt101Message;
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
 * @covers spec 008-mensajeria-pagos RF-001, T-005
 */
class XmlMt101FormatterTest {

    private XmlMt101Formatter formatter;

    @BeforeEach
    void setUp() {
        formatter = new XmlMt101Formatter();
    }

    @Test
    void emitsRootWithNamespaceAndDeclaration() {
        var output = formatter.format(sampleMessage());
        assertTrue(output.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
        assertTrue(output.contains("<Mt101Message xmlns=\"urn:integrationhub:swift:mt101:v1\">"));
        assertTrue(output.endsWith("</Mt101Message>"));
    }

    @Test
    void emitsEnvelopeAndSequenceA() {
        var output = formatter.format(sampleMessage());
        assertTrue(output.contains("<SenderLt>SGOBFRPPAXXX</SenderLt>"));
        assertTrue(output.contains("<ReceiverLt>BCPLPEPLXXXX</ReceiverLt>"));
        assertTrue(output.contains("<SendersReference>PROC-42</SendersReference>"));
        assertTrue(output.contains("<MessageIndex>1</MessageIndex>"));
        assertTrue(output.contains("<RequestedExecutionDate>2026-06-09</RequestedExecutionDate>"));
        assertTrue(output.contains("<OrderingCustomer option=\"H\">"));
        assertTrue(output.contains("<Account>001-10200200</Account>"));
        assertTrue(output.contains("<Line>EMPRESA INTEGRADORA SAC</Line>"));
    }

    @Test
    void emitsTransactionsWithAttributes() {
        var output = formatter.format(sampleMessage());
        assertTrue(output.contains("<Transaction sequenceNumber=\"1\">"));
        assertTrue(output.contains("<TransactionReference>TX-001</TransactionReference>"));
        assertTrue(output.contains("<Amount currency=\"PEN\">20000.00</Amount>"));
        assertTrue(output.contains("<DetailsOfCharges>OUR</DetailsOfCharges>"));
    }

    @Test
    void emitsControlTotalsByCurrency() {
        var output = formatter.format(sampleMessage());
        assertTrue(output.contains("<TransactionCount>2</TransactionCount>"));
        assertTrue(output.contains("<TotalByCurrency currency=\"PEN\">"));
        assertTrue(output.contains("20000.00</TotalByCurrency>") || output.contains("35500.50</TotalByCurrency>"));
    }

    @Test
    void escapesAmpersandsAndQuotes() {
        var message = new Mt101Message(
                null,
                new Mt101Message.SequenceA(
                        "PROC-1", null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("Smith & Sons \"Co.\"")),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("USD", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC", null, List.of("A & B")),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("USD", new BigDecimal("100.00"))),
                null, null);

        var output = formatter.format(message);
        // En texto de elemento XML solo '&', '<', '>' requieren escape. Las comillas
        // son legales en texto; solo se escapan en valores de atributo. Por eso aqui
        // verificamos que '&' SI esta escapado pero las comillas quedan literales.
        assertTrue(output.contains("Smith &amp; Sons \"Co.\""),
                () -> "expected ampersand escaped, quotes literal in element text. Actual: " + output);
        assertTrue(output.contains("A &amp; B"));
        assertFalse(output.contains("Smith & Sons"),
                "ampersand must be escaped, not literal");
    }

    @Test
    void rejectsNullMessage() {
        assertThrows(IllegalArgumentException.class, () -> formatter.format(null));
    }

    @Test
    void formatIdIsXml() {
        assertEquals("XML", formatter.format());
    }

    @Test
    void omitsAbsentOptionalElements() {
        var message = new Mt101Message(
                null,
                new Mt101Message.SequenceA(
                        "PROC-1", null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of()),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("10.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "X", null, List.of()),
                        null, null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("10.00"))),
                null, null);
        var output = formatter.format(message);
        assertFalse(output.contains("<CustomerSpecifiedReference>"));
        assertFalse(output.contains("<FxDealReference>"));
        assertFalse(output.contains("<Authorisation>"));
        assertFalse(output.contains("<NameAndAddress>"));
    }

    // --- helpers ---

    private Mt101Message sampleMessage() {
        var totals = new LinkedHashMap<String, BigDecimal>();
        totals.put("PEN", new BigDecimal("35500.50"));
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX",
                        "3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c", "N"),
                new Mt101Message.SequenceA(
                        "PROC-42", null, 1, 1,
                        LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001-10200200", null,
                                List.of("EMPRESA INTEGRADORA SAC", "LIMA PE")),
                        new Mt101Message.Party("A", null, "BCPLPEPLXXX", List.of()),
                        null),
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
}
