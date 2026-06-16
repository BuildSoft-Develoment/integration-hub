package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.provider.task.dbwrite.DbTaskSupport;
import com.integrationhub.platform.repository.payments.swift.Mt101StagingRecordRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Construye MT101 desde una tabla staging sin cargar todo el archivo en memoria.
 *
 * <p>Ruta recomendada para alto volumen:
 * {@code FILE_READ -> DB_WRITE(staging_record) -> MT101_BUILD_FROM_TABLE -> MT101_VALIDATE -> MT101_ARCHIVE -> MT101_PAY}.</p>
 *
 * <p><b>Fragmentacion en dos fases</b> (P2, escala 1M registros):</p>
 * <ol>
 *   <li><b>Planificacion</b>: keyset-scan ({@code id > lastId}) en paginas de
 *       {@code maxTransactionsPerMessage}; cada pagina se construye en memoria para
 *       medir bytes reales del payload. Si excede {@code maxBytesPerMessage}, la
 *       pagina se bisecta recursivamente hasta que cada sub-fragmento quepa. La
 *       medicion usa {@code messageTotal=99999} (ancho maximo de {@code :28D:}),
 *       asi el payload final con el total real nunca supera lo medido.</li>
 *   <li><b>Materializacion</b>: con el total definitivo conocido, cada fragmento se
 *       reconstruye con su {@code :28D:} index/total correcto y se persiste en
 *       {@code mt101_build_fragment}.</li>
 * </ol>
 *
 * <p>El costo es construir cada fragmento dos veces (operacion en memoria), a
 * cambio de nunca generar un MT101 que exceda el limite FIN de 10 KB ni abortar
 * por configuracion conservadora de {@code maxTransactionsPerMessage}.</p>
 */
@ApplicationScoped
public class Mt101BuildFromTableTaskProvider implements TaskProvider {

    private static final String DEFAULT_TABLE = "staging_record";
    private static final String DEFAULT_PAYLOAD_COLUMN = "payload_json";
    private static final String DEFAULT_ID_COLUMN = "id";
    private static final int DEFAULT_MAX_TRANSACTIONS = 100;
    private static final int DEFAULT_MAX_BYTES = 10000;
    /** Total provisional para medir bytes: ancho maximo 5n de {@code :28D:}. */
    private static final int MEASUREMENT_TOTAL = 99999;
    /** Maximo de fragmentos por set: limite 5n de {@code :28D:} message total. */
    private static final int MAX_FRAGMENTS_PER_SET = 99999;
    /** Fragmentos por executeBatch al persistir en fase 2. */
    private static final int INSERT_BATCH_SIZE = 100;

    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final Mt101BuildTaskProvider buildTaskProvider;
    private final Mt101FragmentStore fragmentStore;
    private final Mt101StagingRecordRepository stagingRepository;
    private final RecordAuditEmitter recordAuditEmitter;

    @Inject
    public Mt101BuildFromTableTaskProvider(DataSource defaultDataSource,
                                           ConnectionPoolManager connectionPoolManager,
                                           JsonConfigurationMapper jsonConfigurationMapper,
                                           Mt101BuildTaskProvider buildTaskProvider,
                                           Mt101FragmentStore fragmentStore,
                                           Mt101StagingRecordRepository stagingRepository,
                                           RecordAuditEmitter recordAuditEmitter) {
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.buildTaskProvider = buildTaskProvider;
        this.fragmentStore = fragmentStore;
        this.stagingRepository = stagingRepository;
        this.recordAuditEmitter = recordAuditEmitter;
    }

    public Mt101BuildFromTableTaskProvider(DataSource defaultDataSource,
                                           ConnectionPoolManager connectionPoolManager,
                                           JsonConfigurationMapper jsonConfigurationMapper,
                                           Mt101BuildTaskProvider buildTaskProvider,
                                           Mt101FragmentStore fragmentStore,
                                           Mt101StagingRecordRepository stagingRepository) {
        this(defaultDataSource, connectionPoolManager, jsonConfigurationMapper, buildTaskProvider,
                fragmentStore, stagingRepository, null);
    }

    public Mt101BuildFromTableTaskProvider(DataSource defaultDataSource,
                                           ConnectionPoolManager connectionPoolManager,
                                           JsonConfigurationMapper jsonConfigurationMapper,
                                           Mt101BuildTaskProvider buildTaskProvider,
                                           Mt101FragmentStore fragmentStore) {
        this(defaultDataSource, connectionPoolManager, jsonConfigurationMapper, buildTaskProvider,
                fragmentStore, new Mt101StagingRecordRepository(), null);
    }

    /**
     * Trama RECORD de construccion por fragmento (traceId=ejecucion, recordId=:20:).
     * Lleva en attributes el rango de record_index de las filas staging que componen
     * el fragmento -> drill-down N filas (INGESTED) -> 1 fragmento (BUILT): los
     * eventos INGESTED con record_index en [recordIndexFrom, recordIndexTo] alimentaron
     * este :20:.
     */
    private AuditEnvelope recordEnvelope(TaskContext context, String reference,
                                        FragmentPlan boundary, int rowCount) {
        // El rango va en payloadJson (lo persiste el store frio) para el drill-down
        // N filas (INGESTED) -> 1 fragmento (BUILT): fila del archivo en [from, to]
        // (1-based, igual que lo que ve el operador), mas los ids tecnicos de staging.
        var composition = new java.util.LinkedHashMap<String, Object>();
        composition.put("sourceRecordFrom", boundary.sourceRecordFrom());
        composition.put("sourceRecordTo", boundary.sourceRecordTo());
        composition.put("rowCount", rowCount);
        composition.put("stagingFirstId", boundary.firstId());
        composition.put("stagingLastId", boundary.lastId());
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                context.processExecutionId() == null ? null : "exec-" + context.processExecutionId(),
                reference,
                AuditLevel.RECORD,
                "RECORD_BUILT",
                "BUILT",
                context.processExecutionId(),
                context.taskDefinitionId(),
                null,
                jsonConfigurationMapper.toJson(composition),
                Map.of(),
                "SWIFT",
                "MT101",
                null,
                boundary.sourceFileHash(),
                boundary.sourceRecordFrom(),
                null,
                null,
                reference,
                null,
                null,
                null,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }

    private void emitRecordAudit(List<AuditEnvelope> envelopes) {
        if (recordAuditEmitter != null && !envelopes.isEmpty()) {
            recordAuditEmitter.emitRecords(envelopes);
        }
    }

    @Override
    public String type() {
        return "MT101_BUILD_FROM_TABLE";
    }

    @Override
    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var source = resolveSource(context, configuration);
        var maxTransactions = intValue(configuration.get("maxTransactionsPerMessage"), DEFAULT_MAX_TRANSACTIONS);
        var maxBytes = intValue(configuration.get("maxBytesPerMessage"), DEFAULT_MAX_BYTES);
        if (maxTransactions < 1) {
            throw new IllegalArgumentException("MT101_BUILD_FROM_TABLE maxTransactionsPerMessage must be >= 1");
        }
        if (maxBytes < 1) {
            throw new IllegalArgumentException("MT101_BUILD_FROM_TABLE maxBytesPerMessage must be >= 1");
        }

        var totalRows = countRows(source);
        if (totalRows == 0) {
            return TaskResult.success("MT101_BUILD_FROM_TABLE skipped because source table has no rows");
        }

        var fragmentSetId = resolveFragmentSetId(context, configuration);
        if (boolValue(configuration.get("replaceExisting"), true)) {
            fragmentStore.replaceFragmentSet(source.connectionRef(), fragmentSetId);
        }

        // Fase 1: planificar limites de fragmento por bytes reales (keyset scan).
        // Una sola conexion para todo el scan: con 1M filas son ~10k paginas y
        // abrir conexion por pagina seria churn puro.
        var plan = new ArrayList<FragmentPlan>();
        try (var scanConnection = source.dataSource().getConnection()) {
            var lastId = 0L;
            var logicalOffset = 0L;
            while (true) {
                var rows = readRowsAfter(scanConnection, source, lastId, maxTransactions);
                if (rows.isEmpty()) {
                    break;
                }
                lastId = rows.get(rows.size() - 1).id();
                planChunk(context, configuration, rows, maxBytes, logicalOffset, plan);
                logicalOffset += rows.size();
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot scan MT101 source rows from " + source.table(), error);
        }
        if (plan.isEmpty()) {
            return TaskResult.success("MT101_BUILD_FROM_TABLE skipped because source table has no rows");
        }

        // Fail-fast: :28D: (message index/total) es 5n, max 99999. Un set mas
        // grande generaria fragmentos con total invalido. Mejor detenerlo aqui
        // con instruccion accionable que dejar que MT101_VALIDATE lo marque
        // fragmento por fragmento despues de materializar 100k+ filas.
        guardFragmentCount(plan.size());

        validateReferenceTemplate(configuration, plan.size());

        // Fase 2: materializar cada fragmento con :28D: index/total definitivo.
        // Lecturas con una conexion compartida; inserts buffered en lotes via
        // insertFragments (addBatch) para reducir round-trips ~100x.
        var totalFragments = plan.size();
        var totalBytes = 0L;
        var insertBuffer = new ArrayList<Mt101FragmentStore.FragmentInsert>(INSERT_BATCH_SIZE);
        var auditBuffer = new ArrayList<AuditEnvelope>(INSERT_BATCH_SIZE);
        try (var readConnection = source.dataSource().getConnection()) {
            for (int index = 1; index <= totalFragments; index++) {
                var boundary = plan.get(index - 1);
                var rows = readRowsBetween(readConnection, source, boundary.firstId(), boundary.lastId());
                var message = buildFragment(context, configuration, rows, index, totalFragments, boundary.logicalOffset());
                var payloadBytes = payloadBytes(message);
                if (payloadBytes > maxBytes) {
                    // No deberia ocurrir: la medicion de fase 1 usa el total mas ancho posible.
                    throw new IllegalStateException("MT101 fragment " + index + " exceeds maxBytesPerMessage="
                            + maxBytes + " with " + payloadBytes + " bytes after final build");
                }
                totalBytes += payloadBytes;
                // Mapeo :21: -> fila del archivo (1-based) por fragmento: rows[i] arma
                // transaction[i], asi cada referencia de transaccion conoce su fila exacta
                // para la cuarentena. Sin fallback: 1 fila staging = 1 transaccion.
                var transactions = message.transactions();
                if (transactions.size() != rows.size()) {
                    throw new IllegalStateException("MT101 fragment " + index + " produced "
                            + transactions.size() + " transactions from " + rows.size()
                            + " source rows; cannot map :21: to the exact file row");
                }
                var sourceRecords = new LinkedHashMap<String, Long>();
                for (int i = 0; i < rows.size(); i++) {
                    sourceRecords.put(transactions.get(i).transactionReference(), sourceRecordNumber(rows.get(i)));
                }
                insertBuffer.add(new Mt101FragmentStore.FragmentInsert(
                        fragmentSetId,
                        context.processExecutionId(),
                        context.taskDefinitionId(),
                        source.table(),
                        boundary.firstId(),
                        boundary.lastId(),
                        boundary.sourceRecordFrom(),
                        boundary.sourceRecordTo(),
                        boundary.sourceFileHash(),
                        sourceRecords,
                        index,
                        totalFragments,
                        message));
                auditBuffer.add(recordEnvelope(context,
                        message.sequenceA() == null ? null : message.sequenceA().sendersReference(),
                        boundary, rows.size()));
                if (insertBuffer.size() >= INSERT_BATCH_SIZE) {
                    fragmentStore.insertFragments(source.connectionRef(), new ArrayList<>(insertBuffer));
                    insertBuffer.clear();
                    emitRecordAudit(auditBuffer);
                    auditBuffer.clear();
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot materialize MT101 fragments from " + source.table(), error);
        }
        fragmentStore.insertFragments(source.connectionRef(), insertBuffer);
        emitRecordAudit(auditBuffer);

        var fragments = fragmentStore.source(source.connectionRef(), fragmentSetId, totalFragments);
        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("fragmentSetId", fragmentSetId);
        outputs.put("fragmentCount", totalFragments);
        outputs.put("transactionCount", totalRows);
        outputs.put("totalBytes", totalBytes);
        outputs.put("format", stringValue(configuration.get("format"), "JSON").toUpperCase());
        outputs.put("fragments", fragments);

        return TaskResult.success("MT101_BUILD_FROM_TABLE built " + totalFragments
                + " fragments for " + totalRows + " rows", outputs);
    }

    /**
     * Empaqueta un chunk de filas en uno o mas limites de fragmento. Si el payload
     * construido excede {@code maxBytes}, bisecta recursivamente. Un solo registro
     * que exceda el limite es un error de datos (transaccion imposible de enviar).
     */
    private void planChunk(TaskContext context,
                           Map<String, Object> configuration,
                           List<RowRecord> rows,
                           int maxBytes,
                           long logicalOffset,
                           List<FragmentPlan> plan) {
        var provisionalIndex = plan.size() + 1;
        var message = buildFragment(context, configuration, rows, provisionalIndex, MEASUREMENT_TOTAL, logicalOffset);
        var payloadBytes = payloadBytes(message);
        if (payloadBytes <= maxBytes) {
            plan.add(new FragmentPlan(
                    rows.get(0).id(),
                    rows.get(rows.size() - 1).id(),
                    sourceRecordNumber(rows.get(0)),
                    sourceRecordNumber(rows.get(rows.size() - 1)),
                    rows.get(0).sourceFileHash(),
                    rows.size(),
                    logicalOffset));
            return;
        }
        if (rows.size() == 1) {
            throw new IllegalArgumentException("MT101_BUILD_FROM_TABLE: single transaction (staging id "
                    + rows.get(0).id() + ") produces a " + payloadBytes
                    + "-byte message exceeding maxBytesPerMessage=" + maxBytes
                    + "; the source row cannot be sent as MT101");
        }
        var mid = rows.size() / 2;
        planChunk(context, configuration, rows.subList(0, mid), maxBytes, logicalOffset, plan);
        planChunk(context, configuration, rows.subList(mid, rows.size()), maxBytes, logicalOffset + mid, plan);
    }

    /**
     * Numero de fila <b>1-based</b> visible al operador, derivado del {@code record_index}
     * real persistido en staging (robusto aunque los ids no sean contiguos). Sin
     * fallback: si la fila no trae {@code record_index} es un error de integridad, no
     * se inventa un numero de fila a partir del offset logico.
     */
    private long sourceRecordNumber(RowRecord row) {
        if (row.recordIndex() == null) {
            throw new IllegalStateException("MT101_BUILD_FROM_TABLE requires staging_record.record_index "
                    + "to trace the source row; staging id " + row.id() + " has a null record_index");
        }
        return row.recordIndex() + 1;
    }

    private com.integrationhub.platform.spi.task.payments.Mt101Message buildFragment(
            TaskContext context,
            Map<String, Object> configuration,
            List<RowRecord> rows,
            int messageIndex,
            int messageTotal,
            long logicalOffset) {
        var records = new ArrayList<ReadRecord>(rows.size());
        for (var row : rows) {
            records.add(row.record());
        }
        var fragmentContext = fragmentContext(context, messageIndex, messageTotal, logicalOffset);
        var result = buildTaskProvider.executeRecords(fragmentContext, configuration, records, null);
        if (!result.success()) {
            throw new IllegalStateException("MT101_BUILD_FROM_TABLE fragment " + messageIndex
                    + " build failed: " + result.details());
        }
        var messages = messagesFromBuild(result);
        if (messages.size() != 1) {
            throw new IllegalStateException("MT101_BUILD_FROM_TABLE expects one MT101 message per fragment");
        }
        return messages.getFirst();
    }

    private int payloadBytes(com.integrationhub.platform.spi.task.payments.Mt101Message message) {
        return message.rawPayload() == null ? 0
                : message.rawPayload().getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
    }

    /**
     * Gate config-time: con mas de un fragmento, {@code :20:} debe variar por
     * fragmento o el indice unico {@code (fragment_set_id, senders_reference)}
     * fallaria en runtime con un error SQL criptico. Mejor fallar aqui con
     * instruccion accionable.
     */
    /** Detiene la construccion si el set excede el limite 5n de {@code :28D:}. */
    void guardFragmentCount(int totalFragments) {
        if (totalFragments > MAX_FRAGMENTS_PER_SET) {
            throw new IllegalArgumentException("MT101_BUILD_FROM_TABLE would produce " + totalFragments
                    + " fragments, exceeding the :28D: limit of " + MAX_FRAGMENTS_PER_SET
                    + " messages per set. Increase maxTransactionsPerMessage or split the source "
                    + "into multiple fragment sets (e.g. partition the staging rows by batch).");
        }
    }

    private void validateReferenceTemplate(Map<String, Object> configuration, int totalFragments) {
        if (totalFragments <= 1) {
            return;
        }
        var sequenceA = mapValue(configuration.get("sequenceA"));
        var template = stringValue(sequenceA.get("sendersReferenceTemplate"), "");
        if (template.isBlank() || !template.contains("${messageIndex}")) {
            throw new IllegalArgumentException("MT101_BUILD_FROM_TABLE produced " + totalFragments
                    + " fragments but sequenceA.sendersReferenceTemplate "
                    + (template.isBlank() ? "is not set" : "('" + template + "') does not contain ${messageIndex}")
                    + "; every fragment would share the same :20: senders reference. "
                    + "Use a template like 'P${messageIndex}' to keep references unique per fragment.");
        }
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

        var connectionRef = firstNonBlank(
                input.get("connectionRef"),
                sourceCfg.get("connectionRef"),
                sourceTaskRef.isBlank() ? null : taskOutputs.get(sourceTaskRef + ".table.connectionRef"),
                configuration.get("connectionRef"));

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
                taskDefinitionId,
                recordIndexFilter(sourceCfg.get("recordIndexIn")));
    }

    /**
     * Filtro opcional {@code source.recordIndexIn}: limita la construccion a esas
     * filas de staging (rebuild selectivo desde cuarentena). Vacio = todas las filas.
     */
    private List<Long> recordIndexFilter(Object raw) {
        if (!(raw instanceof List<?> rawList) || rawList.isEmpty()) {
            return List.of();
        }
        var result = new ArrayList<Long>(rawList.size());
        for (var item : rawList) {
            if (item != null && !String.valueOf(item).isBlank()) {
                result.add(Long.parseLong(String.valueOf(item).trim()));
            }
        }
        return result;
    }

    private long countRows(SourceTable source) {
        try {
            return stagingRepository.countRows(source.dataSource(), sourceQuery(source));
        } catch (SQLException error) {
            throw new IllegalStateException("Cannot count MT101 source rows from " + source.table(), error);
        }
    }

    /**
     * Pagina por keyset ({@code id > lastId}): costo estable por pagina aunque el
     * archivo tenga 1M filas, a diferencia de {@code LIMIT/OFFSET} que degrada
     * O(offset) por pagina. Requiere {@code ix_staging_record_execution_task_id}
     * (V15) para staging_record.
     */
    private List<RowRecord> readRowsAfter(Connection connection, SourceTable source, long afterId, int limit) throws SQLException {
        return rowsFromJson(stagingRepository.readRowsAfter(connection, sourceQuery(source), afterId, limit));
    }

    /** Relee el rango exacto de un limite planificado en fase 1 (ids inclusivos). */
    private List<RowRecord> readRowsBetween(Connection connection, SourceTable source, long firstId, long lastId) throws SQLException {
        return rowsFromJson(stagingRepository.readRowsBetween(connection, sourceQuery(source), firstId, lastId));
    }

    private List<RowRecord> rowsFromJson(List<Mt101StagingRecordRepository.RowJson> sourceRows) {
        var rows = new ArrayList<RowRecord>(sourceRows.size());
        for (var row : sourceRows) {
            rows.add(new RowRecord(row.id(), row.recordIndex(), row.sourceFileHash(),
                    new ReadRecord(jsonConfigurationMapper.toMap(row.payloadJson()))));
        }
        return rows;
    }

    private Mt101StagingRecordRepository.SourceQuery sourceQuery(SourceTable source) {
        // Sin fallback: MT101_BUILD_FROM_TABLE exige las columnas de trazabilidad de
        // fila (record_index + source_file_hash, V1/V31). La tabla origen debe tener
        // forma staging_record para que cada fragmento conserve la fila exacta del
        // archivo; no se degrada al offset logico.
        return new Mt101StagingRecordRepository.SourceQuery(
                source.table(),
                source.payloadColumn(),
                source.idColumn(),
                source.processExecutionId(),
                source.taskDefinitionId(),
                "record_index",
                "source_file_hash",
                source.recordIndexIn());
    }

    @SuppressWarnings("unchecked")
    private List<com.integrationhub.platform.spi.task.payments.Mt101Message> messagesFromBuild(TaskResult result) {
        var raw = result.outputs().get("records");
        if (!(raw instanceof List<?> rawList)) {
            return List.of();
        }
        return (List<com.integrationhub.platform.spi.task.payments.Mt101Message>) rawList;
    }

    private TaskContext fragmentContext(TaskContext original, int messageIndex, int messageTotal, long offset) {
        var context = new TaskContext(original.processExecutionId(), original.taskDefinitionId());
        context.attributes().putAll(original.attributes());
        context.attributes().put("mt101MessageIndex", messageIndex);
        context.attributes().put("mt101MessageTotal", messageTotal);
        context.attributes().put("mt101RecordOffset", offset);
        return context;
    }

    private String resolveFragmentSetId(TaskContext context, Map<String, Object> configuration) {
        var template = stringValue(configuration.get("fragmentSetIdTemplate"), "MT101-${_processExecutionId}-${_taskDefinitionId}");
        var resolved = template
                .replace("${_processExecutionId}", String.valueOf(context.processExecutionId()))
                .replace("${_taskDefinitionId}", String.valueOf(context.taskDefinitionId()));
        if (resolved.length() > 80) {
            throw new IllegalArgumentException("MT101_BUILD_FROM_TABLE fragmentSetId exceeds 80 characters: " + resolved);
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
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private String firstNonBlank(Object... values) {
        for (var value : values) {
            var normalized = stringValue(value, "");
            if (!normalized.isBlank()) {
                return normalized;
            }
        }
        return "";
    }

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw));
    }

    private Long longValue(Object raw) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return null;
        }
        return Long.parseLong(String.valueOf(raw));
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    private record SourceTable(
            DataSource dataSource,
            String connectionRef,
            String table,
            String payloadColumn,
            String idColumn,
            Long processExecutionId,
            Long taskDefinitionId,
            List<Long> recordIndexIn
    ) {
    }

    /**
     * Fila staging: id (cursor keyset) + record_index (fila 0-based del archivo,
     * nullable para tablas arbitrarias) + hash del archivo + payload ya parseado.
     */
    private record RowRecord(long id, Long recordIndex, String sourceFileHash, ReadRecord record) {
    }

    /**
     * Limite de fragmento planificado en fase 1: rango de ids staging (clave tecnica,
     * inclusivo), rango de fila del archivo <b>1-based</b> (clave de soporte/UI),
     * hash del archivo origen, cantidad de transacciones y offset logico acumulado
     * (continuidad de {@code ${recordNumber}} entre fragmentos).
     */
    private record FragmentPlan(long firstId, long lastId,
                                long sourceRecordFrom, long sourceRecordTo, String sourceFileHash,
                                int txCount, long logicalOffset) {
    }
}
