package com.integrationhub.platform.provider.task.payments.swift;


import com.integrationhub.vertical.swift.mt101.provider.Mt101Audit;

import com.integrationhub.vertical.swift.mt101.spi.PaymentMessageFormatter;
import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.platform.spi.engine.RecordAuditEmitter;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Task provider {@code MT101_SPLIT}: particiona un {@link Mt101Message} en N
 * fragmentos hermanos cuando excede limites de tamano (transacciones o bytes
 * del {@code rawPayload}). Reescribe {@code :28D:} {@code messageIndex/messageTotal}
 * en cada fragmento y opcionalmente la {@code sendersReference} para distinguirlos.
 *
 * <p>Caso de uso: el banco impone cuota de 100 transacciones por archivo, o el
 * limite SWIFT de 10k chars en block 4 se excede. Tarea <b>legacy</b> de la cadena
 * en memoria (el build {@code MT101_BUILD} se removio); hoy {@code MT101_BUILD_FROM_TABLE}
 * ya fragmenta por bytes/transacciones y absorbe este split.</p>
 *
 * <p><b>Configuracion</b>:</p>
 * <pre>{@code
 * {
 *   "maxTransactionsPerFragment": 100,
 *   "maxBytesPerFragment": 10000,
 *   "rebuildIndexTotal": true,
 *   "fragmentReferenceTemplate": "${sendersReference}-${fragmentIndex}"
 * }
 * }</pre>
 *
 * <p>Mensajes que NO necesitan split se pasan tal cual (no se duplica trabajo).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-009, T-023
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101SplitTaskProvider implements TaskProvider {

    private static final int DEFAULT_MAX_TRANSACTIONS = 100;
    private static final int DEFAULT_MAX_BYTES = 10000;
    private static final String DEFAULT_REFERENCE_TEMPLATE = "${sendersReference}-${fragmentIndex}";

    private final Iterable<PaymentMessageFormatter> formatters;
    private final RecordAuditEmitter recordAuditEmitter;

    public Mt101SplitTaskProvider() {
        this.formatters = List.of();
        this.recordAuditEmitter = null;
    }

    @Inject
    public Mt101SplitTaskProvider(Instance<PaymentMessageFormatter> formatters,
                                  RecordAuditEmitter recordAuditEmitter) {
        this.formatters = formatters;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    public Mt101SplitTaskProvider(Instance<PaymentMessageFormatter> formatters) {
        this.formatters = formatters;
        this.recordAuditEmitter = null;
    }

    Mt101SplitTaskProvider(Iterable<PaymentMessageFormatter> formatters) {
        this.formatters = formatters == null ? List.of() : formatters;
        this.recordAuditEmitter = null;
    }

    @Override
    public String type() {
        return "MT101_SPLIT";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var messages = Mt101MessageInputResolver.readMessages(context, configuration, type());
        if (messages.isEmpty()) {
            return TaskResult.success("MT101_SPLIT skipped because there are no messages to split");
        }

        var maxTransactions = intValue(configuration.get("maxTransactionsPerFragment"), DEFAULT_MAX_TRANSACTIONS);
        var maxBytes = intValue(configuration.get("maxBytesPerFragment"), DEFAULT_MAX_BYTES);
        var rebuildIndexTotal = boolValue(configuration.get("rebuildIndexTotal"), true);
        var referenceTemplate = stringValue(configuration.get("fragmentReferenceTemplate"),
                DEFAULT_REFERENCE_TEMPLATE);

        var fragments = new ArrayList<Mt101Message>();
        int splitCount = 0;
        int passthroughCount = 0;

        for (var message : messages) {
            var produced = splitOne(message, maxTransactions, maxBytes, rebuildIndexTotal, referenceTemplate);
            if (produced.size() == 1 && produced.get(0) == message) {
                passthroughCount++;
            } else {
                splitCount++;
            }
            fragments.addAll(produced);
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("inputMessageCount", messages.size());
        outputs.put("splitMessageCount", splitCount);
        outputs.put("passthroughCount", passthroughCount);
        outputs.put("outputFragmentCount", fragments.size());
        outputs.put("records", fragments);

        emitRecordAudit(fragments.stream()
                .map(fragment -> Mt101Audit.messageEvent(context, fragment, "PAYMENT_MESSAGE_SPLIT", "SPLIT", null,
                        Map.of("splitSourceCount", String.valueOf(messages.size()))))
                .toList());

        var summary = "MT101_SPLIT input=" + messages.size()
                + " split=" + splitCount
                + " passthrough=" + passthroughCount
                + " fragments=" + fragments.size();
        return TaskResult.success(summary, outputs);
    }

    private List<Mt101Message> splitOne(Mt101Message message,
                                        int maxTransactions,
                                        int maxBytes,
                                        boolean rebuildIndexTotal,
                                        String referenceTemplate) {
        var totalTransactions = message.transactions().size();
        var payloadSize = message.rawPayload() == null ? 0 : message.rawPayload().length();
        var exceedsByTransactions = totalTransactions > maxTransactions;
        var exceedsByBytes = payloadSize > maxBytes;

        if (!exceedsByTransactions && !exceedsByBytes) {
            // Pass-through: no necesita split.
            return List.of(message);
        }

        var effectiveMaxTx = exceedsByTransactions ? maxTransactions : computeMaxByBytes(message, maxBytes);
        if (effectiveMaxTx < 1) effectiveMaxTx = 1;

        int total = (int) Math.ceil((double) totalTransactions / effectiveMaxTx);
        var result = new ArrayList<Mt101Message>(total);
        for (int fragmentIndex = 1; fragmentIndex <= total; fragmentIndex++) {
            var fromTx = (fragmentIndex - 1) * effectiveMaxTx;
            var toTx = Math.min(fromTx + effectiveMaxTx, totalTransactions);
            var subset = message.transactions().subList(fromTx, toTx);
            var fragment = buildFragment(message, subset, fragmentIndex, total, rebuildIndexTotal, referenceTemplate);
            result.add(fragment);
        }
        return result;
    }

    /**
     * Estima cuantas transacciones caben por fragmento si el limite es bytes:
     * tamano del payload / total transacciones = bytes promedio por tx; bytes
     * limit / bytes-por-tx = transacciones por fragmento (al menos 1).
     */
    private int computeMaxByBytes(Mt101Message message, int maxBytes) {
        var total = message.transactions().size();
        if (total == 0 || message.rawPayload() == null) return 1;
        var bytesPerTx = Math.max(1, message.rawPayload().length() / total);
        return Math.max(1, maxBytes / bytesPerTx);
    }

    private Mt101Message buildFragment(Mt101Message original,
                                       List<Mt101Message.Transaction> transactions,
                                       int fragmentIndex,
                                       int totalFragments,
                                       boolean rebuildIndexTotal,
                                       String referenceTemplate) {
        var originalSeqA = original.sequenceA();
        var resolvedReference = renderReference(referenceTemplate, originalSeqA, fragmentIndex);
        var newSeqA = originalSeqA == null ? null : new Mt101Message.SequenceA(
                resolvedReference,
                originalSeqA.customerSpecifiedReference(),
                rebuildIndexTotal ? fragmentIndex : originalSeqA.messageIndex(),
                rebuildIndexTotal ? totalFragments : originalSeqA.messageTotal(),
                originalSeqA.requestedExecutionDate(),
                originalSeqA.instructingParty(),
                originalSeqA.orderingCustomer(),
                originalSeqA.accountServicingInstitution(),
                originalSeqA.authorisation());
        var controlTotals = computeControlTotals(transactions);
        var fragment = new Mt101Message(original.envelope(), newSeqA, transactions, controlTotals,
                null, original.format());
        return reformat(fragment);
    }

    private Mt101Message reformat(Mt101Message message) {
        var format = message.format();
        if (format == null || format.isBlank()) {
            return message;
        }
        for (var formatter : formatters) {
            if (formatter.format().equalsIgnoreCase(format)) {
                return message.withRawPayload(formatter.format(message), formatter.format());
            }
        }
        return message;
    }

    private String renderReference(String template, Mt101Message.SequenceA seqA, int fragmentIndex) {
        if (template == null || template.isBlank()) {
            template = DEFAULT_REFERENCE_TEMPLATE;
        }
        var sendersReference = seqA != null ? seqA.sendersReference() : "";
        var rendered = template
                .replace("${sendersReference}", sendersReference == null ? "" : sendersReference)
                .replace("${fragmentIndex}", String.valueOf(fragmentIndex));
        // :20: solo admite 16x.
        if (rendered.length() > 16) {
            throw new IllegalArgumentException("MT101_SPLIT fragment reference exceeds 16 characters: " + rendered);
        }
        return rendered;
    }

    private Mt101Message.ControlTotals computeControlTotals(List<Mt101Message.Transaction> transactions) {
        var totals = new TreeMap<String, BigDecimal>();
        for (var tx : transactions) {
            if (tx.amount() == null || tx.amount().currency() == null || tx.amount().value() == null) continue;
            totals.merge(tx.amount().currency(), tx.amount().value(), BigDecimal::add);
        }
        return new Mt101Message.ControlTotals(transactions.size(), totals);
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) return defaultValue;
        var v = String.valueOf(raw).trim();
        return v.isEmpty() ? defaultValue : v;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) return defaultValue;
        return Integer.parseInt(String.valueOf(raw));
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null) return defaultValue;
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    private void emitRecordAudit(List<com.integrationhub.platform.audit.AuditEnvelope> envelopes) {
        if (recordAuditEmitter != null && envelopes != null && !envelopes.isEmpty()) {
            recordAuditEmitter.emitRecords(envelopes);
        }
    }
}
