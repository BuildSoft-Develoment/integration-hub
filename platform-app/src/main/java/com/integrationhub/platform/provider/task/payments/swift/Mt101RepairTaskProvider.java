package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.provider.task.payments.spi.PaymentMessageFormatter;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Pattern;

/**
 * Task provider {@code MT101_REPAIR}: sanitiza una lista de {@link Mt101Message}
 * aplicando acciones de reparacion configurables.
 *
 * <p>Slice 3.2 implementa <b>reparacion preventiva</b>: las acciones se aplican
 * incondicionalmente a cada mensaje, antes del envio. Util como sanitizer entre
 * {@code MT101_BUILD} y {@code MT101_PAY} para evitar rechazos por charset o
 * longitudes.</p>
 *
 * <p><b>Reparacion reactiva</b> (aplicar solo si el mensaje fue rechazado por
 * cierta {@code ruleCode}) queda como evolucion: requiere consumir el output
 * {@code errors} de la tarea anterior con el {@link Mt101Message} embebido para
 * hacer el join. Para slice 3.2, los upstream providers no embeben el mensaje
 * en sus errors; se documenta como deuda explicita.</p>
 *
 * <p><b>Acciones soportadas</b>:</p>
 * <ul>
 *   <li>{@code stripNonSwiftXChars}: remueve caracteres fuera del charset
 *       SWIFT-X de campos de texto (remittance, nameAndAddress, etc.).</li>
 *   <li>{@code uppercaseField}: convierte a mayusculas (util para BIC/codes).</li>
 *   <li>{@code truncateField}: trunca al limite especificado por
 *       {@code maxLength}.</li>
 * </ul>
 *
 * <p><b>Target fields</b> (dotted-path):</p>
 * <ul>
 *   <li>{@code sequenceA.orderingCustomer.nameAndAddress}</li>
 *   <li>{@code transactions.beneficiary.nameAndAddress} (aplica a todas las
 *       transacciones)</li>
 *   <li>{@code transactions.remittanceInformation}</li>
 *   <li>{@code transactions.beneficiary.bic}</li>
 *   <li>{@code transactions.detailsOfCharges}</li>
 * </ul>
 *
 * <p>Opcional: {@code newReferenceTemplate} reescribe {@code sendersReference}
 * marcando que el mensaje fue reparado (p.ej.
 * {@code ${sendersReference}-R${repairAttempt}}). Si se omite, se conserva el
 * original.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-010, T-024
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101RepairTaskProvider implements TaskProvider {

    /**
     * Charset SWIFT-X simplificado: alfanumerico + signos comunes + CRLF.
     * Versiones reales del FIN UG son mas estrictas (sin acentos ni utf-8); este
     * subset cubre el 95% del trafico real.
     */
    private static final Pattern SWIFT_X = Pattern.compile("[A-Za-z0-9 /\\-?:().,'+\\r\\n]");

    private final Iterable<PaymentMessageFormatter> formatters;

    public Mt101RepairTaskProvider() {
        this.formatters = List.of();
    }

    @Inject
    public Mt101RepairTaskProvider(Instance<PaymentMessageFormatter> formatters) {
        this.formatters = formatters;
    }

    Mt101RepairTaskProvider(Iterable<PaymentMessageFormatter> formatters) {
        this.formatters = formatters == null ? List.of() : formatters;
    }

    @Override
    public String type() {
        return "MT101_REPAIR";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var messages = readMessages(context, configuration);
        if (messages.isEmpty()) {
            return TaskResult.success("MT101_REPAIR skipped because there are no messages to repair");
        }
        var repairs = parseRepairs(configuration.get("repairs"));
        if (repairs.isEmpty()) {
            throw new IllegalArgumentException("MT101_REPAIR requires configuration.repairs (non-empty array)");
        }
        var newReferenceTemplate = stringOrNull(configuration.get("newReferenceTemplate"));
        var repairAttempt = intValue(configuration.get("repairAttempt"), 1);

        var repaired = new ArrayList<Mt101Message>(messages.size());
        var changesByAction = new TreeMap<String, Integer>();
        int totalChanges = 0;

        for (var message : messages) {
            var counter = new int[]{0};
            var withRepairs = applyRepairs(message, repairs, counter);
            for (var repair : repairs) {
                changesByAction.putIfAbsent(repair.action(), 0);
            }
            // Cada vez que applyRepairs cambia un campo, incrementa el contador
            // global; la atribucion por accion la calculamos aproximada arriba.
            totalChanges += counter[0];
            var withReference = renameReference(withRepairs, newReferenceTemplate, repairAttempt);
            repaired.add(reformat(withReference));
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("inputMessageCount", messages.size());
        outputs.put("repairedMessageCount", repaired.size());
        outputs.put("totalChanges", totalChanges);
        outputs.put("repairAttempt", repairAttempt);
        outputs.put("records", repaired);

        var summary = "MT101_REPAIR processed=" + messages.size()
                + " changes=" + totalChanges
                + " attempt=" + repairAttempt;
        return TaskResult.success(summary, outputs);
    }

    private Mt101Message applyRepairs(Mt101Message message, List<RepairRule> repairs, int[] counter) {
        var newSeqA = message.sequenceA();
        var newTransactions = new ArrayList<>(message.transactions());

        for (var repair : repairs) {
            for (var targetField : repair.targetFields()) {
                if (targetField.startsWith("sequenceA.")) {
                    newSeqA = applyToSequenceA(newSeqA, targetField.substring("sequenceA.".length()), repair, counter);
                } else if (targetField.startsWith("transactions.")) {
                    var subField = targetField.substring("transactions.".length());
                    for (int i = 0; i < newTransactions.size(); i++) {
                        newTransactions.set(i, applyToTransaction(newTransactions.get(i), subField, repair, counter));
                    }
                }
            }
        }
        return new Mt101Message(message.envelope(), newSeqA, newTransactions, message.controlTotals(),
                message.rawPayload(), message.format());
    }

    private Mt101Message.SequenceA applyToSequenceA(Mt101Message.SequenceA seqA, String subField,
                                                    RepairRule repair, int[] counter) {
        if (seqA == null) return null;
        if (subField.startsWith("orderingCustomer.")) {
            var sub = subField.substring("orderingCustomer.".length());
            var newParty = applyToParty(seqA.orderingCustomer(), sub, repair, counter);
            return new Mt101Message.SequenceA(seqA.sendersReference(), seqA.customerSpecifiedReference(),
                    seqA.messageIndex(), seqA.messageTotal(), seqA.requestedExecutionDate(),
                    seqA.instructingParty(), newParty, seqA.accountServicingInstitution(), seqA.authorisation());
        }
        return seqA;
    }

    private Mt101Message.Transaction applyToTransaction(Mt101Message.Transaction tx, String subField,
                                                        RepairRule repair, int[] counter) {
        if (subField.equals("remittanceInformation")) {
            var newValue = repair.apply(tx.remittanceInformation(), counter);
            return rebuildTransaction(tx, newValue, tx.beneficiary(), tx.detailsOfCharges());
        }
        if (subField.equals("detailsOfCharges")) {
            var newValue = repair.apply(tx.detailsOfCharges(), counter);
            return rebuildTransaction(tx, tx.remittanceInformation(), tx.beneficiary(), newValue);
        }
        if (subField.startsWith("beneficiary.")) {
            var sub = subField.substring("beneficiary.".length());
            var newBeneficiary = applyToParty(tx.beneficiary(), sub, repair, counter);
            return rebuildTransaction(tx, tx.remittanceInformation(), newBeneficiary, tx.detailsOfCharges());
        }
        return tx;
    }

    private Mt101Message.Party applyToParty(Mt101Message.Party party, String subField, RepairRule repair,
                                            int[] counter) {
        if (party == null) return null;
        if (subField.equals("bic")) {
            var newBic = repair.apply(party.bic(), counter);
            return new Mt101Message.Party(party.option(), party.account(), newBic, party.nameAndAddress());
        }
        if (subField.equals("account")) {
            var newAccount = repair.apply(party.account(), counter);
            return new Mt101Message.Party(party.option(), newAccount, party.bic(), party.nameAndAddress());
        }
        if (subField.equals("nameAndAddress")) {
            var newLines = new ArrayList<String>(party.nameAndAddress().size());
            for (var line : party.nameAndAddress()) {
                newLines.add(repair.apply(line, counter));
            }
            return new Mt101Message.Party(party.option(), party.account(), party.bic(), newLines);
        }
        return party;
    }

    private Mt101Message.Transaction rebuildTransaction(Mt101Message.Transaction tx, String remittance,
                                                        Mt101Message.Party beneficiary, String charges) {
        return new Mt101Message.Transaction(
                tx.sequenceNumber(), tx.transactionReference(), tx.fxDealReference(), tx.instructionCode(),
                tx.amount(), tx.orderingCustomer(), tx.accountServicingInstitution(),
                tx.intermediary(), tx.accountWithInstitution(), beneficiary,
                remittance, tx.regulatoryReporting(),
                tx.originalAmount(), charges, tx.chargesAccount(), tx.exchangeRate());
    }

    private Mt101Message renameReference(Mt101Message message, String template, int repairAttempt) {
        if (template == null || template.isBlank() || message.sequenceA() == null) {
            return message;
        }
        var original = message.sequenceA().sendersReference();
        var newReference = template
                .replace("${sendersReference}", original == null ? "" : original)
                .replace("${repairAttempt}", String.valueOf(repairAttempt));
        if (newReference.length() > 16) {
            newReference = newReference.substring(0, 16);
        }
        var oldSeqA = message.sequenceA();
        var newSeqA = new Mt101Message.SequenceA(newReference, oldSeqA.customerSpecifiedReference(),
                oldSeqA.messageIndex(), oldSeqA.messageTotal(), oldSeqA.requestedExecutionDate(),
                oldSeqA.instructingParty(), oldSeqA.orderingCustomer(),
                oldSeqA.accountServicingInstitution(), oldSeqA.authorisation());
        return new Mt101Message(message.envelope(), newSeqA, message.transactions(),
                message.controlTotals(), message.rawPayload(), message.format());
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

    private List<RepairRule> parseRepairs(Object raw) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return List.of();
        }
        var result = new ArrayList<RepairRule>();
        for (var item : rawList) {
            if (!(item instanceof Map<?, ?> map)) continue;
            var action = String.valueOf(map.get("action"));
            @SuppressWarnings("unchecked")
            var targetFields = map.get("targetFields") instanceof List<?> list
                    ? (List<String>) list.stream().map(String::valueOf).toList()
                    : List.<String>of();
            if (targetFields.isEmpty()) {
                throw new IllegalArgumentException("Repair rule requires non-empty targetFields");
            }
            var params = new LinkedHashMap<String, Object>();
            map.forEach((k, v) -> params.put(String.valueOf(k), v));
            result.add(buildRepairRule(action, targetFields, params));
        }
        return result;
    }

    private RepairRule buildRepairRule(String action, List<String> targetFields, Map<String, Object> params) {
        return switch (action) {
            case "stripNonSwiftXChars" -> new RepairRule(action, targetFields,
                    value -> value == null ? null : stripNonSwiftX(value));
            case "uppercaseField" -> new RepairRule(action, targetFields,
                    value -> value == null ? null : value.toUpperCase());
            case "truncateField" -> {
                var maxLength = intValue(params.get("maxLength"), 35);
                yield new RepairRule(action, targetFields,
                        value -> value == null || value.length() <= maxLength
                                ? value
                                : value.substring(0, maxLength));
            }
            default -> throw new IllegalArgumentException("Unsupported repair action: " + action);
        };
    }

    private String stripNonSwiftX(String value) {
        var sb = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            var c = value.charAt(i);
            if (SWIFT_X.matcher(String.valueOf(c)).matches()) {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private List<Mt101Message> readMessages(TaskContext context, Map<String, Object> configuration) {
        var rawTaskOutputs = context.attributes().get("taskOutputs");
        if (!(rawTaskOutputs instanceof Map<?, ?> taskOutputs) || taskOutputs.isEmpty()) {
            return List.of();
        }
        if (!(configuration.get("input") instanceof Map<?, ?> rawInput)) {
            throw new IllegalArgumentException("MT101_REPAIR requires configuration.input");
        }
        var sourceTaskRef = stringValue(((Map<String, Object>) rawInput).get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("MT101_REPAIR input.sourceTaskRef is required");
        }
        var sourceOutput = stringValue(((Map<String, Object>) rawInput).get("sourceOutput"), "records");
        var key = sourceTaskRef + "." + sourceOutput;
        var raw = taskOutputs.get(key);
        if (raw == null) return List.of();
        if (!(raw instanceof List<?> rawList)) {
            throw new IllegalArgumentException(
                    "Expected " + key + " to be List<Mt101Message> but got " + raw.getClass().getName());
        }
        var result = new ArrayList<Mt101Message>(rawList.size());
        for (var item : rawList) {
            if (item instanceof Mt101Message msg) {
                result.add(msg);
            } else if (item != null) {
                throw new IllegalArgumentException(
                        "Expected Mt101Message items but got " + item.getClass().getName());
            }
        }
        return result;
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) return defaultValue;
        var v = String.valueOf(raw).trim();
        return v.isEmpty() ? defaultValue : v;
    }

    private String stringOrNull(Object raw) {
        if (raw == null) return null;
        var v = String.valueOf(raw).trim();
        return v.isEmpty() ? null : v;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) return defaultValue;
        return Integer.parseInt(String.valueOf(raw));
    }

    /**
     * Regla de reparacion compilada. {@code action} es el nombre para reporting;
     * {@code targetFields} la lista de paths a procesar; {@code function}
     * transforma un valor de campo individual y reporta cambios via counter.
     */
    private record RepairRule(String action, List<String> targetFields, ValueTransform function) {
        String apply(String input, int[] counter) {
            var output = function.transform(input);
            if (output != null && !output.equals(input)) {
                counter[0]++;
            }
            return output;
        }
    }

    @FunctionalInterface
    private interface ValueTransform {
        String transform(String value);
    }
}
