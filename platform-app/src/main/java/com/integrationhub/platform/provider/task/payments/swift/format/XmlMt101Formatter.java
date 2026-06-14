package com.integrationhub.platform.provider.task.payments.swift.format;

import com.integrationhub.platform.spi.task.payments.PaymentMessageFormatter;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Formateador XML del MT101.
 *
 * <p>Produce una representacion 1:1 con {@code .tmp/mt101/11-mt101-output.xml}
 * (representacion interna, NO ISO 20022 {@code pain.001}). Emite directamente con
 * {@link StringBuilder} para no introducir dependencias XML adicionales.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-001, T-005
 * @trace ADR-009
 */
@ApplicationScoped
public class XmlMt101Formatter implements PaymentMessageFormatter {

    public static final String FORMAT_ID = "XML";
    private static final String NAMESPACE = "urn:integrationhub:swift:mt101:v1";
    private static final String INDENT = "  ";

    @Override
    public String format() {
        return FORMAT_ID;
    }

    @Override
    public String format(Mt101Message message) {
        if (message == null) {
            throw new IllegalArgumentException("Mt101Message cannot be null for XML formatting");
        }
        var sb = new StringBuilder(512);
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<Mt101Message xmlns=\"").append(NAMESPACE).append("\">\n");
        writeEnvelope(sb, message.envelope());
        writeSequenceA(sb, message.sequenceA());
        writeTransactions(sb, message);
        writeControlTotals(sb, message.controlTotals());
        sb.append("</Mt101Message>");
        return sb.toString();
    }

    private void writeEnvelope(StringBuilder sb, Mt101Message.Envelope envelope) {
        if (envelope == null) {
            return;
        }
        sb.append(INDENT).append("<Envelope>\n");
        writeElement(sb, 2, "SenderLt", envelope.senderLt());
        writeElement(sb, 2, "ReceiverLt", envelope.receiverLt());
        writeElement(sb, 2, "Uetr", envelope.uetr());
        writeElement(sb, 2, "Priority", envelope.priority());
        sb.append(INDENT).append("</Envelope>\n");
    }

    private void writeSequenceA(StringBuilder sb, Mt101Message.SequenceA sequenceA) {
        if (sequenceA == null) {
            return;
        }
        sb.append(INDENT).append("<SequenceA>\n");
        writeElement(sb, 2, "SendersReference", sequenceA.sendersReference());
        writeElement(sb, 2, "CustomerSpecifiedReference", sequenceA.customerSpecifiedReference());
        writeElement(sb, 2, "MessageIndex", String.valueOf(sequenceA.messageIndex()));
        writeElement(sb, 2, "MessageTotal", String.valueOf(sequenceA.messageTotal()));
        if (sequenceA.requestedExecutionDate() != null) {
            writeElement(sb, 2, "RequestedExecutionDate", sequenceA.requestedExecutionDate().toString());
        }
        writeParty(sb, 2, "InstructingParty", sequenceA.instructingParty());
        writeParty(sb, 2, "OrderingCustomer", sequenceA.orderingCustomer());
        writeParty(sb, 2, "AccountServicingInstitution", sequenceA.accountServicingInstitution());
        writeElement(sb, 2, "Authorisation", sequenceA.authorisation());
        sb.append(INDENT).append("</SequenceA>\n");
    }

    private void writeTransactions(StringBuilder sb, Mt101Message message) {
        sb.append(INDENT).append("<Transactions>\n");
        for (var tx : message.transactions()) {
            writeTransaction(sb, tx);
        }
        sb.append(INDENT).append("</Transactions>\n");
    }

    private void writeTransaction(StringBuilder sb, Mt101Message.Transaction tx) {
        sb.append(INDENT).append(INDENT)
                .append("<Transaction sequenceNumber=\"").append(tx.sequenceNumber()).append("\">\n");
        writeElement(sb, 3, "TransactionReference", tx.transactionReference());
        writeElement(sb, 3, "FxDealReference", tx.fxDealReference());
        writeElement(sb, 3, "InstructionCode", tx.instructionCode());
        writeAmount(sb, 3, "Amount", tx.amount());
        writeParty(sb, 3, "OrderingCustomer", tx.orderingCustomer());
        writeParty(sb, 3, "Intermediary", tx.intermediary());
        writeParty(sb, 3, "AccountWithInstitution", tx.accountWithInstitution());
        writeParty(sb, 3, "Beneficiary", tx.beneficiary());
        writeElement(sb, 3, "RemittanceInformation", tx.remittanceInformation());
        writeElement(sb, 3, "RegulatoryReporting", tx.regulatoryReporting());
        writeAmount(sb, 3, "OriginalAmount", tx.originalAmount());
        writeElement(sb, 3, "DetailsOfCharges", tx.detailsOfCharges());
        writeElement(sb, 3, "ChargesAccount", tx.chargesAccount());
        if (tx.exchangeRate() != null) {
            writeElement(sb, 3, "ExchangeRate", tx.exchangeRate().toPlainString());
        }
        sb.append(INDENT).append(INDENT).append("</Transaction>\n");
    }

    private void writeParty(StringBuilder sb, int depth, String tag, Mt101Message.Party party) {
        if (party == null) {
            return;
        }
        indent(sb, depth);
        sb.append('<').append(tag);
        if (party.option() != null) {
            sb.append(" option=\"").append(escapeAttribute(party.option())).append("\"");
        }
        sb.append(">\n");
        writeElement(sb, depth + 1, "Account", party.account());
        writeElement(sb, depth + 1, "Bic", party.bic());
        if (party.nameAndAddress() != null && !party.nameAndAddress().isEmpty()) {
            indent(sb, depth + 1);
            sb.append("<NameAndAddress>\n");
            for (var line : party.nameAndAddress()) {
                writeElement(sb, depth + 2, "Line", line);
            }
            indent(sb, depth + 1);
            sb.append("</NameAndAddress>\n");
        }
        indent(sb, depth);
        sb.append("</").append(tag).append(">\n");
    }

    private void writeAmount(StringBuilder sb, int depth, String tag, Mt101Message.Amount amount) {
        if (amount == null) {
            return;
        }
        indent(sb, depth);
        sb.append('<').append(tag);
        if (amount.currency() != null) {
            sb.append(" currency=\"").append(escapeAttribute(amount.currency())).append("\"");
        }
        sb.append('>');
        if (amount.value() != null) {
            sb.append(escapeText(amount.value().toPlainString()));
        }
        sb.append("</").append(tag).append(">\n");
    }

    private void writeControlTotals(StringBuilder sb, Mt101Message.ControlTotals controlTotals) {
        if (controlTotals == null) {
            return;
        }
        sb.append(INDENT).append("<ControlTotals>\n");
        writeElement(sb, 2, "TransactionCount", String.valueOf(controlTotals.transactionCount()));
        for (Map.Entry<String, BigDecimal> entry : controlTotals.totalsByCurrency().entrySet()) {
            indent(sb, 2);
            sb.append("<TotalByCurrency currency=\"").append(escapeAttribute(entry.getKey())).append("\">");
            sb.append(escapeText(entry.getValue().toPlainString()));
            sb.append("</TotalByCurrency>\n");
        }
        sb.append(INDENT).append("</ControlTotals>\n");
    }

    private void writeElement(StringBuilder sb, int depth, String tag, String value) {
        if (value == null || value.isEmpty()) {
            return;
        }
        indent(sb, depth);
        sb.append('<').append(tag).append('>')
                .append(escapeText(value))
                .append("</").append(tag).append(">\n");
    }

    private void indent(StringBuilder sb, int depth) {
        for (int i = 0; i < depth; i++) {
            sb.append(INDENT);
        }
    }

    private String escapeText(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private String escapeAttribute(String value) {
        if (value == null) {
            return "";
        }
        return escapeText(value).replace("\"", "&quot;");
    }
}
