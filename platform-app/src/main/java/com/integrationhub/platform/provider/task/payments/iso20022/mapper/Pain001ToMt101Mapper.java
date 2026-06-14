package com.integrationhub.platform.provider.task.payments.iso20022.mapper;

import com.integrationhub.platform.spi.task.payments.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Mapper puro del shape estructurado emitido por {@code Pain001XmlReaderProvider}
 * al modelo canonico {@link Mt101Message}. Se ejecuta dentro de
 * {@code PAIN001_PARSE} (sub-catalogo iso20022/) para reusar el pipeline downstream
 * MT101_VALIDATE / MT101_ARCHIVE / MT101_PAY / MT101_STATUS / MT101_ROUTE /
 * MT101_SPLIT / MT101_REPAIR.
 *
 * <p><b>Charge bearer (inverso del outbound)</b>:</p>
 * <ul>
 *   <li>{@code DEBT} → {@code OUR}</li>
 *   <li>{@code CRED} → {@code BEN}</li>
 *   <li>{@code SHAR} → {@code SHA}</li>
 *   <li>{@code SLEV} y desconocidos → {@code SHA} (fallback regulatorio)</li>
 * </ul>
 *
 * <p>Esta clase no decide formato del {@code rawPayload}; ese stays bajo control
 * del {@code MT101_BUILD} si downstream se quiere re-emitir el mensaje en otro
 * formato. Aqui solo poblamos el modelo en memoria.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-008 (inbound pain.001)
 * @trace ADR-009
 */
@ApplicationScoped
public class Pain001ToMt101Mapper {

    public Mt101Message map(Map<String, Object> readerShape) {
        if (readerShape == null) {
            throw new IllegalArgumentException("pain.001 reader shape cannot be null");
        }
        var pmtInf = asMap(readerShape.get("paymentInformation"));
        if (pmtInf == null) {
            throw new IllegalArgumentException("pain.001 shape missing paymentInformation");
        }

        var envelope = new Mt101Message.Envelope(
                null,
                stringValue(pmtInf.get("debtorAgentBic")),
                null,
                "N"
        );

        var sequenceA = new Mt101Message.SequenceA(
                preferred(readerShape.get("messageId"), pmtInf.get("paymentInfoId")),
                null,
                1,
                1,
                parseDate(stringValue(pmtInf.get("requestedExecutionDate"))),
                null,
                debtorParty(pmtInf),
                accountServicingParty(pmtInf),
                null
        );

        var transactionsRaw = asListOfMap(pmtInf.get("transactions"));
        var transactions = new java.util.ArrayList<Mt101Message.Transaction>(transactionsRaw.size());
        var totalsByCurrency = new LinkedHashMap<String, BigDecimal>();
        for (int i = 0; i < transactionsRaw.size(); i++) {
            var tx = mapTransaction(i + 1, transactionsRaw.get(i));
            transactions.add(tx);
            if (tx.amount() != null && tx.amount().value() != null && tx.amount().currency() != null) {
                totalsByCurrency.merge(tx.amount().currency(), tx.amount().value(), BigDecimal::add);
            }
        }

        var controlTotals = new Mt101Message.ControlTotals(transactions.size(), totalsByCurrency);
        return new Mt101Message(envelope, sequenceA, transactions, controlTotals, null, "PAIN001_XML");
    }

    private Mt101Message.Party debtorParty(Map<String, Object> pmtInf) {
        var name = stringValue(pmtInf.get("debtorName"));
        var account = stringValue(pmtInf.get("debtorAccount"));
        if (name == null && account == null) {
            return null;
        }
        return new Mt101Message.Party("H", account, null, name == null ? List.of() : List.of(name));
    }

    private Mt101Message.Party accountServicingParty(Map<String, Object> pmtInf) {
        var bic = stringValue(pmtInf.get("debtorAgentBic"));
        if (bic == null) {
            return null;
        }
        return new Mt101Message.Party("A", null, bic, List.of());
    }

    private Mt101Message.Transaction mapTransaction(int seqNumber, Map<String, Object> tx) {
        var amount = mapAmount(tx);
        var creditorAgent = creditorAgentParty(tx);
        var beneficiary = beneficiaryParty(tx);
        return new Mt101Message.Transaction(
                seqNumber,
                stringValue(tx.get("endToEndId")),
                null,
                null,
                amount,
                null,
                null,
                null,
                creditorAgent,
                beneficiary,
                stringValue(tx.get("remittanceInformation")),
                null,
                null,
                translateChargeBearer(stringValue(tx.get("chargeBearer"))),
                null,
                null
        );
    }

    private Mt101Message.Amount mapAmount(Map<String, Object> tx) {
        var raw = stringValue(tx.get("amount"));
        var currency = stringValue(tx.get("currency"));
        if (raw == null && currency == null) {
            return null;
        }
        BigDecimal value = null;
        if (raw != null) {
            try {
                value = new BigDecimal(raw);
            } catch (NumberFormatException error) {
                throw new IllegalArgumentException(
                        "pain.001 amount is not a valid decimal: '" + raw + "'", error);
            }
        }
        return new Mt101Message.Amount(currency, value);
    }

    private Mt101Message.Party creditorAgentParty(Map<String, Object> tx) {
        var bic = stringValue(tx.get("creditorAgentBic"));
        if (bic == null) {
            return null;
        }
        return new Mt101Message.Party("A", null, bic, List.of());
    }

    private Mt101Message.Party beneficiaryParty(Map<String, Object> tx) {
        var name = stringValue(tx.get("creditorName"));
        var account = stringValue(tx.get("creditorAccount"));
        if (name == null && account == null) {
            return null;
        }
        return new Mt101Message.Party("", account, null, name == null ? List.of() : List.of(name));
    }

    /**
     * Inverso de {@code Pain001XmlFormatter.translateCharges}.
     *
     * <p>{@code DEBT}/{@code CRED}/{@code SHAR}/{@code SLEV} son los unicos
     * valores enumerados validos en pain.001.001.09. Para ChrgBr ausente
     * devolvemos {@code null} (downstream decide default si aplica). Para
     * {@code SLEV} o no-reconocidos colapsamos a {@code SHA} como fallback
     * regulatorio, simetrico al outbound.</p>
     */
    private String translateChargeBearer(String pain001ChrgBr) {
        if (pain001ChrgBr == null) {
            return null;
        }
        return switch (pain001ChrgBr.toUpperCase()) {
            case "DEBT" -> "OUR";
            case "CRED" -> "BEN";
            case "SHAR" -> "SHA";
            default -> "SHA";
        };
    }

    private static LocalDate parseDate(String value) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException error) {
            throw new IllegalArgumentException(
                    "pain.001 requestedExecutionDate is not ISO-8601: '" + value + "'", error);
        }
    }

    private static String stringValue(Object raw) {
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private static String preferred(Object first, Object fallback) {
        var firstValue = stringValue(first);
        return firstValue != null ? firstValue : stringValue(fallback);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object raw) {
        if (raw instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> asListOfMap(Object raw) {
        if (raw instanceof List<?> list) {
            return (List<Map<String, Object>>) (List<?>) list;
        }
        return List.of();
    }
}
