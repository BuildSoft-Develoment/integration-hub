package com.integrationhub.platform.provider.task.payments.swift.format;

import com.integrationhub.platform.spi.task.payments.PaymentMessageFormatter;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Formateador SWIFT FIN del MT101 (formato crudo {@code {1:}{2:}{3:}{4:...-}{5:}}).
 *
 * <p>Emite el envelope SWIFT y el block 4 con los tags {@code :20:}, {@code :28D:},
 * {@code :30:}, {@code :50H:}, {@code :52A:}, {@code :21:}, {@code :32B:}, {@code :57A:},
 * {@code :59:}/{@code :59A:}/{@code :59F:}, {@code :70:}, {@code :71A:}, etc.</p>
 *
 * <p><b>Charset</b>: este formateador asume que el contenido ya respeta SWIFT-X
 * (validacion semantica de charset es responsabilidad de {@code MT101_VALIDATE},
 * no del formateador). Si se requiere transliteracion automatica, se inserta como
 * predicado/repair en el catalogo de reglas.</p>
 *
 * <p>Line endings: SWIFT exige CRLF. El emisor produce {@code \r\n} entre tags y
 * antes de los limites de bloque.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-001, T-006
 * @trace ADR-009
 */
@ApplicationScoped
public class FinMt101Formatter implements PaymentMessageFormatter {

    public static final String FORMAT_ID = "FIN";
    private static final String CRLF = "\r\n";
    private static final DateTimeFormatter DATE_YYMMDD = DateTimeFormatter.ofPattern("yyMMdd");

    @Override
    public String format() {
        return FORMAT_ID;
    }

    @Override
    public String format(Mt101Message message) {
        if (message == null) {
            throw new IllegalArgumentException("Mt101Message cannot be null for FIN formatting");
        }
        var envelope = message.envelope();
        var sequenceA = message.sequenceA();
        if (sequenceA == null) {
            throw new IllegalArgumentException("MT101 FIN format requires sequenceA");
        }

        var sb = new StringBuilder(512);
        appendBlock1(sb, envelope);
        appendBlock2(sb, envelope);
        appendBlock3(sb, envelope);
        appendBlock4(sb, message);
        appendBlock5(sb);
        return sb.toString();
    }

    private void appendBlock1(StringBuilder sb, Mt101Message.Envelope envelope) {
        sb.append("{1:F01")
                .append(safeLt(envelope == null ? null : envelope.senderLt()))
                .append("0000000000}");
    }

    private void appendBlock2(StringBuilder sb, Mt101Message.Envelope envelope) {
        sb.append("{2:I101")
                .append(safeLt(envelope == null ? null : envelope.receiverLt()))
                .append(priority(envelope))
                .append('}');
    }

    private void appendBlock3(StringBuilder sb, Mt101Message.Envelope envelope) {
        if (envelope == null || envelope.uetr() == null || envelope.uetr().isBlank()) {
            return;
        }
        sb.append("{3:{121:").append(envelope.uetr()).append("}}");
    }

    private void appendBlock4(StringBuilder sb, Mt101Message message) {
        sb.append("{4:").append(CRLF);
        var sequenceA = message.sequenceA();

        appendTag(sb, "20", sequenceA.sendersReference());
        if (sequenceA.customerSpecifiedReference() != null) {
            appendTag(sb, "21R", sequenceA.customerSpecifiedReference());
        }
        appendTag(sb, "28D", sequenceA.messageIndex() + "/" + sequenceA.messageTotal());
        appendParty(sb, "50", sequenceA.instructingParty());
        appendParty(sb, "50", sequenceA.orderingCustomer());
        appendParty(sb, "52", sequenceA.accountServicingInstitution());
        if (sequenceA.requestedExecutionDate() != null) {
            appendTag(sb, "30", sequenceA.requestedExecutionDate().format(DATE_YYMMDD));
        }
        if (sequenceA.authorisation() != null) {
            appendTag(sb, "25", sequenceA.authorisation());
        }

        for (var tx : message.transactions()) {
            appendTag(sb, "21", tx.transactionReference());
            if (tx.fxDealReference() != null) {
                appendTag(sb, "21F", tx.fxDealReference());
            }
            if (tx.instructionCode() != null) {
                appendTag(sb, "23E", tx.instructionCode());
            }
            appendAmount(sb, "32B", tx.amount());
            appendParty(sb, "50", tx.orderingCustomer());
            appendParty(sb, "52", tx.accountServicingInstitution());
            appendParty(sb, "56", tx.intermediary());
            appendParty(sb, "57", tx.accountWithInstitution());
            appendParty(sb, "59", tx.beneficiary());
            if (tx.remittanceInformation() != null) {
                appendTag(sb, "70", tx.remittanceInformation());
            }
            if (tx.regulatoryReporting() != null) {
                appendTag(sb, "77B", tx.regulatoryReporting());
            }
            if (tx.originalAmount() != null && tx.originalAmount().currency() != null
                    && tx.originalAmount().value() != null) {
                appendAmount(sb, "33B", tx.originalAmount());
            }
            if (tx.detailsOfCharges() != null) {
                appendTag(sb, "71A", tx.detailsOfCharges());
            }
            if (tx.chargesAccount() != null) {
                appendTag(sb, "25A", tx.chargesAccount());
            }
            if (tx.exchangeRate() != null) {
                appendTag(sb, "36", formatFinDecimal(tx.exchangeRate()));
            }
        }

        sb.append("-}");
    }

    private void appendBlock5(StringBuilder sb) {
        // Trailer minimo. {CHK:} se calcula por la red SWIFT; aqui solo dejamos placeholder
        // para que el formato sea parseable end-to-end.
        sb.append("{5:{CHK:000000000000}}");
    }

    private void appendTag(StringBuilder sb, String tag, String value) {
        if (value == null) {
            return;
        }
        sb.append(':').append(tag).append(':').append(value).append(CRLF);
    }

    private void appendAmount(StringBuilder sb, String tag, Mt101Message.Amount amount) {
        if (amount == null || amount.currency() == null || amount.value() == null) {
            return;
        }
        sb.append(':').append(tag).append(':')
                .append(amount.currency())
                .append(formatFinDecimal(amount.value()))
                .append(CRLF);
    }

    /**
     * SWIFT FIN usa coma como separador decimal y NO usa punto de miles.
     * Ejemplo: {@code GBP50000,} o {@code GBP15500,5}.
     */
    private String formatFinDecimal(BigDecimal value) {
        var stripped = value.stripTrailingZeros();
        if (stripped.scale() < 0) {
            stripped = stripped.setScale(0, java.math.RoundingMode.UNNECESSARY);
        }
        var plain = stripped.toPlainString();
        var idx = plain.indexOf('.');
        if (idx < 0) {
            return plain + ",";
        }
        return plain.replace('.', ',');
    }

    private void appendParty(StringBuilder sb, String baseTag, Mt101Message.Party party) {
        if (party == null) {
            return;
        }
        var option = party.option();
        var fullTag = option == null || option.isEmpty() ? baseTag : baseTag + option;
        var hasAccount = party.account() != null && !party.account().isBlank();
        var hasBic = party.bic() != null && !party.bic().isBlank();
        var hasNameAddress = party.nameAndAddress() != null && !party.nameAndAddress().isEmpty();

        if (!hasAccount && !hasBic && !hasNameAddress) {
            return;
        }

        sb.append(':').append(fullTag).append(':');
        var firstLine = true;
        if (hasAccount) {
            sb.append('/').append(party.account());
            firstLine = false;
        }
        if (hasBic) {
            if (!firstLine) {
                sb.append(CRLF);
            }
            sb.append(party.bic());
            firstLine = false;
        }
        if (hasNameAddress) {
            for (var line : party.nameAndAddress()) {
                if (!firstLine) {
                    sb.append(CRLF);
                }
                sb.append(line);
                firstLine = false;
            }
        }
        sb.append(CRLF);
    }

    private String safeLt(String lt) {
        if (lt == null) {
            return "XXXXXXXXXXXX";
        }
        if (lt.length() >= 12) {
            return lt.substring(0, 12);
        }
        var sb = new StringBuilder(12);
        sb.append(lt);
        while (sb.length() < 12) {
            sb.append('X');
        }
        return sb.toString();
    }

    private char priority(Mt101Message.Envelope envelope) {
        if (envelope == null || envelope.priority() == null || envelope.priority().isEmpty()) {
            return 'N';
        }
        return envelope.priority().charAt(0);
    }
}
