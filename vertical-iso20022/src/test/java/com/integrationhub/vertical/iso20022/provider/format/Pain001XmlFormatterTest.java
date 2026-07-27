package com.integrationhub.vertical.iso20022.provider.format;

import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos T-027 (placeholder activado)
 * @covers ADR-009 (sub-catalogo iso20022/ bootstrap)
 */
class Pain001XmlFormatterTest {

    private Pain001XmlFormatter formatter;

    @BeforeEach
    void setUp() {
        formatter = new Pain001XmlFormatter();
    }

    @Test
    void formatIdIsPain001Xml() {
        assertEquals("PAIN001_XML", formatter.format());
    }

    @Test
    void emitsDocumentWithCorrectNamespaceAndRoot() {
        var xml = formatter.format(sampleMessage());
        assertTrue(xml.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
        assertTrue(xml.contains("<Document xmlns=\"urn:iso:std:iso:20022:tech:xsd:pain.001.001.09\">"));
        assertTrue(xml.contains("<CstmrCdtTrfInitn>"));
        assertTrue(xml.endsWith("</Document>"));
    }

    @Test
    void groupHeaderHasMessageIdAndControlSum() {
        var xml = formatter.format(sampleMessage());
        assertTrue(xml.contains("<MsgId>PROC-42</MsgId>"));
        assertTrue(xml.contains("<NbOfTxs>2</NbOfTxs>"));
        // Suma de 20000 + 15500.50 = 35500.50
        assertTrue(xml.contains("<CtrlSum>35500.50</CtrlSum>"));
    }

    @Test
    void paymentInfoHasDebtorAndDebtorAgent() {
        var xml = formatter.format(sampleMessage());
        assertTrue(xml.contains("<PmtInfId>PROC-42</PmtInfId>"));
        assertTrue(xml.contains("<PmtMtd>TRF</PmtMtd>"));
        assertTrue(xml.contains("<Dbtr>"));
        assertTrue(xml.contains("<Nm>EMPRESA INTEGRADORA SAC</Nm>"));
        assertTrue(xml.contains("<DbtrAcct>"));
        assertTrue(xml.contains("<Id>001-10200200</Id>"));
        assertTrue(xml.contains("<DbtrAgt>"));
        assertTrue(xml.contains("<BICFI>BCPLPEPLXXX</BICFI>"));
    }

    @Test
    void eachTransactionMapsToCreditTransferElement() {
        var xml = formatter.format(sampleMessage());
        // 2 transacciones.
        var firstTx = xml.indexOf("<CdtTrfTxInf>");
        var secondTx = xml.indexOf("<CdtTrfTxInf>", firstTx + 1);
        assertTrue(firstTx > 0);
        assertTrue(secondTx > firstTx);
        // Importe + Ccy + beneficiario.
        assertTrue(xml.contains("<InstdAmt Ccy=\"PEN\">20000.00</InstdAmt>"));
        assertTrue(xml.contains("<EndToEndId>TX-001</EndToEndId>"));
        assertTrue(xml.contains("<EndToEndId>TX-002</EndToEndId>"));
        assertTrue(xml.contains("<Nm>JUAN PEREZ</Nm>"));
        assertTrue(xml.contains("<Id>0072-987654321</Id>"));
    }

    @Test
    void translatesMt71aChargesToChrgBr() {
        var xml = formatter.format(sampleMessage());
        // OUR -> DEBT, SHA -> SHAR
        assertTrue(xml.contains("<ChrgBr>DEBT</ChrgBr>"));
        assertTrue(xml.contains("<ChrgBr>SHAR</ChrgBr>"));
    }

    @Test
    void translatesBenChargesToCred() {
        var message = singleTransactionMessage("BEN");
        var xml = formatter.format(message);
        assertTrue(xml.contains("<ChrgBr>CRED</ChrgBr>"));
    }

    @Test
    void unknownChargesFallsBackToSlev() {
        var message = singleTransactionMessage("XYZ");
        var xml = formatter.format(message);
        assertTrue(xml.contains("<ChrgBr>SLEV</ChrgBr>"));
    }

    @Test
    void escapesXmlSpecialChars() {
        var message = new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", null, "N"),
                new Mt101Message.SequenceA("REF&1", null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("Smith & Sons <Co.>")),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-1", null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC", null, List.of("Path/With > & \" chars")),
                        "Concepto con & y <tags>", null, null, "OUR", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100"))),
                null, null);

        var xml = formatter.format(message);
        assertTrue(xml.contains("Smith &amp; Sons &lt;Co.&gt;"));
        assertTrue(xml.contains("Concepto con &amp; y &lt;tags&gt;"));
        assertFalse(xml.contains("Smith & Sons <Co.>"));
    }

    @Test
    void rejectsNullMessage() {
        assertThrows(IllegalArgumentException.class, () -> formatter.format(null));
    }

    // --- helpers ---

    private Mt101Message sampleMessage() {
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-1", "N"),
                new Mt101Message.SequenceA("PROC-42", null, 1, 1, LocalDate.of(2026, 6, 9),
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
                new Mt101Message.ControlTotals(2, Map.of("PEN", new BigDecimal("35500.50"))),
                null, null);
    }

    private Mt101Message singleTransactionMessage(String charges) {
        return new Mt101Message(
                new Mt101Message.Envelope("AAA", "BBB", null, "N"),
                new Mt101Message.SequenceA("REF", null, 1, 1, LocalDate.of(2026, 6, 9),
                        null,
                        new Mt101Message.Party("H", "001", null, List.of("X")),
                        null, null),
                List.of(new Mt101Message.Transaction(
                        1, "T1", null, null,
                        new Mt101Message.Amount("USD", new BigDecimal("10")),
                        null, null, null, null,
                        new Mt101Message.Party("", "A", null, List.of("B")),
                        "x", null, null, charges, null, null)),
                new Mt101Message.ControlTotals(1, Map.of("USD", new BigDecimal("10"))),
                null, null);
    }
}
