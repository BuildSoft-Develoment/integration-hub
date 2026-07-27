package com.integrationhub.platform.provider.reader;


import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reader del catalogo 002 para mensajes ISO 20022 {@code pain.001.001.09}
 * (Customer Credit Transfer Initiation), sub-catalogo {@code iso20022/} de
 * spec 008-mensajeria-pagos.
 *
 * <p><b>Responsabilidad: solo parsear el XML</b> a un shape estructurado.
 * La interpretacion semantica (mapeo a {@code Mt101Message}, validacion CBPR+)
 * vive en {@code PAIN001_PARSE} (sub-catalogo iso20022/).</p>
 *
 * <p><b>Output records</b>: emite 1 {@link ReadRecord} por mensaje pain.001.
 * Shape (orientado a simetria con {@code SwiftMtReaderProvider}):</p>
 * <pre>
 *   messageId: String                       // GrpHdr/MsgId
 *   creationDateTime: String                // GrpHdr/CreDtTm (ISO-8601)
 *   numberOfTransactions: String            // GrpHdr/NbOfTxs
 *   controlSum: String                      // GrpHdr/CtrlSum
 *   initiatingPartyName: String             // GrpHdr/InitgPty/Nm
 *   paymentInformation: Map&lt;String,Object&gt;
 *     paymentInfoId: String                 // PmtInf/PmtInfId
 *     paymentMethod: String                 // PmtInf/PmtMtd
 *     numberOfTransactions: String          // PmtInf/NbOfTxs
 *     controlSum: String                    // PmtInf/CtrlSum
 *     requestedExecutionDate: String        // PmtInf/ReqdExctnDt/Dt
 *     debtorName: String                    // PmtInf/Dbtr/Nm
 *     debtorAccount: String                 // PmtInf/DbtrAcct/Id/Othr/Id
 *     debtorAgentBic: String                // PmtInf/DbtrAgt/FinInstnId/BICFI
 *     transactions: List&lt;Map&gt;
 *       endToEndId: String                  // CdtTrfTxInf/PmtId/EndToEndId
 *       amount: String                      // CdtTrfTxInf/Amt/InstdAmt
 *       currency: String                    // CdtTrfTxInf/Amt/InstdAmt/@Ccy
 *       chargeBearer: String                // CdtTrfTxInf/ChrgBr (DEBT/CRED/SHAR/SLEV)
 *       creditorAgentBic: String            // CdtTrfTxInf/CdtrAgt/FinInstnId/BICFI
 *       creditorName: String                // CdtTrfTxInf/Cdtr/Nm
 *       creditorAccount: String             // CdtTrfTxInf/CdtrAcct/Id/Othr/Id
 *       remittanceInformation: String       // CdtTrfTxInf/RmtInf/Ustrd
 * </pre>
 *
 * <p><b>Seguridad XML</b>: parser configurado para rechazar DOCTYPE, entidades
 * externas y carga de DTDs externas (mitigacion XXE).</p>
 *
 * @trace spec 002-catalogo-readers RF-001
 * @trace spec 008-mensajeria-pagos RF-008 (inbound pain.001)
 * @trace ADR-009
 */
@ApplicationScoped
public class Pain001XmlReaderProvider implements ReaderProvider {

    public static final String READER_TYPE = "PAIN001_XML";

    @Override
    public String type() {
        return READER_TYPE;
    }

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        var document = parseDocument(payload);
        var record = buildRecord(document);
        if (record == null) {
            return new ReadResult(List.of(), 0);
        }
        var batch = List.of(record);
        if (consumer != null) {
            consumer.accept(new ReadBatch(payload.name(), 1, batch));
        }
        return new ReadResult(List.of(), 1);
    }

    private Document parseDocument(SourcePayload payload) {
        try (var stream = payload.openStream()) {
            var factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.parse(stream);
        } catch (ParserConfigurationException | SAXException | IOException error) {
            throw new IllegalStateException("Cannot parse pain.001 payload " + payload.name(), error);
        }
    }

    private ReadRecord buildRecord(Document document) {
        var root = document.getDocumentElement();
        if (root == null) {
            return null;
        }
        var initn = firstChildLocal(root, "CstmrCdtTrfInitn");
        if (initn == null) {
            throw new IllegalStateException("pain.001 missing CstmrCdtTrfInitn root element");
        }
        var values = new LinkedHashMap<String, Object>();
        var grpHdr = firstChildLocal(initn, "GrpHdr");
        if (grpHdr != null) {
            putIfPresent(values, "messageId", textChild(grpHdr, "MsgId"));
            putIfPresent(values, "creationDateTime", textChild(grpHdr, "CreDtTm"));
            putIfPresent(values, "numberOfTransactions", textChild(grpHdr, "NbOfTxs"));
            putIfPresent(values, "controlSum", textChild(grpHdr, "CtrlSum"));
            var initgPty = firstChildLocal(grpHdr, "InitgPty");
            if (initgPty != null) {
                putIfPresent(values, "initiatingPartyName", textChild(initgPty, "Nm"));
            }
        }
        var pmtInf = firstChildLocal(initn, "PmtInf");
        if (pmtInf != null) {
            values.put("paymentInformation", buildPaymentInformation(pmtInf));
        }
        return new ReadRecord(values);
    }

    private Map<String, Object> buildPaymentInformation(Element pmtInf) {
        var info = new LinkedHashMap<String, Object>();
        putIfPresent(info, "paymentInfoId", textChild(pmtInf, "PmtInfId"));
        putIfPresent(info, "paymentMethod", textChild(pmtInf, "PmtMtd"));
        putIfPresent(info, "numberOfTransactions", textChild(pmtInf, "NbOfTxs"));
        putIfPresent(info, "controlSum", textChild(pmtInf, "CtrlSum"));
        var reqd = firstChildLocal(pmtInf, "ReqdExctnDt");
        if (reqd != null) {
            putIfPresent(info, "requestedExecutionDate", textChild(reqd, "Dt"));
        }
        var dbtr = firstChildLocal(pmtInf, "Dbtr");
        if (dbtr != null) {
            putIfPresent(info, "debtorName", textChild(dbtr, "Nm"));
        }
        var dbtrAcct = firstChildLocal(pmtInf, "DbtrAcct");
        if (dbtrAcct != null) {
            putIfPresent(info, "debtorAccount", deepText(dbtrAcct, "Id", "Othr", "Id"));
        }
        var dbtrAgt = firstChildLocal(pmtInf, "DbtrAgt");
        if (dbtrAgt != null) {
            putIfPresent(info, "debtorAgentBic", deepText(dbtrAgt, "FinInstnId", "BICFI"));
        }
        var txs = new ArrayList<Map<String, Object>>();
        for (var tx : childrenLocal(pmtInf, "CdtTrfTxInf")) {
            txs.add(buildTransaction(tx));
        }
        info.put("transactions", txs);
        return info;
    }

    private Map<String, Object> buildTransaction(Element tx) {
        var entry = new LinkedHashMap<String, Object>();
        var pmtId = firstChildLocal(tx, "PmtId");
        if (pmtId != null) {
            putIfPresent(entry, "endToEndId", textChild(pmtId, "EndToEndId"));
        }
        var amt = firstChildLocal(tx, "Amt");
        if (amt != null) {
            var instd = firstChildLocal(amt, "InstdAmt");
            if (instd != null) {
                putIfPresent(entry, "amount", instd.getTextContent());
                var ccy = instd.getAttribute("Ccy");
                if (ccy != null && !ccy.isBlank()) {
                    entry.put("currency", ccy);
                }
            }
        }
        putIfPresent(entry, "chargeBearer", textChild(tx, "ChrgBr"));
        var cdtrAgt = firstChildLocal(tx, "CdtrAgt");
        if (cdtrAgt != null) {
            putIfPresent(entry, "creditorAgentBic", deepText(cdtrAgt, "FinInstnId", "BICFI"));
        }
        var cdtr = firstChildLocal(tx, "Cdtr");
        if (cdtr != null) {
            putIfPresent(entry, "creditorName", textChild(cdtr, "Nm"));
        }
        var cdtrAcct = firstChildLocal(tx, "CdtrAcct");
        if (cdtrAcct != null) {
            putIfPresent(entry, "creditorAccount", deepText(cdtrAcct, "Id", "Othr", "Id"));
        }
        var rmtInf = firstChildLocal(tx, "RmtInf");
        if (rmtInf != null) {
            putIfPresent(entry, "remittanceInformation", textChild(rmtInf, "Ustrd"));
        }
        return entry;
    }

    private static Element firstChildLocal(Element parent, String localName) {
        var children = parent.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            var node = children.item(i);
            if (node.getNodeType() == Node.ELEMENT_NODE && localName.equals(node.getLocalName())) {
                return (Element) node;
            }
        }
        return null;
    }

    private static List<Element> childrenLocal(Element parent, String localName) {
        var result = new ArrayList<Element>();
        NodeList children = parent.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            var node = children.item(i);
            if (node.getNodeType() == Node.ELEMENT_NODE && localName.equals(node.getLocalName())) {
                result.add((Element) node);
            }
        }
        return result;
    }

    private static String textChild(Element parent, String localName) {
        var child = firstChildLocal(parent, localName);
        if (child == null) {
            return null;
        }
        var text = child.getTextContent();
        return text == null ? null : text.trim();
    }

    private static String deepText(Element root, String... path) {
        var current = root;
        for (var localName : path) {
            current = firstChildLocal(current, localName);
            if (current == null) {
                return null;
            }
        }
        var text = current.getTextContent();
        return text == null ? null : text.trim();
    }

    private static void putIfPresent(Map<String, Object> map, String key, String value) {
        if (value != null && !value.isBlank()) {
            map.put(key, value);
        }
    }
}
