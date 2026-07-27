package com.integrationhub.platform.provider.task.payments.iso20022.format;


import com.integrationhub.vertical.swift.mt101.spi.PaymentMessageFormatter;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Formateador ISO 20022 {@code pain.001.001.09} (Customer Credit Transfer
 * Initiation) sub-catalogo {@code iso20022/} de spec 008-mensajeria-pagos.
 *
 * <p>Bootstrap del sub-catalogo iso20022/ siguiendo ADR-009: reutiliza el SPI
 * {@link PaymentMessageFormatter} existente. El task type {@code MT101_BUILD_FROM_TABLE}
 * con {@code configuration.format = "PAIN001_XML"} emite ISO 20022 sin
 * necesidad de un nuevo task type ni cambios al motor.</p>
 *
 * <p>Mapeo del modelo:</p>
 * <table>
 *   <tr><th>Mt101Message</th><th>pain.001 element</th></tr>
 *   <tr><td>envelope</td><td>GrpHdr</td></tr>
 *   <tr><td>sequenceA</td><td>PmtInf (Payment Information)</td></tr>
 *   <tr><td>transactions</td><td>CdtTrfTxInf (Credit Transfer Tx Information)</td></tr>
 * </table>
 *
 * <p><b>Limitaciones slice 4.3</b>:</p>
 * <ul>
 *   <li>Sin validacion XSD: requiere XSDs oficiales ISO 20022 (no en repo
 *       por restriccion de licencia). Cuando se carguen, anadir un
 *       {@code ValidationPredicate} XSD-based en {@code MT101_VALIDATE}.</li>
 *   <li>Schema {@code pain.001.001.09} (CBPR+ 2024). Versiones {@code .11}
 *       futuras se agregan como formatters paralelos
 *       ({@code PAIN001_XML_011}).</li>
 *   <li>Cargos: traduccion OUR/BEN/SHA -&gt; DEBT/CRED/SHAR.</li>
 * </ul>
 *
 * @trace spec 008-mensajeria-pagos T-027 (placeholder ahora activo)
 * @trace ADR-009
 */
@ApplicationScoped
public class Pain001XmlFormatter implements PaymentMessageFormatter {

    public static final String FORMAT_ID = "PAIN001_XML";
    private static final String NAMESPACE = "urn:iso:std:iso:20022:tech:xsd:pain.001.001.09";

    @Override
    public String format() {
        return FORMAT_ID;
    }

    @Override
    public String format(Mt101Message message) {
        if (message == null) {
            throw new IllegalArgumentException("Mt101Message cannot be null for pain.001 formatting");
        }
        var sb = new StringBuilder(1024);
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<Document xmlns=\"").append(NAMESPACE).append("\">\n");
        sb.append("  <CstmrCdtTrfInitn>\n");
        writeGroupHeader(sb, message);
        writePaymentInformation(sb, message);
        sb.append("  </CstmrCdtTrfInitn>\n");
        sb.append("</Document>");
        return sb.toString();
    }

    private void writeGroupHeader(StringBuilder sb, Mt101Message message) {
        var seqA = message.sequenceA();
        var msgId = seqA != null && seqA.sendersReference() != null
                ? seqA.sendersReference()
                : UUID.randomUUID().toString();
        var totalTx = message.transactions().size();
        var totalAmount = sumAllCurrencies(message);
        var creationDate = seqA != null && seqA.requestedExecutionDate() != null
                ? seqA.requestedExecutionDate()
                : LocalDate.now();

        sb.append("    <GrpHdr>\n");
        sb.append("      <MsgId>").append(escape(msgId)).append("</MsgId>\n");
        sb.append("      <CreDtTm>").append(creationDate).append("T00:00:00Z</CreDtTm>\n");
        sb.append("      <NbOfTxs>").append(totalTx).append("</NbOfTxs>\n");
        sb.append("      <CtrlSum>").append(totalAmount.toPlainString()).append("</CtrlSum>\n");
        writeInitiatingParty(sb, message);
        sb.append("    </GrpHdr>\n");
    }

    private void writeInitiatingParty(StringBuilder sb, Mt101Message message) {
        sb.append("      <InitgPty>\n");
        var seqA = message.sequenceA();
        var customer = seqA == null ? null : seqA.orderingCustomer();
        if (customer != null && !customer.nameAndAddress().isEmpty()) {
            sb.append("        <Nm>").append(escape(customer.nameAndAddress().get(0))).append("</Nm>\n");
        } else if (message.envelope() != null && message.envelope().senderLt() != null) {
            sb.append("        <Nm>").append(escape(message.envelope().senderLt())).append("</Nm>\n");
        }
        sb.append("      </InitgPty>\n");
    }

    private void writePaymentInformation(StringBuilder sb, Mt101Message message) {
        var seqA = message.sequenceA();
        if (seqA == null) {
            return;
        }
        sb.append("    <PmtInf>\n");
        sb.append("      <PmtInfId>")
                .append(escape(seqA.sendersReference() == null ? "PMT-INF-1" : seqA.sendersReference()))
                .append("</PmtInfId>\n");
        sb.append("      <PmtMtd>TRF</PmtMtd>\n");
        sb.append("      <NbOfTxs>").append(message.transactions().size()).append("</NbOfTxs>\n");
        sb.append("      <CtrlSum>").append(sumAllCurrencies(message).toPlainString()).append("</CtrlSum>\n");
        if (seqA.requestedExecutionDate() != null) {
            sb.append("      <ReqdExctnDt><Dt>").append(seqA.requestedExecutionDate()).append("</Dt></ReqdExctnDt>\n");
        }
        writeDebtor(sb, seqA);
        for (var tx : message.transactions()) {
            writeCreditTransfer(sb, tx);
        }
        sb.append("    </PmtInf>\n");
    }

    private void writeDebtor(StringBuilder sb, Mt101Message.SequenceA seqA) {
        var customer = seqA.orderingCustomer();
        if (customer == null) {
            return;
        }
        sb.append("      <Dbtr>\n");
        if (!customer.nameAndAddress().isEmpty()) {
            sb.append("        <Nm>").append(escape(customer.nameAndAddress().get(0))).append("</Nm>\n");
        }
        sb.append("      </Dbtr>\n");
        if (customer.account() != null) {
            sb.append("      <DbtrAcct><Id><Othr><Id>")
                    .append(escape(customer.account()))
                    .append("</Id></Othr></Id></DbtrAcct>\n");
        }
        var servicing = seqA.accountServicingInstitution();
        if (servicing != null && servicing.bic() != null) {
            sb.append("      <DbtrAgt><FinInstnId><BICFI>")
                    .append(escape(servicing.bic()))
                    .append("</BICFI></FinInstnId></DbtrAgt>\n");
        }
    }

    private void writeCreditTransfer(StringBuilder sb, Mt101Message.Transaction tx) {
        sb.append("      <CdtTrfTxInf>\n");
        sb.append("        <PmtId><EndToEndId>")
                .append(escape(tx.transactionReference() == null ? "TX" : tx.transactionReference()))
                .append("</EndToEndId></PmtId>\n");
        if (tx.amount() != null) {
            sb.append("        <Amt><InstdAmt Ccy=\"")
                    .append(escape(tx.amount().currency()))
                    .append("\">")
                    .append(tx.amount().value().toPlainString())
                    .append("</InstdAmt></Amt>\n");
        }
        if (tx.detailsOfCharges() != null) {
            sb.append("        <ChrgBr>").append(translateCharges(tx.detailsOfCharges())).append("</ChrgBr>\n");
        }
        var accountWith = tx.accountWithInstitution();
        if (accountWith != null && accountWith.bic() != null) {
            sb.append("        <CdtrAgt><FinInstnId><BICFI>")
                    .append(escape(accountWith.bic()))
                    .append("</BICFI></FinInstnId></CdtrAgt>\n");
        }
        if (tx.beneficiary() != null) {
            sb.append("        <Cdtr>\n");
            if (!tx.beneficiary().nameAndAddress().isEmpty()) {
                sb.append("          <Nm>")
                        .append(escape(tx.beneficiary().nameAndAddress().get(0)))
                        .append("</Nm>\n");
            }
            sb.append("        </Cdtr>\n");
            if (tx.beneficiary().account() != null) {
                sb.append("        <CdtrAcct><Id><Othr><Id>")
                        .append(escape(tx.beneficiary().account()))
                        .append("</Id></Othr></Id></CdtrAcct>\n");
            }
        }
        if (tx.remittanceInformation() != null) {
            sb.append("        <RmtInf><Ustrd>")
                    .append(escape(tx.remittanceInformation()))
                    .append("</Ustrd></RmtInf>\n");
        }
        sb.append("      </CdtTrfTxInf>\n");
    }

    /**
     * MT101 {@code :71A:} -&gt; pain.001 {@code ChrgBr}:
     * OUR -&gt; DEBT, BEN -&gt; CRED, SHA -&gt; SHAR.
     */
    private String translateCharges(String mt71a) {
        return switch (mt71a.toUpperCase()) {
            case "OUR" -> "DEBT";
            case "BEN" -> "CRED";
            case "SHA" -> "SHAR";
            default -> "SLEV"; // Service Level - fallback regulatorio
        };
    }

    private BigDecimal sumAllCurrencies(Mt101Message message) {
        var total = BigDecimal.ZERO;
        for (var tx : message.transactions()) {
            if (tx.amount() != null && tx.amount().value() != null) {
                total = total.add(tx.amount().value());
            }
        }
        return total;
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
