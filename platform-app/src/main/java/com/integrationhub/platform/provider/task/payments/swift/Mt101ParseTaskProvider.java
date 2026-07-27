package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.vertical.swift.mt101.provider.Mt101Audit;
import com.integrationhub.vertical.swift.mt101.provider.Mt101InboundMapper;

import com.integrationhub.vertical.swift.mt101.spi.Mt101Message;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Task provider {@code MT101_PARSE}: interpreta los records crudos producidos por
 * el reader {@code SWIFT_MT} (catalogo 002) y los normaliza a {@link Mt101Message}
 * para que tareas posteriores ({@code MT101_VALIDATE}, {@code DB_WRITE},
 * {@code MT101_ROUTE}, etc.) trabajen con objetos tipados.
 *
 * <p>La interpretacion SWIFT vive en {@link Mt101InboundMapper} (compartida con
 * {@code MT101_PARSE_FROM_TABLE}, el camino streaming a escala). Este provider lee
 * todo en memoria; para 1M+ transacciones usar la cadena table-backed.</p>
 *
 * <p><b>Soporta dos formas de input</b>: desde el reader {@code SWIFT_MT} (records en
 * {@code readResult}) o embebido ({@code configuration.input} apunta a una tarea previa).</p>
 *
 * @trace spec 008-mensajeria-pagos RF-008, T-016
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ParseTaskProvider implements BatchTaskProvider {

    private final RecordAuditEmitter recordAuditEmitter;

    public Mt101ParseTaskProvider() {
        this.recordAuditEmitter = null;
    }

    @Inject
    public Mt101ParseTaskProvider(RecordAuditEmitter recordAuditEmitter) {
        this.recordAuditEmitter = recordAuditEmitter;
    }

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

        var envelopes = new ArrayList<Mt101Message.Envelope>(messages.size());
        var headers = new ArrayList<Mt101Message.SequenceA>(messages.size());
        var transactions = new ArrayList<Mt101Message.Transaction>();
        for (var message : messages) {
            if (message.envelope() != null) envelopes.add(message.envelope());
            if (message.sequenceA() != null) headers.add(message.sequenceA());
            transactions.addAll(message.transactions());
        }
        emitRecordAudit(messages.stream()
                .map(message -> Mt101Audit.messageEvent(context, message, "PAYMENT_MESSAGE_PARSED", "PARSED", null, Map.of()))
                .toList());

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

    private Mt101Message parseMessage(ReadRecord raw) {
        if (raw == null || raw.values() == null) {
            throw new IllegalArgumentException("Empty record");
        }
        return Mt101InboundMapper.toMessage(raw.values());
    }

    /** Lee records de {@code taskOutputs} cuando el provider se invoca con input embebido. */
    @SuppressWarnings("unchecked")
    private List<ReadRecord> readFromTaskOutputs(TaskContext context, Map<String, Object> configuration) {
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

    private void emitRecordAudit(List<com.integrationhub.platform.audit.AuditEnvelope> envelopes) {
        if (recordAuditEmitter != null && envelopes != null && !envelopes.isEmpty()) {
            recordAuditEmitter.emitRecords(envelopes);
        }
    }
}
