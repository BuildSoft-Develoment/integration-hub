package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.spi.task.support.DbTaskSupport;
import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.repository.TaskInputRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Resuelve los inputs tipados de una tarea (`input`/`inputs`) desde outputs de tareas
 * anteriores y metadata transversal, incluyendo fan-in y lectura por lote. Ver ADR-004.
 *
 * @trace RF-007, RF-011, RF-012
 */
@ApplicationScoped
public class TaskInputResolver {

    private static final int DEFAULT_BATCH_SIZE = 1000;

    private final DataSource dataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final TaskInputRepository taskInputRepository;

    @Inject
    public TaskInputResolver(DataSource dataSource,
                            ConnectionPoolManager connectionPoolManager,
                            TaskInputRepository taskInputRepository) {
        this.dataSource = dataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.taskInputRepository = taskInputRepository;
    }

    public TaskInputResolver(DataSource dataSource, ConnectionPoolManager connectionPoolManager) {
        this(dataSource, connectionPoolManager, new TaskInputRepository());
    }

    public ResolvedInput resolve(Map<String, Object> configuration,
                                 Map<String, Object> taskOutputs) {
        var input = objectMap(configuration.get("input"));
        if (input.isEmpty()) {
            return new ResolvedInput(null, new ReadResult(List.of(), 0), null);
        }
        var source = stringValue(input.get("source"));
        if (!"task-output".equalsIgnoreCase(source)) {
            throw new IllegalArgumentException("Unsupported task input source: " + source);
        }

        var sourceTaskRef = stringValue(input.get("sourceTaskRef"));
        var sourceOutput = stringValue(input.get("sourceOutput"));
        if (sourceOutput.isBlank()) {
            sourceOutput = "records";
        }
        if ("table".equalsIgnoreCase(sourceOutput) || "targetTable".equalsIgnoreCase(sourceOutput)) {
            var tableName = resolveTableName(input, sourceTaskRef, taskOutputs);
            if (tableName.isBlank()) {
                throw new IllegalArgumentException("Cannot resolve table output for taskRef: " + sourceTaskRef);
            }
            return new ResolvedInput(
                    null,
                    new ReadResult(List.of(), 0),
                    new TableInput(
                            tableName,
                            firstPresent(
                                    input.get("connectionRef"),
                                    taskOutputs == null ? null : taskOutputs.get(sourceTaskRef + ".table.connectionRef"),
                                    configuration.get("connectionRef")),
                            intValue(input.get("batchSize"), intValue(configuration.get("batchSize"), DEFAULT_BATCH_SIZE)),
                            stringValue(objectMap(input.get("cursor")).get("orderBy")),
                            filters(input.get("filters"))
                    )
            );
        }

        var records = resolveRecords(sourceTaskRef, sourceOutput, taskOutputs);
        if (records != null) {
            return new ResolvedInput(null, new ReadResult(records, records.size()), null);
        }
        throw new IllegalArgumentException("Cannot resolve " + sourceOutput + " output for taskRef: " + sourceTaskRef);
    }

    public TaskExecutionAccumulator executeByMode(ResolvedInput input,
                                                  String executionMode,
                                                  int configuredBatchSize,
                                                  Function<BatchSlice, com.integrationhub.platform.spi.task.TaskResult> executor) {
        var mode = executionMode == null || executionMode.isBlank() ? "once" : executionMode.toLowerCase();
        if ("once".equals(mode)) {
            var records = input.readResult() == null ? List.<ReadRecord>of() : input.readResult().records();
            return TaskExecutionAccumulator.single(executor.apply(new BatchSlice(records, 0, 0, records.size())));
        }

        var batchSize = Math.max(1, configuredBatchSize > 0 ? configuredBatchSize : input.batchSize());
        var accumulator = new TaskExecutionAccumulator();
        if (input.tableInput() != null) {
            executeTableBatches(input.tableInput(), "per-record".equals(mode) ? 1 : batchSize, executor, accumulator);
            return accumulator;
        }

        var records = input.readResult() == null ? List.<ReadRecord>of() : input.readResult().records();
        var effectiveBatchSize = "per-record".equals(mode) ? 1 : batchSize;
        var batchNumber = 0;
        for (var from = 0; from < records.size(); from += effectiveBatchSize) {
            var to = Math.min(records.size(), from + effectiveBatchSize);
            var slice = new BatchSlice(records.subList(from, to), batchNumber++, from, to);
            accumulator.addRecords(slice.records().size());
            accumulator.add(executor.apply(slice));
        }
        if (records.isEmpty()) {
            accumulator.add(executor.apply(new BatchSlice(List.of(), 0, 0, 0)));
        }
        return accumulator;
    }

    private void executeTableBatches(TableInput tableInput,
                                     int batchSize,
                                     Function<BatchSlice, com.integrationhub.platform.spi.task.TaskResult> executor,
                                     TaskExecutionAccumulator accumulator) {
        // P1.4: paginacion keyset por orderBy (estable, sin saltos/duplicados) y portable por dialecto.
        // Requiere orderBy (idealmente clave unica/ordenable, p.ej. PK) para no omitir filas con valor repetido.
        if (tableInput.orderBy() == null || tableInput.orderBy().isBlank()) {
            throw new IllegalArgumentException(
                    "La lectura por lotes desde tabla requiere cursor.orderBy (paginacion keyset estable). Tabla: "
                            + tableInput.tableName());
        }
        Object lastKey = null;
        var batchNumber = 0;
        var processed = 0;
        while (true) {
            var records = readTableBatch(tableInput, batchSize, lastKey);
            if (records.isEmpty()) {
                if (batchNumber == 0) {
                    accumulator.addRecords(0);
                    accumulator.add(executor.apply(new BatchSlice(List.of(), 0, 0, 0)));
                }
                return;
            }
            var slice = new BatchSlice(records, batchNumber++, processed, processed + records.size());
            accumulator.addRecords(slice.records().size());
            accumulator.add(executor.apply(slice));
            processed += records.size();
            var nextKey = cursorValue(records, tableInput.orderBy());
            if (records.size() < batchSize || nextKey == null) {
                return;
            }
            lastKey = nextKey;
        }
    }

    private List<ReadRecord> readTableBatch(TableInput tableInput, int batchSize, Object lastKey) {
        var target = resolveTarget(tableInput.connectionRef());
        return taskInputRepository.readBatch(
                target.dataSource(),
                target.connectionType(),
                tableInput.tableName(),
                tableInput.orderBy(),
                tableInput.filters(),
                lastKey,
                batchSize);
    }

    /**
     * Key del cursor keyset = valor de {@code orderBy} en el último record de la página (o null).
     *
     * <p>La tolerancia al caso vivía aquí como un rodeo propio —era el único sitio donde alguien había
     * chocado con que Oracle devuelve las etiquetas en MAYÚSCULAS— y ahora la aporta
     * {@link ReadRecord#value(String)}, que es la forma canónica y la aplican por igual todos los
     * consumidores de un registro.
     */
    public static Object cursorValue(List<ReadRecord> records, String orderBy) {
        var last = records.get(records.size() - 1);
        var column = orderBy.contains(".") ? orderBy.substring(orderBy.lastIndexOf('.') + 1) : orderBy;
        return last.value(column);
    }

    private DataSource resolveDataSource(String connectionRef) {
        return resolveTarget(connectionRef).dataSource();
    }

    /**
     * ADR-022: el destino viaja junto con su motor. Sin {@code connectionRef} se lee de la base interna
     * de la plataforma, que es PostgreSQL por diseno.
     */
    private ConnectionPoolManager.JdbcConnectionTarget resolveTarget(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank()) {
            return new ConnectionPoolManager.JdbcConnectionTarget(dataSource, ConnectionType.POSTGRESQL);
        }
        return connectionPoolManager.resolveJdbcTarget(connectionRef);
    }

    private String resolveTableName(Map<String, Object> input, String sourceTaskRef, Map<String, Object> taskOutputs) {
        var configuredTable = stringValue(input.get("table"));
        if (!configuredTable.isBlank()) {
            return configuredTable;
        }
        if (sourceTaskRef.isBlank() || taskOutputs == null) {
            return "";
        }
        return firstPresent(
                taskOutputs.get(sourceTaskRef + ".table"),
                taskOutputs.get(sourceTaskRef + ".targetTable"),
                taskOutputs.get(sourceTaskRef + ".summary.targetTable")
        );
    }

    private List<ReadRecord> resolveRecords(String sourceTaskRef, String sourceOutput, Map<String, Object> taskOutputs) {
        if (sourceTaskRef.isBlank() || taskOutputs == null || taskOutputs.isEmpty()) {
            return null;
        }
        var value = firstObject(taskOutputs.get(sourceTaskRef + "." + sourceOutput));
        if (value == null && sourceOutput.isBlank()) {
            value = firstObject(taskOutputs.get(sourceTaskRef + ".records"));
        }
        if (value instanceof ReadResult readResult) {
            return readResult.records();
        }
        if (value instanceof Map<?, ?> rawMap) {
            var values = new LinkedHashMap<String, Object>();
            rawMap.forEach((key, mapValue) -> values.put(String.valueOf(key), mapValue));
            return List.of(new ReadRecord(values));
        }
        if (value instanceof List<?> rawList) {
            var records = new ArrayList<ReadRecord>();
            for (var item : rawList) {
                if (item instanceof ReadRecord readRecord) {
                    records.add(readRecord);
                } else if (item instanceof Map<?, ?> rawMap) {
                    var values = new LinkedHashMap<String, Object>();
                    rawMap.forEach((key, mapValue) -> values.put(String.valueOf(key), mapValue));
                    records.add(new ReadRecord(values));
                }
            }
            return records;
        }
        return null;
    }

    private Map<String, Object> filters(Object rawFilters) {
        var rawMap = objectMap(rawFilters);
        if (rawMap.isEmpty()) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> {
            var column = DbTaskSupport.sanitizeIdentifier(String.valueOf(key));
            result.put(column, value);
        });
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> objectMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, mapValue) -> result.put(String.valueOf(key), mapValue));
        return result;
    }

    private int intValue(Object value, int defaultValue) {
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private Object firstObject(Object... values) {
        for (var value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String firstPresent(Object... values) {
        for (var value : values) {
            if (value != null && !String.valueOf(value).isBlank()) {
                return String.valueOf(value);
            }
        }
        return "";
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    public record ResolvedInput(SourcePayload sourcePayload, ReadResult readResult, TableInput tableInput) {
        int batchSize() {
            return tableInput == null ? DEFAULT_BATCH_SIZE : tableInput.batchSize();
        }
    }

    public record TableInput(String tableName,
                             String connectionRef,
                             int batchSize,
                             String orderBy,
                             Map<String, Object> filters) {
    }

    public record BatchSlice(List<ReadRecord> records, int batchNumber, int batchFrom, int batchTo) {
    }

    public static final class TaskExecutionAccumulator {
        private int batchCount;
        private int recordCount;
        private boolean success = true;
        private String details = "Task completed";
        private final Map<String, Object> outputs = new LinkedHashMap<>();

        static TaskExecutionAccumulator single(com.integrationhub.platform.spi.task.TaskResult result) {
            var accumulator = new TaskExecutionAccumulator();
            accumulator.add(result);
            return accumulator;
        }

        void add(com.integrationhub.platform.spi.task.TaskResult result) {
            batchCount++;
            if (result != null) {
                // Un batch fallido marca la tarea completa: el engine decide si
                // aborta el proceso o continua segun continueOnFailure.
                success = success && result.success();
                details = result.details();
                if (result.outputs() != null) {
                    mergeOutputs(result.outputs());
                }
            }
        }

        public boolean success() {
            return success;
        }

        void addRecords(int count) {
            recordCount += count;
        }

        public String details() {
            if (batchCount <= 1) {
                return details;
            }
            return details + " across " + batchCount + " batch(es)";
        }

        public Map<String, Object> outputs() {
            var result = new LinkedHashMap<>(outputs);
            result.putIfAbsent("batchCount", batchCount);
            if (recordCount > 0) {
                result.putIfAbsent("processedCount", recordCount);
            }
            return result;
        }

        private void mergeOutputs(Map<String, Object> nextOutputs) {
            nextOutputs.forEach((key, value) -> {
                if (value instanceof Number nextNumber && outputs.get(key) instanceof Number currentNumber) {
                    outputs.put(key, currentNumber.longValue() + nextNumber.longValue());
                } else {
                    outputs.put(key, value);
                }
            });
        }
    }
}
