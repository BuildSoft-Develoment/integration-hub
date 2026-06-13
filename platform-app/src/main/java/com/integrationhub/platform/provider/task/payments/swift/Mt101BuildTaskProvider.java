package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.provider.task.common.TaskOutputSupport;
import com.integrationhub.platform.spi.payments.PaymentMessageFormatter;
import com.integrationhub.platform.provider.task.payments.model.Mt101Message;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Task provider {@code MT101_BUILD}: compone uno o varios MT101 a partir de un
 * header logico (declarado en {@code configuration.envelope} + {@code configuration.sequenceA})
 * y de N transacciones (records consumidos como {@code BatchTaskProvider}).
 *
 * <p>Delega el formateo (JSON/XML/FIN) a las implementaciones de
 * {@link PaymentMessageFormatter} registradas; selecciona la correcta por
 * {@code configuration.format} (default {@code "JSON"}).</p>
 *
 * <p><b>Outputs publicados</b> (siguen el patron de
 * {@link com.integrationhub.platform.service.execution.TaskOutputRegistry}):</p>
 * <ul>
 *   <li>{@code messageCount}, {@code transactionCount}, {@code format}: claves
 *       planas (compat).</li>
 *   <li>{@code totalsByCurrency}: mapa moneda -> total.</li>
 *   <li>{@code records}: lista de {@link Mt101Message} con {@code rawPayload}
 *       ya formateado, lista para {@code MT101_ARCHIVE} y {@code MT101_PAY}.</li>
 * </ul>
 *
 * <p>Slice 1 del sprint 1: solo {@code splitBy.strategy = "none"}. Estrategias
 * {@code debitAccount} y {@code maxTransactions} llegan en slice posterior.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-001, T-003
 * @trace ADR-009, ADR-004
 */
@ApplicationScoped
public class Mt101BuildTaskProvider implements BatchTaskProvider {

    private static final String DEFAULT_FORMAT = "JSON";
    private static final String DEFAULT_PRIORITY = "N";

    private final Instance<PaymentMessageFormatter> formatters;

    public Mt101BuildTaskProvider(Instance<PaymentMessageFormatter> formatters) {
        this.formatters = formatters;
    }

    @Override
    public String type() {
        return "MT101_BUILD";
    }

    @Override
    public TaskResult executeRecords(TaskContext context,
                                     Map<String, Object> configuration,
                                     List<ReadRecord> records,
                                     SourcePayload sourcePayload) {
        var format = stringValue(configuration.get("format"), DEFAULT_FORMAT).toUpperCase();
        var formatter = resolveFormatter(format);

        var envelopeCfg = mapValue(configuration.get("envelope"));
        var sequenceACfg = mapValue(configuration.get("sequenceA"));
        var mappingsCfg = mapValue(configuration.get("transactionMappings"));
        var debitAccountMode = resolveDebitAccountMode(configuration, sequenceACfg, mappingsCfg);

        if (sequenceACfg.isEmpty()) {
            throw new IllegalArgumentException("MT101_BUILD requires configuration.sequenceA");
        }
        if (mappingsCfg.isEmpty()) {
            throw new IllegalArgumentException("MT101_BUILD requires configuration.transactionMappings");
        }
        if (records == null || records.isEmpty()) {
            return TaskResult.success("MT101_BUILD skipped because there are no records to compose");
        }

        var effectiveRecords = enrichRecordsWithRuntime(context, records, sourcePayload);
        var messageIndex = intAttribute(context, "mt101MessageIndex", 1);
        var messageTotal = intAttribute(context, "mt101MessageTotal", 1);
        var recordOffset = intAttribute(context, "mt101RecordOffset", 0);
        var sendersReference = resolveSendersReference(sequenceACfg, context, messageIndex);

        var envelope = buildEnvelope(envelopeCfg);
        var transactions = buildTransactions(effectiveRecords, mappingsCfg, context, recordOffset);
        var controlTotals = computeControlTotals(transactions);
        var sequenceA = buildSequenceA(sequenceACfg, sendersReference, messageIndex, messageTotal);
        validateDebitAccountMode(debitAccountMode, sequenceA, transactions);

        var message = new Mt101Message(envelope, sequenceA, transactions, controlTotals, null, format);
        var rawPayload = formatter.format(message);
        var formatted = message.withRawPayload(rawPayload, format);

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("messageCount", 1);
        outputs.put("transactionCount", transactions.size());
        outputs.put("format", format);
        outputs.put("totalsByCurrency", controlTotals.totalsByCurrency());
        outputs.put("records", List.of(formatted));

        return TaskResult.success(
                "MT101_BUILD composed 1 message with " + transactions.size() + " transactions in " + format,
                outputs
        );
    }

    @SuppressWarnings("unchecked")
    private List<ReadRecord> enrichRecordsWithRuntime(TaskContext context,
                                                      List<ReadRecord> records,
                                                      SourcePayload sourcePayload) {
        if (records == null || records.isEmpty()) {
            return List.of();
        }
        var executionVariables = context != null && context.attributes().get("executionVariables") instanceof Map<?, ?> rawExecutionVariables
                ? (Map<String, Object>) rawExecutionVariables
                : Map.<String, Object>of();
        var readResult = context != null && context.attributes().get("readResult") instanceof ReadResult read
                ? read
                : null;
        var sourceFile = sourcePayload != null ? sourcePayload.file() : null;
        var runtimeValues = StoredProcedureRuntimeSupport.buildRuntimeVariables(
                executionVariables,
                context != null ? context.processExecutionId() : null,
                context != null ? context.taskDefinitionId() : null,
                readResult != null ? readResult.recordCount() : records.size(),
                readResult != null ? readResult.skippedCount() : 0,
                sourcePayload != null ? sourcePayload.name() : null,
                sourcePayload != null ? sourcePayload.location() : null,
                sourcePayload != null ? sourcePayload.mediaType() : null,
                sourceFile != null ? sourceFile.size() : null,
                sourceFile != null ? sourceFile.lastModified() : null
        );
        TaskOutputSupport.mergeMetadata(runtimeValues, context);
        var taskOutputs = TaskOutputSupport.copyTaskOutputs(context);
        return records.stream().map(record -> {
            var values = new LinkedHashMap<String, Object>();
            if (record != null && record.values() != null) {
                values.putAll(record.values());
            }
            runtimeValues.forEach(values::putIfAbsent);
            taskOutputs.forEach(values::putIfAbsent);
            return new ReadRecord(values);
        }).toList();
    }

    private PaymentMessageFormatter resolveFormatter(String format) {
        return formatters.stream()
                .filter(f -> f.format().equalsIgnoreCase(format))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unsupported MT101 format: " + format + ". Available formats: " + availableFormats()));
    }

    private String availableFormats() {
        var sb = new StringBuilder();
        formatters.forEach(f -> {
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append(f.format());
        });
        return sb.toString();
    }

    private Mt101Message.Envelope buildEnvelope(Map<String, Object> cfg) {
        if (cfg.isEmpty()) {
            return null;
        }
        return new Mt101Message.Envelope(
                stringOrNull(cfg.get("senderLt")),
                stringOrNull(cfg.get("receiverLt")),
                resolveUetr(cfg),
                stringValue(cfg.get("priority"), DEFAULT_PRIORITY)
        );
    }

    private String resolveUetr(Map<String, Object> envelopeCfg) {
        var strategy = stringValue(envelopeCfg.get("uetrStrategy"), "perMessage");
        return switch (strategy) {
            case "perMessage" -> java.util.UUID.randomUUID().toString();
            case "fixed" -> stringOrNull(envelopeCfg.get("uetr"));
            default -> null;
        };
    }

    private Mt101Message.SequenceA buildSequenceA(Map<String, Object> cfg,
                                                  String sendersReference,
                                                  int messageIndex,
                                                  int messageTotal) {
        return new Mt101Message.SequenceA(
                sendersReference,
                stringOrNull(cfg.get("customerSpecifiedReference")),
                messageIndex,
                messageTotal,
                resolveDate(cfg.get("requestedExecutionDate")),
                buildParty(mapValue(cfg.get("instructingParty"))),
                buildParty(mapValue(cfg.get("orderingCustomer"))),
                buildParty(mapValue(cfg.get("accountServicingInstitution"))),
                stringOrNull(cfg.get("authorisation"))
        );
    }

    private String resolveSendersReference(Map<String, Object> sequenceACfg,
                                           TaskContext context,
                                           int messageIndex) {
        var template = stringValue(sequenceACfg.get("sendersReferenceTemplate"), "");
        if (template.isBlank()) {
            var direct = stringOrNull(sequenceACfg.get("sendersReference"));
            if (direct != null) {
                return direct;
            }
            throw new IllegalArgumentException(
                    "MT101_BUILD requires sequenceA.sendersReferenceTemplate or sequenceA.sendersReference");
        }
        var resolved = template
                .replace("${_processExecutionId}", String.valueOf(context.processExecutionId()))
                .replace("${batchCode}", batchCode(context))
                .replace("${messageIndex}", String.valueOf(messageIndex));
        if (resolved.length() > 16) {
            throw new IllegalArgumentException("MT101_BUILD sendersReference exceeds 16 characters: " + resolved);
        }
        return resolved;
    }

    /**
     * Codigo de lote unico por ejecucion: base36 del {@code processExecutionId}
     * en mayusculas (charset SWIFT-X valido, ~4-7 chars). Garantiza que dos
     * ejecuciones distintas con la misma {@code requested_execution_date} no
     * colisionen en el indice de idempotencia
     * {@code (senders_reference, requested_execution_date)}: cada lote produce
     * referencias {@code <batchCode><index>} distintas, mientras que un re-run
     * de la MISMA ejecucion reproduce el mismo codigo (idempotencia real).
     */
    private String batchCode(TaskContext context) {
        var executionId = context.processExecutionId();
        if (executionId == null) {
            return "0";
        }
        return Long.toString(executionId, 36).toUpperCase(java.util.Locale.ROOT);
    }

    private LocalDate resolveDate(Object raw) {
        if (raw == null) {
            return LocalDate.now();
        }
        var value = String.valueOf(raw).trim();
        if (value.isEmpty() || "${today}".equals(value)) {
            return LocalDate.now();
        }
        if (value.startsWith("${today+") && value.endsWith("bd}")) {
            // T+N business days (sin calendario nacional aun: T-025 spec 008).
            var days = Integer.parseInt(value.substring(8, value.length() - 3));
            return addBusinessDays(LocalDate.now(), days);
        }
        return LocalDate.parse(value);
    }

    private LocalDate addBusinessDays(LocalDate from, int businessDays) {
        var date = from;
        var remaining = businessDays;
        while (remaining > 0) {
            date = date.plusDays(1);
            var dow = date.getDayOfWeek().getValue();
            if (dow < 6) {
                remaining--;
            }
        }
        return date;
    }

    private List<Mt101Message.Transaction> buildTransactions(List<ReadRecord> records,
                                                             Map<String, Object> mappings,
                                                             TaskContext context,
                                                             int recordOffset) {
        var result = new ArrayList<Mt101Message.Transaction>(records.size());
        var amountCfg = mapValue(mappings.get("amount"));
        var beneficiaryCfg = mapValue(mappings.get("beneficiary"));
        var accountWithCfg = mapValue(mappings.get("accountWithInstitution"));
        var orderingCustomerCfg = mapValue(mappings.get("orderingCustomer"));
        var accountServicingCfg = mapValue(mappings.get("accountServicingInstitution"));
        var txRefTemplate = stringValue(mappings.get("transactionReferenceTemplate"),
                "TX-${_processExecutionId}-${recordNumber}");
        var remittanceField = stringOrNull(mappings.get("remittanceInformationField"));
        var chargesField = stringOrNull(mappings.get("detailsOfChargesField"));

        for (int i = 0; i < records.size(); i++) {
            var record = records.get(i);
            var values = record == null || record.values() == null ? Map.<String, Object>of() : record.values();
            var sequenceNumber = recordOffset + i + 1;
            var transactionReference = renderTransactionReference(txRefTemplate, context, sequenceNumber, values);

            result.add(new Mt101Message.Transaction(
                    sequenceNumber,
                    transactionReference,
                    null,
                    null,
                    buildAmount(amountCfg, values),
                    buildPartyFromMapping(orderingCustomerCfg, values),
                    buildPartyFromMapping(accountServicingCfg, values),
                    null,
                    buildPartyFromMapping(accountWithCfg, values),
                    buildPartyFromMapping(beneficiaryCfg, values),
                    stringFieldValue(values, remittanceField),
                    null,
                    null,
                    stringFieldValue(values, chargesField),
                    null,
                    null
            ));
        }
        return result;
    }

    private String renderTransactionReference(String template,
                                              TaskContext context,
                                              int sequenceNumber,
                                              Map<String, Object> recordValues) {
        var resolved = template
                .replace("${_processExecutionId}", String.valueOf(context.processExecutionId()))
                .replace("${recordNumber}", String.valueOf(sequenceNumber));
        for (var entry : recordValues.entrySet()) {
            var placeholder = "${" + entry.getKey() + "}";
            resolved = resolved.replace(placeholder, entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
        }
        if (resolved.length() > 16) {
            throw new IllegalArgumentException("MT101_BUILD transactionReference exceeds 16 characters: " + resolved);
        }
        return resolved;
    }

    private Mt101Message.Amount buildAmount(Map<String, Object> cfg, Map<String, Object> values) {
        if (cfg.isEmpty()) {
            return null;
        }
        var currency = stringFieldValue(values, stringOrNull(cfg.get("currencyField")));
        var raw = values.get(stringValue(cfg.get("valueField"), ""));
        var amount = raw == null ? null : parseAmount(raw);
        return new Mt101Message.Amount(currency, amount);
    }

    private BigDecimal parseAmount(Object raw) {
        var value = String.valueOf(raw).trim();
        if (value.isBlank()) {
            return null;
        }
        var normalized = value.replace(" ", "");
        if (normalized.contains(",") && normalized.contains(".")) {
            normalized = normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
                    ? normalized.replace(".", "").replace(',', '.')
                    : normalized.replace(",", "");
        } else if (normalized.contains(",")) {
            normalized = normalized.replace(',', '.');
        }
        return new BigDecimal(normalized);
    }

    private String resolveDebitAccountMode(Map<String, Object> configuration,
                                           Map<String, Object> sequenceACfg,
                                           Map<String, Object> mappingsCfg) {
        var configured = stringValue(configuration.get("debitAccountMode"), "");
        if (!configured.isBlank()) {
            return configured;
        }
        var sequenceAOrdering = mapValue(sequenceACfg.get("orderingCustomer"));
        var txOrdering = mapValue(mappingsCfg.get("orderingCustomer"));
        var hasSequenceADebit = !isEmptyParty(
                stringValue(sequenceAOrdering.get("option"), ""),
                stringOrNull(sequenceAOrdering.get("account")),
                stringOrNull(sequenceAOrdering.get("bic")),
                nameAndAddressFromConfig(sequenceAOrdering.get("nameAndAddress")));
        var hasTransactionDebit = !txOrdering.isEmpty();
        if (hasSequenceADebit && hasTransactionDebit) {
            return "mixed";
        }
        return hasTransactionDebit ? "multipleDebit" : "singleDebit";
    }

    private void validateDebitAccountMode(String mode,
                                          Mt101Message.SequenceA sequenceA,
                                          List<Mt101Message.Transaction> transactions) {
        var normalized = mode == null ? "singleDebit" : mode.trim();
        var hasSequenceADebit = sequenceA != null && hasPartyValue(sequenceA.orderingCustomer());
        var transactionsWithDebit = transactions.stream()
                .filter(tx -> hasPartyValue(tx.orderingCustomer()))
                .count();
        switch (normalized) {
            case "singleDebit" -> {
                if (!hasSequenceADebit) {
                    throw new IllegalArgumentException("MT101_BUILD debitAccountMode=singleDebit requires sequenceA.orderingCustomer");
                }
                if (transactionsWithDebit > 0) {
                    throw new IllegalArgumentException("MT101_BUILD debitAccountMode=singleDebit cannot use transactionMappings.orderingCustomer");
                }
            }
            case "multipleDebit", "subsidiary" -> {
                if (hasSequenceADebit) {
                    throw new IllegalArgumentException("MT101_BUILD debitAccountMode=" + normalized
                            + " requires orderingCustomer only in transactionMappings");
                }
                if (transactionsWithDebit != transactions.size()) {
                    throw new IllegalArgumentException("MT101_BUILD debitAccountMode=" + normalized
                            + " requires orderingCustomer in every transaction");
                }
            }
            case "mixed" -> throw new IllegalArgumentException(
                    "MT101_BUILD cannot place orderingCustomer in Sequence A and Sequence B at the same time");
            default -> throw new IllegalArgumentException("Unsupported MT101_BUILD debitAccountMode: " + mode);
        }
    }

    private Mt101Message.Party buildPartyFromMapping(Map<String, Object> cfg, Map<String, Object> values) {
        if (cfg.isEmpty()) {
            return null;
        }
        var option = stringValue(cfg.get("option"), "");
        var account = stringFieldValue(values, stringOrNull(cfg.get("accountField")));
        var bic = stringFieldValue(values, stringOrNull(cfg.get("bicField")));
        var nameAndAddress = nameAndAddressFromMapping(cfg, values);
        if (isEmptyParty(option, account, bic, nameAndAddress)) {
            return null;
        }
        return new Mt101Message.Party(option, account, bic, nameAndAddress);
    }

    private Mt101Message.Party buildParty(Map<String, Object> cfg) {
        if (cfg.isEmpty()) {
            return null;
        }
        var option = stringValue(cfg.get("option"), "");
        var account = stringOrNull(cfg.get("account"));
        var bic = stringOrNull(cfg.get("bic"));
        var nameAndAddress = nameAndAddressFromConfig(cfg.get("nameAndAddress"));
        if (isEmptyParty(option, account, bic, nameAndAddress)) {
            return null;
        }
        return new Mt101Message.Party(option, account, bic, nameAndAddress);
    }

    private List<String> nameAndAddressFromMapping(Map<String, Object> cfg, Map<String, Object> values) {
        var raw = cfg.get("nameAndAddressFields");
        if (!(raw instanceof List<?> rawList)) {
            return List.of();
        }
        var lines = new ArrayList<String>();
        for (var fieldName : rawList) {
            if (fieldName == null) {
                continue;
            }
            var fieldValue = stringFieldValue(values, String.valueOf(fieldName));
            if (fieldValue != null && !fieldValue.isBlank()) {
                lines.add(fieldValue);
            }
        }
        return lines;
    }

    private List<String> nameAndAddressFromConfig(Object raw) {
        if (!(raw instanceof List<?> rawList)) {
            return List.of();
        }
        var lines = new ArrayList<String>();
        for (var line : rawList) {
            if (line != null && !String.valueOf(line).isBlank()) {
                lines.add(String.valueOf(line));
            }
        }
        return lines;
    }

    private boolean isEmptyParty(String option, String account, String bic, List<String> nameAndAddress) {
        return (account == null || account.isBlank())
                && (bic == null || bic.isBlank())
                && (nameAndAddress == null || nameAndAddress.isEmpty());
    }

    private boolean hasPartyValue(Mt101Message.Party party) {
        return party != null && !isEmptyParty(
                party.option(),
                party.account(),
                party.bic(),
                party.nameAndAddress());
    }

    private Mt101Message.ControlTotals computeControlTotals(List<Mt101Message.Transaction> transactions) {
        var totals = new TreeMap<String, BigDecimal>();
        for (var tx : transactions) {
            if (tx.amount() == null || tx.amount().currency() == null || tx.amount().value() == null) {
                continue;
            }
            totals.merge(tx.amount().currency(), tx.amount().value(), BigDecimal::add);
        }
        return new Mt101Message.ControlTotals(transactions.size(), totals);
    }

    // --- helpers ---

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Object raw) {
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw);
        return value.isBlank() ? defaultValue : value;
    }

    private String stringOrNull(Object raw) {
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private String stringFieldValue(Map<String, Object> values, String fieldName) {
        if (fieldName == null || fieldName.isBlank()) {
            return null;
        }
        var raw = values.get(fieldName);
        if (raw == null) {
            return null;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }

    private int intAttribute(TaskContext context, String key, int defaultValue) {
        if (context == null || !context.attributes().containsKey(key)) {
            return defaultValue;
        }
        var raw = context.attributes().get(key);
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
    }
}
