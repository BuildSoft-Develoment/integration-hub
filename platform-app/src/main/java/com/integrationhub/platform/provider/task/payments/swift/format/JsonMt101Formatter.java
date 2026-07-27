package com.integrationhub.platform.provider.task.payments.swift.format;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.vertical.swift.mt101.spi.PaymentMessageFormatter;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Formateador JSON del MT101.
 *
 * <p>Produce una representacion 1:1 con la estructura {@code .tmp/mt101/12-mt101-output.json}:
 * {@code envelope + sequenceA + transactions[] + controlTotals}.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-001, T-004
 * @trace ADR-009
 */
@ApplicationScoped
public class JsonMt101Formatter implements PaymentMessageFormatter {

    public static final String FORMAT_ID = "JSON";

    private final ObjectMapper objectMapper;

    @Inject
    public JsonMt101Formatter(ObjectMapper sharedObjectMapper) {
        // Reusa el mapper de Quarkus + jackson-datatype-jsr310 para LocalDate.
        // Copia para no contaminar features globales con INDENT_OUTPUT.
        this.objectMapper = sharedObjectMapper.copy()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .enable(SerializationFeature.INDENT_OUTPUT);
    }

    @Override
    public String format() {
        return FORMAT_ID;
    }

    @Override
    public String format(Mt101Message message) {
        if (message == null) {
            throw new IllegalArgumentException("Mt101Message cannot be null for JSON formatting");
        }
        try {
            return objectMapper.writeValueAsString(toJsonStructure(message));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot serialize MT101 to JSON", e);
        }
    }

    private Map<String, Object> toJsonStructure(Mt101Message message) {
        var root = new LinkedHashMap<String, Object>();
        if (message.envelope() != null) {
            root.put("envelope", envelope(message.envelope()));
        }
        if (message.sequenceA() != null) {
            root.put("sequenceA", sequenceA(message.sequenceA()));
        }
        var transactions = message.transactions().stream().map(this::transaction).toList();
        root.put("transactions", transactions);
        if (message.controlTotals() != null) {
            root.put("controlTotals", controlTotals(message.controlTotals()));
        }
        return root;
    }

    private Map<String, Object> envelope(Mt101Message.Envelope envelope) {
        var map = new LinkedHashMap<String, Object>();
        putIfPresent(map, "senderLt", envelope.senderLt());
        putIfPresent(map, "receiverLt", envelope.receiverLt());
        putIfPresent(map, "uetr", envelope.uetr());
        putIfPresent(map, "priority", envelope.priority());
        return map;
    }

    private Map<String, Object> sequenceA(Mt101Message.SequenceA sequenceA) {
        var map = new LinkedHashMap<String, Object>();
        putIfPresent(map, "sendersReference", sequenceA.sendersReference());
        putIfPresent(map, "customerSpecifiedReference", sequenceA.customerSpecifiedReference());
        map.put("messageIndex", sequenceA.messageIndex());
        map.put("messageTotal", sequenceA.messageTotal());
        if (sequenceA.requestedExecutionDate() != null) {
            map.put("requestedExecutionDate", sequenceA.requestedExecutionDate().toString());
        }
        if (sequenceA.instructingParty() != null) {
            map.put("instructingParty", party(sequenceA.instructingParty()));
        }
        if (sequenceA.orderingCustomer() != null) {
            map.put("orderingCustomer", party(sequenceA.orderingCustomer()));
        }
        if (sequenceA.accountServicingInstitution() != null) {
            map.put("accountServicingInstitution", party(sequenceA.accountServicingInstitution()));
        }
        putIfPresent(map, "authorisation", sequenceA.authorisation());
        return map;
    }

    private Map<String, Object> transaction(Mt101Message.Transaction transaction) {
        var map = new LinkedHashMap<String, Object>();
        map.put("sequenceNumber", transaction.sequenceNumber());
        putIfPresent(map, "transactionReference", transaction.transactionReference());
        putIfPresent(map, "fxDealReference", transaction.fxDealReference());
        putIfPresent(map, "instructionCode", transaction.instructionCode());
        if (transaction.amount() != null) {
            map.put("amount", amount(transaction.amount()));
        }
        if (transaction.orderingCustomer() != null) {
            map.put("orderingCustomer", party(transaction.orderingCustomer()));
        }
        if (transaction.accountServicingInstitution() != null) {
            map.put("accountServicingInstitution", party(transaction.accountServicingInstitution()));
        }
        if (transaction.intermediary() != null) {
            map.put("intermediary", party(transaction.intermediary()));
        }
        if (transaction.accountWithInstitution() != null) {
            map.put("accountWithInstitution", party(transaction.accountWithInstitution()));
        }
        if (transaction.beneficiary() != null) {
            map.put("beneficiary", party(transaction.beneficiary()));
        }
        putIfPresent(map, "remittanceInformation", transaction.remittanceInformation());
        putIfPresent(map, "regulatoryReporting", transaction.regulatoryReporting());
        if (transaction.originalAmount() != null) {
            map.put("originalAmount", amount(transaction.originalAmount()));
        }
        putIfPresent(map, "detailsOfCharges", transaction.detailsOfCharges());
        putIfPresent(map, "chargesAccount", transaction.chargesAccount());
        if (transaction.exchangeRate() != null) {
            map.put("exchangeRate", transaction.exchangeRate());
        }
        return map;
    }

    private Map<String, Object> party(Mt101Message.Party party) {
        var map = new LinkedHashMap<String, Object>();
        putIfPresent(map, "option", party.option());
        putIfPresent(map, "account", party.account());
        putIfPresent(map, "bic", party.bic());
        if (party.nameAndAddress() != null && !party.nameAndAddress().isEmpty()) {
            map.put("nameAndAddress", party.nameAndAddress());
        }
        return map;
    }

    private Map<String, Object> amount(Mt101Message.Amount amount) {
        var map = new LinkedHashMap<String, Object>();
        putIfPresent(map, "currency", amount.currency());
        if (amount.value() != null) {
            map.put("value", amount.value());
        }
        return map;
    }

    private Map<String, Object> controlTotals(Mt101Message.ControlTotals controlTotals) {
        var map = new LinkedHashMap<String, Object>();
        map.put("transactionCount", controlTotals.transactionCount());
        map.put("totalsByCurrency", controlTotals.totalsByCurrency());
        return map;
    }

    private void putIfPresent(Map<String, Object> map, String key, String value) {
        if (value != null && !value.isBlank()) {
            map.put(key, value);
        }
    }
}
