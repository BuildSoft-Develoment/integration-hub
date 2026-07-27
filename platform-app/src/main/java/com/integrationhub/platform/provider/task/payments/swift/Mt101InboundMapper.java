package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Mapeo puro de un record SWIFT crudo (mapa {@code block1/block2/block3/sequenceA/
 * sequenceB/block5} que produce {@code SwiftMtReaderProvider}) a {@link Mt101Message}.
 *
 * <p>Extraido de {@code MT101_PARSE} para que tanto ese task como
 * {@code MT101_PARSE_FROM_TABLE} (streaming desde tabla staging) compartan la misma
 * interpretacion SWIFT sin duplicar codigo. Sin estado ni dependencias CDI.</p>
 */
final class Mt101InboundMapper {

    private static final DateTimeFormatter DATE_YYMMDD = DateTimeFormatter.ofPattern("yyMMdd");
    // Acepta CCYNNNN, (sin decimales), CCYNNNN,DD (con decimales) y CCYNNNN (sin separador).
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("^([A-Z]{3})([0-9]+,?[0-9]*)$");

    private Mt101InboundMapper() {
        // Utility class.
    }

    @SuppressWarnings("unchecked")
    static Mt101Message toMessage(Map<String, Object> values) {
        if (values == null) {
            throw new IllegalArgumentException("Empty record");
        }
        var envelope = parseEnvelope(values);
        var sequenceA = parseSequenceA((Map<String, Object>) values.getOrDefault("sequenceA", Map.of()));
        var transactions = parseTransactions((List<Map<String, Object>>) values.getOrDefault("sequenceB", List.of()));
        var controlTotals = computeControlTotals(transactions);
        return new Mt101Message(envelope, sequenceA, transactions, controlTotals, null, null);
    }

    @SuppressWarnings("unchecked")
    private static Mt101Message.Envelope parseEnvelope(Map<String, Object> values) {
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
    private static String extractLt(String block, String prefix, int prefixLenIfNoMatch) {
        if (block == null) return null;
        if (prefix != null && block.startsWith(prefix) && block.length() >= prefix.length() + 12) {
            return block.substring(prefix.length(), prefix.length() + 12);
        }
        if (block.length() >= prefixLenIfNoMatch + 12) {
            return block.substring(prefixLenIfNoMatch, prefixLenIfNoMatch + 12);
        }
        return null;
    }

    private static Mt101Message.SequenceA parseSequenceA(Map<String, Object> tags) {
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

    private static List<Mt101Message.Transaction> parseTransactions(List<Map<String, Object>> rawTransactions) {
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

    private static Mt101Message.Party parsePartyFromTags(Map<String, Object> tags, String baseTag, List<String> options) {
        for (var option : options) {
            var key = option.isEmpty() ? baseTag : baseTag + option;
            var raw = stringOrNull(tags.get(key));
            if (raw != null) {
                return parsePartyValue(option, raw);
            }
        }
        return null;
    }

    private static Mt101Message.Party parsePartyValue(String option, String raw) {
        var lines = new ArrayList<>(Arrays.asList(raw.split("\n")));
        String account = null;
        if (!lines.isEmpty() && lines.get(0).startsWith("/")) {
            account = lines.remove(0).substring(1);
        }
        String bic = null;
        var nameAddress = new ArrayList<String>();
        // Solo las opciones A/C/D llevan BIC en la primera linea. La opcion "" (:59: sin
        // letra) es cuenta + nombre/direccion: NO debe poblar bic. Cuidado: "ACD".contains("")
        // devuelve true en Java, asi que hay que excluir la cadena vacia explicitamente.
        var isBicOption = option != null && !option.isEmpty() && "ACD".contains(option);
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

    private static int[] parseIndexTotal(String raw) {
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

    private static LocalDate parseFinDate(String raw) {
        if (raw == null || raw.length() < 6) {
            return null;
        }
        try {
            return LocalDate.parse(raw.substring(0, 6), DATE_YYMMDD);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static Mt101Message.Amount parseAmount(String raw) {
        if (raw == null) return null;
        var matcher = AMOUNT_PATTERN.matcher(raw);
        if (!matcher.matches()) {
            return null;
        }
        var currency = matcher.group(1);
        var rawAmount = matcher.group(2).replace(',', '.');
        if (rawAmount.endsWith(".")) {
            rawAmount = rawAmount.substring(0, rawAmount.length() - 1);
        }
        var value = new BigDecimal(rawAmount);
        return new Mt101Message.Amount(currency, value);
    }

    private static BigDecimal parseDecimal(String raw) {
        if (raw == null) return null;
        try {
            return new BigDecimal(raw.replace(',', '.'));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static Mt101Message.ControlTotals computeControlTotals(List<Mt101Message.Transaction> transactions) {
        var totals = new java.util.TreeMap<String, BigDecimal>();
        for (var tx : transactions) {
            if (tx.amount() == null || tx.amount().currency() == null || tx.amount().value() == null) continue;
            totals.merge(tx.amount().currency(), tx.amount().value(), BigDecimal::add);
        }
        return new Mt101Message.ControlTotals(transactions.size(), totals);
    }

    private static String stringOrNull(Object raw) {
        if (raw == null) return null;
        var value = String.valueOf(raw);
        return value.isEmpty() ? null : value;
    }
}
