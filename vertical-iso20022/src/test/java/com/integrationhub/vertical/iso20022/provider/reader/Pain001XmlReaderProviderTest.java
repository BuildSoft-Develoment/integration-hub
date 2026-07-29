package com.integrationhub.vertical.iso20022.provider.reader;

import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.source.SourcePayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 002-catalogo-readers RF-001
 * @covers spec 008-mensajeria-pagos RF-008 (inbound pain.001)
 */
class Pain001XmlReaderProviderTest {

    private Pain001XmlReaderProvider reader;

    @BeforeEach
    void setUp() {
        reader = new Pain001XmlReaderProvider();
    }

    @Test
    void typeIsPain001Xml() {
        assertEquals("PAIN001_XML", reader.type());
    }

    @Test
    void parsesGroupHeaderPaymentInfoAndSingleTransaction() {
        var xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
                  <CstmrCdtTrfInitn>
                    <GrpHdr>
                      <MsgId>PROC-42</MsgId>
                      <CreDtTm>2026-06-09T10:00:00Z</CreDtTm>
                      <NbOfTxs>1</NbOfTxs>
                      <CtrlSum>100.50</CtrlSum>
                      <InitgPty><Nm>ACME SAC</Nm></InitgPty>
                    </GrpHdr>
                    <PmtInf>
                      <PmtInfId>PROC-42</PmtInfId>
                      <PmtMtd>TRF</PmtMtd>
                      <NbOfTxs>1</NbOfTxs>
                      <CtrlSum>100.50</CtrlSum>
                      <ReqdExctnDt><Dt>2026-06-09</Dt></ReqdExctnDt>
                      <Dbtr><Nm>ACME SAC</Nm></Dbtr>
                      <DbtrAcct><Id><Othr><Id>001-10200200</Id></Othr></Id></DbtrAcct>
                      <DbtrAgt><FinInstnId><BICFI>BCPLPEPLXXX</BICFI></FinInstnId></DbtrAgt>
                      <CdtTrfTxInf>
                        <PmtId><EndToEndId>TX-1</EndToEndId></PmtId>
                        <Amt><InstdAmt Ccy="PEN">100.50</InstdAmt></Amt>
                        <ChrgBr>DEBT</ChrgBr>
                        <CdtrAgt><FinInstnId><BICFI>BCPLPEPL</BICFI></FinInstnId></CdtrAgt>
                        <Cdtr><Nm>JUAN PEREZ</Nm></Cdtr>
                        <CdtrAcct><Id><Othr><Id>0072-987654321</Id></Othr></Id></CdtrAcct>
                        <RmtInf><Ustrd>SUELDO MAYO</Ustrd></RmtInf>
                      </CdtTrfTxInf>
                    </PmtInf>
                  </CstmrCdtTrfInitn>
                </Document>
                """;

        var captured = new ArrayList<ReadBatch>();
        var result = reader.readInBatches(
                SourcePayload.fromBytes("p.xml", xml.getBytes(StandardCharsets.UTF_8), "application/xml"),
                Map.of(), 10, captured::add);

        assertEquals(1, result.recordCount());
        assertEquals(1, captured.size());
        var values = captured.get(0).records().get(0).values();

        assertEquals("PROC-42", values.get("messageId"));
        assertEquals("2026-06-09T10:00:00Z", values.get("creationDateTime"));
        assertEquals("1", values.get("numberOfTransactions"));
        assertEquals("100.50", values.get("controlSum"));
        assertEquals("ACME SAC", values.get("initiatingPartyName"));

        @SuppressWarnings("unchecked")
        var pmtInf = (Map<String, Object>) values.get("paymentInformation");
        assertNotNull(pmtInf);
        assertEquals("PROC-42", pmtInf.get("paymentInfoId"));
        assertEquals("TRF", pmtInf.get("paymentMethod"));
        assertEquals("2026-06-09", pmtInf.get("requestedExecutionDate"));
        assertEquals("ACME SAC", pmtInf.get("debtorName"));
        assertEquals("001-10200200", pmtInf.get("debtorAccount"));
        assertEquals("BCPLPEPLXXX", pmtInf.get("debtorAgentBic"));

        @SuppressWarnings("unchecked")
        var txs = (List<Map<String, Object>>) pmtInf.get("transactions");
        assertEquals(1, txs.size());
        var tx = txs.get(0);
        assertEquals("TX-1", tx.get("endToEndId"));
        assertEquals("100.50", tx.get("amount"));
        assertEquals("PEN", tx.get("currency"));
        assertEquals("DEBT", tx.get("chargeBearer"));
        assertEquals("BCPLPEPL", tx.get("creditorAgentBic"));
        assertEquals("JUAN PEREZ", tx.get("creditorName"));
        assertEquals("0072-987654321", tx.get("creditorAccount"));
        assertEquals("SUELDO MAYO", tx.get("remittanceInformation"));
    }

    @Test
    void parsesMultipleTransactionsPreservingOrder() {
        var xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
                  <CstmrCdtTrfInitn>
                    <GrpHdr><MsgId>M-2</MsgId><NbOfTxs>3</NbOfTxs></GrpHdr>
                    <PmtInf>
                      <PmtInfId>M-2</PmtInfId>
                      <PmtMtd>TRF</PmtMtd>
                      <CdtTrfTxInf>
                        <PmtId><EndToEndId>TX-A</EndToEndId></PmtId>
                        <Amt><InstdAmt Ccy="USD">10.00</InstdAmt></Amt>
                        <ChrgBr>SHAR</ChrgBr>
                      </CdtTrfTxInf>
                      <CdtTrfTxInf>
                        <PmtId><EndToEndId>TX-B</EndToEndId></PmtId>
                        <Amt><InstdAmt Ccy="USD">20.00</InstdAmt></Amt>
                        <ChrgBr>CRED</ChrgBr>
                      </CdtTrfTxInf>
                      <CdtTrfTxInf>
                        <PmtId><EndToEndId>TX-C</EndToEndId></PmtId>
                        <Amt><InstdAmt Ccy="USD">30.00</InstdAmt></Amt>
                      </CdtTrfTxInf>
                    </PmtInf>
                  </CstmrCdtTrfInitn>
                </Document>
                """;
        var captured = new ArrayList<ReadBatch>();
        reader.readInBatches(
                SourcePayload.fromBytes("multi.xml", xml.getBytes(StandardCharsets.UTF_8), "application/xml"),
                Map.of(), 10, captured::add);

        @SuppressWarnings("unchecked")
        var pmtInf = (Map<String, Object>) captured.get(0).records().get(0).values().get("paymentInformation");
        @SuppressWarnings("unchecked")
        var txs = (List<Map<String, Object>>) pmtInf.get("transactions");
        assertEquals(List.of("TX-A", "TX-B", "TX-C"),
                txs.stream().map(t -> t.get("endToEndId")).toList());
        assertEquals("SHAR", txs.get(0).get("chargeBearer"));
        assertEquals("CRED", txs.get(1).get("chargeBearer"));
        assertNull(txs.get(2).get("chargeBearer"), "ChrgBr opcional cuando no se especifica");
    }

    @Test
    void omitsBlankAndAbsentElements() {
        var xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
                  <CstmrCdtTrfInitn>
                    <GrpHdr><MsgId>M-3</MsgId></GrpHdr>
                    <PmtInf>
                      <PmtInfId>M-3</PmtInfId>
                      <PmtMtd>TRF</PmtMtd>
                      <CdtTrfTxInf>
                        <PmtId><EndToEndId>T</EndToEndId></PmtId>
                        <Amt><InstdAmt Ccy="EUR">1.00</InstdAmt></Amt>
                      </CdtTrfTxInf>
                    </PmtInf>
                  </CstmrCdtTrfInitn>
                </Document>
                """;
        var captured = new ArrayList<ReadBatch>();
        reader.readInBatches(
                SourcePayload.fromBytes("min.xml", xml.getBytes(StandardCharsets.UTF_8), "application/xml"),
                Map.of(), 10, captured::add);
        var values = captured.get(0).records().get(0).values();
        assertNull(values.get("initiatingPartyName"), "campo omitido cuando ausente");
        assertNull(values.get("controlSum"));
    }

    @Test
    void rejectsXxeDoctype() {
        var xxe = """
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
                <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
                  <CstmrCdtTrfInitn><GrpHdr><MsgId>&xxe;</MsgId></GrpHdr></CstmrCdtTrfInitn>
                </Document>
                """;
        assertThrows(IllegalStateException.class, () -> reader.readInBatches(
                SourcePayload.fromBytes("xxe.xml", xxe.getBytes(StandardCharsets.UTF_8), "application/xml"),
                Map.of(), 10, batch -> {}));
    }

    @Test
    void rejectsMalformedXml() {
        var broken = "<Document><Cstmr></Document>";
        var error = assertThrows(IllegalStateException.class, () -> reader.readInBatches(
                SourcePayload.fromBytes("broken.xml", broken.getBytes(StandardCharsets.UTF_8), "application/xml"),
                Map.of(), 10, batch -> {}));
        assertTrue(error.getMessage().contains("Cannot parse pain.001"),
                () -> "mensaje inesperado: " + error.getMessage());
    }

    @Test
    void rejectsXmlWithoutCstmrCdtTrfInitn() {
        var wrong = "<?xml version=\"1.0\"?><Document xmlns=\"urn:iso:std:iso:20022:tech:xsd:pain.001.001.09\"><Other/></Document>";
        assertThrows(IllegalStateException.class, () -> reader.readInBatches(
                SourcePayload.fromBytes("wrong.xml", wrong.getBytes(StandardCharsets.UTF_8), "application/xml"),
                Map.of(), 10, batch -> {}));
    }
}
