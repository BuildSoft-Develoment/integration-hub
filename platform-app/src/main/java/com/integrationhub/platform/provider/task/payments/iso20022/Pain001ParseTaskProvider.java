package com.integrationhub.platform.provider.task.payments.iso20022;

import com.integrationhub.platform.provider.task.payments.iso20022.mapper.Pain001ToMt101Mapper;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.source.SourcePayload;
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
import java.util.TreeMap;

/**
 * Task provider {@code PAIN001_PARSE}: interpreta los records crudos emitidos por
 * el reader {@code PAIN001_XML} (catalogo 002) y los normaliza a
 * {@link Mt101Message} via {@link Pain001ToMt101Mapper}, para que el pipeline
 * downstream ({@code MT101_VALIDATE}, {@code MT101_ARCHIVE}, {@code MT101_PAY},
 * {@code MT101_STATUS}, {@code MT101_ROUTE}, {@code MT101_SPLIT},
 * {@code MT101_REPAIR}) opere sin saber del formato origen.
 *
 * <p>Soporta dos formas de input (simetricas a {@code MT101_PARSE}):</p>
 * <ol>
 *   <li><b>Desde reader {@code PAIN001_XML}</b>: el motor pone los records en
 *       {@code context.attributes().get("readResult")}.</li>
 *   <li><b>Embebido</b>: {@code configuration.input.sourceTaskRef} apunta a una
 *       tarea anterior cuyo output {@code records} es {@code List<ReadRecord>}
 *       (o {@code List<Map>}).</li>
 * </ol>
 *
 * <p>Outputs publicados (multi-output, M-3):</p>
 * <ul>
 *   <li>{@code records}: {@code List<Mt101Message>} con format {@code PAIN001_XML}.</li>
 *   <li>{@code envelopes} / {@code headers} / {@code transactions}: vistas
 *       aplanadas, simetricas a {@code MT101_PARSE}.</li>
 *   <li>{@code summary}: {@code messageCount}, {@code transactionCount},
 *       {@code totalsByCurrency}.</li>
 *   <li>{@code errors}: registros cuyo mapping fallo, con {@code recordIndex} y
 *       {@code error}.</li>
 * </ul>
 *
 * @trace spec 008-mensajeria-pagos RF-008 (inbound pain.001)
 * @trace ADR-009
 */
@ApplicationScoped
public class Pain001ParseTaskProvider implements BatchTaskProvider {

    private final Pain001ToMt101Mapper mapper;

    @Inject
    public Pain001ParseTaskProvider(Pain001ToMt101Mapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public String type() {
        return "PAIN001_PARSE";
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
            return TaskResult.success("PAIN001_PARSE skipped because there are no raw records to parse");
        }

        var messages = new ArrayList<Mt101Message>(rawRecords.size());
        var errors = new ArrayList<Map<String, Object>>();
        var totalsByCurrency = new TreeMap<String, BigDecimal>();
        int totalTransactions = 0;

        for (int i = 0; i < rawRecords.size(); i++) {
            var raw = rawRecords.get(i);
            try {
                if (raw == null || raw.values() == null) {
                    throw new IllegalArgumentException("Empty record");
                }
                var message = mapper.map(raw.values());
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

        var summary = "PAIN001_PARSE parsed=" + messages.size()
                + " transactions=" + totalTransactions
                + " errors=" + errors.size();
        return errors.isEmpty()
                ? TaskResult.success(summary, outputs)
                : TaskResult.failure(summary, outputs);
    }

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
}
