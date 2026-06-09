package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Task provider {@code MT101_PARSE}: interpreta los records crudos producidos por
 * el reader {@code SWIFT_MT} (catalogo 002) y los normaliza a
 * {@link Mt101Message} para que tareas posteriores ({@code MT101_VALIDATE},
 * {@code DB_WRITE}, {@code MT101_ROUTE}, etc.) trabajen con objetos tipados.
 *
 * <p>Slice 2.3 (sprint 2): single-output puente hasta que M-3 (T-018 spec 003)
 * habilite outputs multi-nominados. El provider publica:</p>
 * <ul>
 *   <li>{@code records}: lista de {@link Mt101Message} con envelope + sequenceA +
 *       transacciones + controlTotals. El {@code rawPayload} queda en {@code null}
 *       (no rehidratamos el formato; solo el modelo).</li>
 *   <li>{@code summary}: {@code messageCount}, {@code transactionCount},
 *       {@code totalsByCurrency}.</li>
 *   <li>{@code errors}: messages cuyo parsing fallo (con detalle).</li>
 * </ul>
 *
 * <p>Cuando M-3 entre, este provider publicara tambien {@code envelope},
 * {@code header} y {@code transactions} como outputs separados sin cambiar el
 * contrato de records.</p>
 *
 * <p><b>Soporta dos formas de input</b>:</p>
 * <ol>
 *   <li><b>Desde reader {@code SWIFT_MT}</b> (catalogo 002): el motor pone los
 *       records en {@code context.attributes().get("readResult")}. Cada record es
 *       un Map con las llaves estructuradas {@code block1/block2/sequenceA/sequenceB}.</li>
 *   <li><b>Embebido</b>: si {@code configuration.input} apunta a una tarea anterior,
 *       lee los records desde {@code taskOutputs}.</li>
 * </ol>
 *
 * @trace spec 008-mensajeria-pagos RF-008, T-016
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ParseTaskProvider implements BatchTaskProvider {

    private static final DateTimeFormatter DATE_YYMMDD = DateTimeFormatter.ofPattern("yyMMdd");
    // Acepta {@code CCYNNNN,} (sin decimales), {@code CCYNNNN,DD} (con decimales) y
    // {@code CCYNNNN} (sin separador). El segundo grupo captura el numero crudo;
    // {@link #parseAmount} reemplaza la coma por punto para BigDecimal.
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("^([A-Z]{3})([0-9]+,?[0-9]*)$");

    @Override
    public String type() {
        return "MT101_PARSE";
    }

    @Override
    public TaskResult executeRecords(TaskContext context,
                                     Map<String, Object> configuration,
                                     List<ReadRecord> records,
                                     SourcePayload sourcePayload) {
        var rawRecords = records != null && !records.isEmpty()
                ? records
                : readFromTaskOutputs(context, configuration);
        if (rawRecords.isEmpty()) {
            return TaskResult.success("MT101_PARSE skipped because there are no raw records to parse");
        }

        var messages = new ArrayList<Mt101Message>(rawRecords.size());
        var errors = new ArrayList<Map<String, Object>>();
        var totalsByCurrency = new java.util.TreeMap<String, BigDecimal>();
        int totalTransactions = 0;

        for (int i = 0; i < rawRecords.size(); i++) {
            var raw = rawRecords.get(i);
            try {
                var message = parseMessage(raw);
                messages.add(message);
                totalTransactions += message.transactions().size();
                if (message.controlTotals() != null) {
                    message.controlTotals().totalsByCurrency().forEach((currency, amount) ->
                            totalsByCurrency.merge(currency, amount, BigDecimal::add));
                }
            } catch (RuntimeException error) {
                var entry = new LinkedHashMap<String, Object>();
                entry.put("recordIndex", i);
                entry.put("error", error.getMessage());
                errors.add(entry);
            }
        }

        // Cierre M-3 (T-018 spec 003, ADR-009): publicar outputs multi-nominados
        // por defecto. El motor (TaskOutputRegistry.registerTypedOutput) ya
        // soporta esto desde slice 4.1; el bloqueo "publishMultiOutput=false"
        // era solo del provider como puente.
        //
        // Outputs publicados:
        //   <ref>.records      : List<Mt101Message> tipados (compat con MT101_PAY/ARCHIVE/etc).
        //   <ref>.envelopes    : List<Envelope> de cada mensaje (M-3).
        //   <ref>.headers      : List<SequenceA> de cada mensaje (M-3).
        //   <ref>.transactions : List<Transaction> aplanado de todos los mensajes (M-3).
        //   <ref>.summary      : agregados {messageCount, transactionCount, totalsByCurrency}.
        var envelopes = new ArrayList<Mt101Message.Envelope>(messages.size());
        var headers = new ArrayList<Mt101Message.SequenceA>(messages.size());
        var transactions = new ArrayList<Mt101Message.Transaction>();
        for (var message : messages) {
            if (message.envelope() != null) envelopes.add(message.envelope());
            if (message.sequenceA() != null) headers.add(message.sequenceA());
            transactions.addAll(message.transactions());
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("messageCount", messages.size());
        outputs.put("transactionCount", totalTransactions);
        outputs.put("totalsByCurrency", totalsByCurrency);
        outputs.put("errorCount", errors.size());
        outputs.put("records", messages);
        outputs.put("envelopes", envelopes);
        outputs.put("headers", headers);
        outputs.put("transactions", transactions);
        outputs.put("errors", errors);

        var summary = "MT101_PARSE parsed=" + messages.size()
                + " transactions=" + totalTransactions
                + " errors=" + errors.size();
        return errors.isEmpty()
                ? TaskResult.success(summary, outputs)
                : TaskResult.failure(summary, outputs);
    }

    @SuppressWarnings("unchecked")
    private Mt101Message parseMessage(ReadRecord raw) {
        if (raw == null || raw.values() == null) {
            throw new IllegalArgumentException("Empty record");
        }
        var values = raw.values();
        var envelope = parseEnvelope(values);
        var sequenceA = parseSequenceA((Map<String, Object>) values.getOrDefault("sequenceA", Map.of()));
        var transactions = parseTransactions((List<Map<String, Object>>) values.getOrDefault("sequenceB", List.of()));
        var controlTotals = computeControlTotals(transactions);
        return new Mt101Message(envelope, sequenceA, transactions, controlTotals, null, null);
    }

    @SuppressWarnings("unchecked")
    private Mt101Message.Envelope parseEnvelope(Map<String, Object> values) {
        var block1 = stringOrNull(values.get("block1"));
        var block2 = stringOrNull(values.get("block2"));
        var block3 = (Map<String, String>) values.getOrDefault("block3", Map.of());
        var senderLt = extractLt(block1, "F01", 0);
        var receiverLt = extractLt(block2, null, 4);
        var priority = block2 != null && block2.length() > 16 ? block2.substring(16, 17) : "N";
        var uetr = block3.get("121");
        return new Mt101Message.Envelope(senderLt, receiverLt, uetr, priority);
    }

    /** Extrae el LT (12 chars) del block 1/2 segun el offset documentado por SWIFT. */
    private String extractLt(String block, String prefix, int prefixLenIfNoMatch) {
        if (block == null) return null;
        if (prefix != null && block.startsWith(prefix) && block.length() >= prefix.length() + 12) {
            return block.substring(prefix.length(), prefix.length() + 12);
        }
        if (block.length() >= prefixLenIfNoMatch + 12) {
            return block.substring(prefixLenIfNoMatch, prefixLenIfNoMatch + 12);
        }
        return null;
    }

    private Mt101Message.SequenceA parseSequenceA(Map<String, Object> tags) {
        var sendersReference = stringOrNull(tags.get("20"));
        var customerSpecifiedReference = stringOrNull(tags.get("21R"));
        var indexTotal = parseIndexTotal(stringOrNull(tags.get("28D")));
        var executionDate = parseFinDate(stringOrNull(tags.get("30")));
        var authorisation = stringOrNull(tags.get("25"));
        var orderingCustomer = parsePartyFromTags(tags, "50", List.of("F", "G", "H"));
        var accountServicing = parsePartyFromTags(tags, "52", List.of("A", "C"));
        var instructingParty = parsePartyFromTags(tags, "50", List.of("C", "L"));
        return new Mt101Message.SequenceA(
                sendersReference,
                customerSpecifiedReference,
                indexTotal[0], indexTotal[1],
                executionDate,
                instructingParty,
                orderingCustomer,
                accountServicing,
                authorisation);
    }

    private List<Mt101Message.Transaction> parseTransactions(List<Map<String, Object>> rawTransactions) {
        var result = new ArrayList<Mt101Message.Transaction>(rawTransactions.size());
        int seq = 1;
        for (var rawTx : rawTransactions) {
            @SuppressWarnings({"unchecked", "rawtypes"})
            var tags = (Map<String, Object>) (Map) rawTx;
            var transactionReference = stringOrNull(tags.get("21"));
            var fxDealReference = stringOrNull(tags.get("21F"));
            var instructionCode = stringOrNull(tags.get("23E"));
            var amount = parseAmount(stringOrNull(tags.get("32B")));
            var originalAmount = parseAmount(stringOrNull(tags.get("33B")));
            var exchangeRate = parseDecimal(stringOrNull(tags.get("36")));
            var orderingCustomer = parsePartyFromTags(tags, "50", List.of("F", "G", "H"));
            var accountServicing = parsePartyFromTags(tags, "52", List.of("A", "C"));
            var intermediary = parsePartyFromTags(tags, "56", List.of("A", "C", "D"));
            var accountWith = parsePartyFromTags(tags, "57", List.of("A", "C", "D"));
            var beneficiary = parsePartyFromTags(tags, "59", List.of("", "A", "F"));
            var remittance = stringOrNull(tags.get("70"));
            var regulatoryReporting = stringOrNull(tags.get("77B"));
            var detailsOfCharges = stringOrNull(tags.get("71A"));
            var chargesAccount = stringOrNull(tags.get("25A"));
            result.add(new Mt101Message.Transaction(
                    seq++, transactionReference, fxDealReference, instructionCode,
                    amount, orderingCustomer, accountServicing,
                    intermediary, accountWith, beneficiary,
                    remittance, regulatoryReporting,
                    originalAmount, detailsOfCharges, chargesAccount, exchangeRate));
        }
        return result;
    }

    private Mt101Message.Party parsePartyFromTags(Map<String, Object> tags, String baseTag, List<String> options) {
        for (var option : options) {
            var key = option.isEmpty() ? baseTag : baseTag + option;
            var raw = stringOrNull(tags.get(key));
            if (raw != null) {
                return parsePartyValue(option, raw);
            }
        }
        return null;
    }

    /**
     * Parsea el value de un tag de party. Convencion SWIFT:
     * <pre>
     *   /<account>
     *   <line 1>
     *   <line 2>
     *   ...
     * </pre>
     * Para option A/C/etc el BIC puede aparecer como primera linea sin slash.
     */
    private Mt101Message.Party parsePartyValue(String option, String raw) {
        var lines = new ArrayList<>(Arrays.asList(raw.split("\n")));
        String account = null;
        if (!lines.isEmpty() && lines.get(0).startsWith("/")) {
            account = lines.remove(0).substring(1);
        }
        String bic = null;
        var nameAddress = new ArrayList<String>();
        // Convencion: option A/C/D tienen BIC en la siguiente linea (no en raw text);
        // option F/G/H/H tienen name+address. Heuristica: si option ∈ {A,C,D}, primer
        // line restante es BIC; sino, son lineas de nombre y direccion.
        var isBicOption = option != null && "ACD".contains(option);
        if (isBicOption && !lines.isEmpty()) {
            bic = lines.remove(0).trim();
        }
        for (var line : lines) {
            if (!line.isBlank()) {
                nameAddress.add(line.trim());
            }
        }
        return new Mt101Message.Party(option == null ? "" : option, account, bic, nameAddress);
    }

    private int[] parseIndexTotal(String raw) {
        if (raw == null || !raw.contains("/")) {
            return new int[]{1, 1};
        }
        var parts = raw.split("/");
        try {
            return new int[]{Integer.parseInt(parts[0].trim()), Integer.parseInt(parts[1].trim())};
        } catch (NumberFormatException ignored) {
            return new int[]{1, 1};
        }
    }

    private LocalDate parseFinDate(String raw) {
        if (raw == null || raw.length() < 6) {
            return null;
        }
        try {
            return LocalDate.parse(raw.substring(0, 6), DATE_YYMMDD);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private Mt101Message.Amount parseAmount(String raw) {
        if (raw == null) return null;
        var matcher = AMOUNT_PATTERN.matcher(raw);
        if (!matcher.matches()) {
            return null;
        }
        var currency = matcher.group(1);
        var rawAmount = matcher.group(2).replace(',', '.');
        // Si quedo "20000." (coma trailing sin decimales), strip el punto final.
        if (rawAmount.endsWith(".")) {
            rawAmount = rawAmount.substring(0, rawAmount.length() - 1);
        }
        var value = new BigDecimal(rawAmount);
        return new Mt101Message.Amount(currency, value);
    }

    private BigDecimal parseDecimal(String raw) {
        if (raw == null) return null;
        try {
            return new BigDecimal(raw.replace(',', '.'));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Mt101Message.ControlTotals computeControlTotals(List<Mt101Message.Transaction> transactions) {
        var totals = new java.util.TreeMap<String, BigDecimal>();
        for (var tx : transactions) {
            if (tx.amount() == null || tx.amount().currency() == null || tx.amount().value() == null) continue;
            totals.merge(tx.amount().currency(), tx.amount().value(), BigDecimal::add);
        }
        return new Mt101Message.ControlTotals(transactions.size(), totals);
    }

    /** Lee records de {@code taskOutputs} cuando el provider se invoca con input embebido. */
    @SuppressWarnings("unchecked")
    private List<ReadRecord> readFromTaskOutputs(TaskContext context, Map<String, Object> configuration) {
        // Caso normal: el engine inyecta readResult via FILE_READ -> ya se manejo arriba.
        // Caso embebido: input.sourceTaskRef.sourceOutput contiene ReadRecords.
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()) {
            return List.of();
        }
        if (!(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            return List.of();
        }
        var sourceTaskRef = String.valueOf(((Map<String, Object>) rawInput).get("sourceTaskRef"));
        var sourceOutput = String.valueOf(((Map<String, Object>) rawInput).getOrDefault("sourceOutput", "records"));
        var key = sourceTaskRef + "." + sourceOutput;
        var raw = taskOutputs.get(key);
        if (!(raw instanceof List<?> rawList)) {
            return List.of();
        }
        var result = new ArrayList<ReadRecord>(rawList.size());
        for (var item : rawList) {
            if (item instanceof ReadRecord rec) {
                result.add(rec);
            } else if (item instanceof Map<?, ?> map) {
                var m = new LinkedHashMap<String, Object>();
                map.forEach((k, v) -> m.put(String.valueOf(k), v));
                result.add(new ReadRecord(m));
            }
        }
        return result;
    }

    private String stringOrNull(Object raw) {
        if (raw == null) return null;
        var value = String.valueOf(raw);
        return value.isEmpty() ? null : value;
    }
}
