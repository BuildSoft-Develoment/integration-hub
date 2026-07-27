package com.integrationhub.platform.provider.task.payments.swift;


import com.integrationhub.vertical.swift.mt101.provider.Mt101Audit;
import com.integrationhub.vertical.swift.mt101.provider.Mt101InboundMapper;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.provider.task.dbwrite.DbTaskSupport;
import com.integrationhub.vertical.swift.mt101.provider.format.FinMt101Formatter;
import com.integrationhub.vertical.swift.mt101.repository.Mt101StagingRecordRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Task provider {@code MT101_PARSE_FROM_TABLE}: equivalente inbound, table-backed y
 * paginado de {@code MT101_PARSE}. Lee la tabla staging (poblada por
 * {@code FILE_READ(SWIFT_MT) -> DB_WRITE}) por keyset, mapea cada mensaje SWIFT a
 * {@link Mt101Message} con {@link Mt101InboundMapper} y lo escribe en
 * {@link SwiftInboundStore} (status {@code PARSED}) en lotes. Mantiene memoria
 * O(pageSize): VALIDATE/ROUTE leen luego el store en paginas. Habilita ingestion
 * inbound a 1M+ transacciones sin materializar todo en memoria.
 *
 * <p>Output {@code inboundSource}: descriptor {@code {inboundSetId, table, connectionRef}}
 * que las tareas siguientes resuelven via {@code Mt101MessageInputResolver}.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-008
 * @trace ADR-009
 */
@ApplicationScoped
public class Mt101ParseFromTableTaskProvider implements TaskProvider {

    private static final String DEFAULT_TABLE = "staging_record";
    private static final String DEFAULT_PAYLOAD_COLUMN = "payload_json";
    private static final String DEFAULT_ID_COLUMN = "id";
    private static final int DEFAULT_PAGE_SIZE = 500;
    private static final int INSERT_BATCH_SIZE = 200;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final SwiftInboundStore inboundStore;
    private final Mt101StagingRecordRepository stagingRepository;
    private final FinMt101Formatter finFormatter;
    private final RecordAuditEmitter recordAuditEmitter;

    @Inject
    public Mt101ParseFromTableTaskProvider(DataSource defaultDataSource,
                                           ConnectionPoolManager connectionPoolManager,
                                           JsonConfigurationMapper jsonConfigurationMapper,
                                           SwiftInboundStore inboundStore,
                                           Mt101StagingRecordRepository stagingRepository,
                                           FinMt101Formatter finFormatter,
                                           RecordAuditEmitter recordAuditEmitter) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.inboundStore = inboundStore;
        this.stagingRepository = stagingRepository;
        this.finFormatter = finFormatter;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    @Override
    public String type() {
        return "MT101_PARSE_FROM_TABLE";
    }

    @Override
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var source = resolveSource(context, configuration);
        long totalRows;
        try {
            totalRows = stagingRepository.countRows(source.dataSource(), sourceQuery(source));
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot count inbound source rows from " + source.table(), error);
        }
        if (totalRows == 0) {
            return TaskResult.success("MT101_PARSE_FROM_TABLE skipped because source table has no rows");
        }

        var inboundSetId = resolveInboundSetId(context, configuration);
        if (boolValue(configuration.get("replaceExisting"), true)) {
            inboundStore.replaceSet(source.connectionRef(), inboundSetId);
        }
        var pageSize = intValue(configuration.get("pageSize"), DEFAULT_PAGE_SIZE);

        var insertBuffer = new ArrayList<SwiftInboundStore.InboundInsert>(INSERT_BATCH_SIZE);
        var auditBuffer = new ArrayList<AuditEnvelope>(INSERT_BATCH_SIZE);
        var parsed = 0;
        long transactions = 0;
        var errors = new ArrayList<Map<String, Object>>();

        try (Connection connection = source.dataSource().getConnection()) {
            var lastId = 0L;
            while (true) {
                var rows = stagingRepository.readRowsAfter(connection, sourceQuery(source), lastId, pageSize);
                if (rows.isEmpty()) {
                    break;
                }
                for (var row : rows) {
                    lastId = row.id();
                    try {
                        var values = jsonConfigurationMapper.toMap(row.payloadJson());
                        var message = Mt101InboundMapper.toMessage(values);
                        var raw = finFormatter.format(message);
                        insertBuffer.add(new SwiftInboundStore.InboundInsert(
                                inboundSetId, source.processExecutionId(), source.taskDefinitionId(),
                                source.table(), row.id(), row.id(), raw, message));
                        auditBuffer.add(Mt101Audit.messageEvent(context, message,
                                "PAYMENT_MESSAGE_PARSED", "PARSED", null, Map.of()));
                        parsed++;
                        transactions += message.transactions().size();
                        if (insertBuffer.size() >= INSERT_BATCH_SIZE) {
                            flush(source.connectionRef(), insertBuffer, auditBuffer);
                        }
                    } catch (RuntimeException parseError) {
                        var entry = new LinkedHashMap<String, Object>();
                        entry.put("stagingId", row.id());
                        entry.put("error", parseError.getMessage());
                        errors.add(entry);
                    }
                }
            }
            flush(source.connectionRef(), insertBuffer, auditBuffer);
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot read inbound source rows from " + source.table(), error);
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("inboundSource", inboundStore.source(source.connectionRef(), inboundSetId, parsed));
        outputs.put("parsed", parsed);
        outputs.put("transactions", transactions);
        outputs.put("errorCount", errors.size());
        outputs.put("errors", errors);

        var summary = "MT101_PARSE_FROM_TABLE parsed=" + parsed
                + " transactions=" + transactions
                + " errors=" + errors.size();
        return errors.isEmpty()
                ? TaskResult.success(summary, outputs)
                : TaskResult.failure(summary, outputs);
    }

    private void flush(String connectionRef,
                       List<SwiftInboundStore.InboundInsert> insertBuffer,
                       List<AuditEnvelope> auditBuffer) {
        if (insertBuffer.isEmpty()) {
            return;
        }
        inboundStore.insertMessages(connectionRef, new ArrayList<>(insertBuffer));
        if (recordAuditEmitter != null && !auditBuffer.isEmpty()) {
            recordAuditEmitter.emitRecords(new ArrayList<>(auditBuffer));
        }
        insertBuffer.clear();
        auditBuffer.clear();
    }

    private SourceTable resolveSource(TaskContext context, Map<String, Object> configuration) {
        var input = mapValue(configuration.get("input"));
        var sourceTaskRef = stringValue(input.get("sourceTaskRef"), "");
        var taskOutputs = taskOutputs(context);

        var sourceCfg = mapValue(configuration.get("source"));
        var table = stringValue(sourceCfg.get("table"), "");
        if (table.isBlank() && !sourceTaskRef.isBlank()) {
            table = stringValue(taskOutputs.get(sourceTaskRef + ".table"), DEFAULT_TABLE);
        }
        if (table.isBlank()) {
            table = DEFAULT_TABLE;
        }

        var connectionRef = stringValue(firstNonBlank(
                input.get("connectionRef"),
                sourceCfg.get("connectionRef"),
                sourceTaskRef.isBlank() ? null : taskOutputs.get(sourceTaskRef + ".table.connectionRef"),
                configuration.get("connectionRef")), null);

        var processExecutionId = longValue(firstNonBlank(
                sourceCfg.get("processExecutionId"),
                sourceTaskRef.isBlank() ? null : taskOutputs.get(sourceTaskRef + ".processExecutionId"),
                sourceTaskRef.isBlank() ? null : taskOutputs.get(sourceTaskRef + ".metadata._processExecutionId"),
                context.processExecutionId()));
        var taskDefinitionId = longValue(firstNonBlank(
                sourceCfg.get("taskDefinitionId"),
                sourceTaskRef.isBlank() ? null : taskOutputs.get(sourceTaskRef + ".taskDefinitionId"),
                sourceTaskRef.isBlank() ? null : taskOutputs.get(sourceTaskRef + ".metadata._taskDefinitionId")));

        var payloadColumn = stringValue(sourceCfg.get("payloadColumn"), DEFAULT_PAYLOAD_COLUMN);
        var idColumn = stringValue(sourceCfg.get("idColumn"), DEFAULT_ID_COLUMN);
        return new SourceTable(
                resolveDataSource(connectionRef),
                connectionRef,
                DbTaskSupport.sanitizeQualifiedIdentifier(table),
                DbTaskSupport.sanitizeIdentifier(payloadColumn),
                DbTaskSupport.sanitizeIdentifier(idColumn),
                processExecutionId,
                taskDefinitionId);
    }

    private Mt101StagingRecordRepository.SourceQuery sourceQuery(SourceTable source) {
        return new Mt101StagingRecordRepository.SourceQuery(
                source.table(), source.payloadColumn(), source.idColumn(),
                source.processExecutionId(), source.taskDefinitionId());
    }

    private String resolveInboundSetId(TaskContext context, Map<String, Object> configuration) {
        var template = stringValue(configuration.get("inboundSetIdTemplate"),
                "INB-${_processExecutionId}-${_taskDefinitionId}");
        var resolved = template
                .replace("${_processExecutionId}", String.valueOf(context.processExecutionId()))
                .replace("${_taskDefinitionId}", String.valueOf(context.taskDefinitionId()));
        if (resolved.length() > 80) {
            throw new IllegalArgumentException("MT101_PARSE_FROM_TABLE inboundSetId exceeds 80 characters: " + resolved);
        }
        return resolved;
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> taskOutputs(TaskContext context) {
        if (context.attributes().get("taskOutputs") instanceof Map<?, ?> rawMap) {
            var result = new LinkedHashMap<String, Object>();
            rawMap.forEach((key, value) -> result.put(String.valueOf(key), value));
            return result;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Object raw) {
        if (raw instanceof Map<?, ?> map) {
            var result = new LinkedHashMap<String, Object>();
            map.forEach((key, value) -> result.put(String.valueOf(key), value));
            return result;
        }
        return Map.of();
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private Long longValue(Object raw) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return null;
        }
        if (raw instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(raw).trim());
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw).trim());
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw).trim());
    }

    private Object firstNonBlank(Object... values) {
        for (var value : values) {
            if (value != null && !String.valueOf(value).isBlank()) {
                return value;
            }
        }
        return null;
    }

    private record SourceTable(
            DataSource dataSource,
            String connectionRef,
            String table,
            String payloadColumn,
            String idColumn,
            Long processExecutionId,
            Long taskDefinitionId
    ) {
    }
}
