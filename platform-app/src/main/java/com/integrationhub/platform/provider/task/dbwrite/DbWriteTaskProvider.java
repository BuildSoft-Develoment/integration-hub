package com.integrationhub.platform.provider.task.dbwrite;

// @trace RF-002 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.audit.AuditEnvelope;
import com.integrationhub.platform.audit.AuditLevel;
import com.integrationhub.platform.provider.task.common.StoredProcedureRuntimeSupport;
import com.integrationhub.platform.provider.task.common.TaskOutputSupport;
import com.integrationhub.platform.repository.DbWriteRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.execution.RecordAuditEmitter;
import com.integrationhub.platform.service.source.SourceFingerprintService;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class DbWriteTaskProvider implements BatchTaskProvider {

    private static final String STAGING_TABLE = "staging_record";

    private final DataSource dataSource;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final ConnectionPoolManager connectionPoolManager;
    private final RecordAuditEmitter recordAuditEmitter;
    private final DbWriteRepository dbWriteRepository;
    private final SourceFingerprintService sourceFingerprintService;

    @Inject
    public DbWriteTaskProvider(DataSource dataSource,
                               JsonConfigurationMapper jsonConfigurationMapper,
                               ConnectionPoolManager connectionPoolManager,
                               RecordAuditEmitter recordAuditEmitter,
                               DbWriteRepository dbWriteRepository,
                               SourceFingerprintService sourceFingerprintService) {
        this.dataSource = dataSource;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.connectionPoolManager = connectionPoolManager;
        this.recordAuditEmitter = recordAuditEmitter;
        this.dbWriteRepository = dbWriteRepository;
        this.sourceFingerprintService = sourceFingerprintService;
    }

    public DbWriteTaskProvider(DataSource dataSource,
                               JsonConfigurationMapper jsonConfigurationMapper,
                               ConnectionPoolManager connectionPoolManager,
                               RecordAuditEmitter recordAuditEmitter,
                               DbWriteRepository dbWriteRepository) {
        this(dataSource, jsonConfigurationMapper, connectionPoolManager, recordAuditEmitter,
                dbWriteRepository, new SourceFingerprintService());
    }

    public DbWriteTaskProvider(DataSource dataSource,
                               JsonConfigurationMapper jsonConfigurationMapper,
                               ConnectionPoolManager connectionPoolManager,
                               RecordAuditEmitter recordAuditEmitter) {
        this(dataSource, jsonConfigurationMapper, connectionPoolManager, recordAuditEmitter, new DbWriteRepository());
    }

    public DbWriteTaskProvider(DataSource dataSource,
                               JsonConfigurationMapper jsonConfigurationMapper,
                               ConnectionPoolManager connectionPoolManager) {
        this(dataSource, jsonConfigurationMapper, connectionPoolManager, null, new DbWriteRepository());
    }

    @Override
    public String type() {
        return "DB_WRITE";
    }

    @Override
    public TaskResult executeRecords(TaskContext context,
                                     Map<String, Object> configuration,
                                     List<ReadRecord> records,
                                     SourcePayload sourcePayload) {
        if (records == null || records.isEmpty()) {
            return TaskResult.success("DB write skipped because there are no parsed records");
        }

        var targetTable = DbTaskSupport.requireQualifiedIdentifier(configuration, "targetTable");
        var mode = DbTaskSupport.mode(configuration);
        var effectiveRecords = enrichRecordsWithRuntime(context, records, sourcePayload);

        if (STAGING_TABLE.equalsIgnoreCase(targetTable)) {
            if (!isInsertLike(mode)) {
                throw new IllegalArgumentException("staging_record only supports insert-like DB_WRITE modes");
            }
            var inserted = insertIntoStaging(resolveDataSource(configuration), context, sourcePayload, effectiveRecords, DbTaskSupport.jdbcBatchSize(configuration));
            return TaskResult.success(
                    "Inserted " + inserted + " records into staging_record using mode " + mode,
                    successOutputs(mode, STAGING_TABLE, effectiveRecords.size(), inserted)
            );
        }

        var targetDataSource = resolveDataSource(configuration);
        var assignments = DbTaskSupport.assignments(configuration, effectiveRecords);
        if (assignments.isEmpty()) {
            throw new IllegalArgumentException("DB_WRITE requires columnMappings, columnFunctions or readable record fields");
        }

        var keyColumns = DbTaskSupport.keyColumns(configuration);
        var batchSize = DbTaskSupport.jdbcBatchSize(configuration);
        var affected = switch (mode) {
            case "insert", "jdbc-batch" ->
                    dbWriteRepository.insertDynamic(targetDataSource, targetTable, effectiveRecords, assignments, batchSize);
            case "update", "batch-update" ->
                    dbWriteRepository.updateDynamic(targetDataSource, targetTable, effectiveRecords, assignments, keyColumns, batchSize);
            case "upsert" ->
                    dbWriteRepository.upsertDynamic(targetDataSource, targetTable, effectiveRecords, assignments, keyColumns, batchSize);
            default -> throw new IllegalArgumentException("Unsupported DB_WRITE mode: " + mode);
        };
        return TaskResult.success(
                "DB write completed on " + targetTable + " affecting " + affected + " records using mode " + mode,
                successOutputs(mode, targetTable, effectiveRecords.size(), affected)
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
            var values = new java.util.LinkedHashMap<String, Object>();
            if (record != null && record.values() != null) {
                values.putAll(record.values());
            }
            runtimeValues.forEach(values::putIfAbsent);
            taskOutputs.forEach(values::putIfAbsent);
            return new ReadRecord(values);
        }).toList();
    }
    private DataSource resolveDataSource(Map<String, Object> configuration) {
        return DbTaskSupport.connectionRef(configuration)
                .map(connectionPoolManager::resolveJdbcDataSource)
                .orElse(dataSource);
    }

    private boolean isInsertLike(String mode) {
        return "insert".equals(mode) || "jdbc-batch".equals(mode);
    }

    private Map<String, Object> successOutputs(String mode, String targetTable, int processedCount, int writtenCount) {
        return Map.of(
                "mode", mode,
                "targetTable", targetTable,
                "processedCount", processedCount,
                "writtenCount", writtenCount
        );
    }

    private int insertIntoStaging(DataSource targetDataSource,
                                  TaskContext context,
                                  SourcePayload sourcePayload,
                                  List<ReadRecord> records,
                                  int batchSize) {
        // El provider resuelve indice global + payload + auditoria (su responsabilidad);
        // el JDBC batcheado vive en DbWriteRepository. record_index global por ejecucion
        // (no por batch): el motor invoca este metodo una vez por cada batch del fast-path,
        // asi que un indice local repetiria 0..N-1 y la auditoria perderia la posicion real.
        var globalIndex = stagingIndexCounter(context);
        var sourceName = sourcePayload != null ? sourcePayload.name() : null;
        var sourceFileHash = sourceFileHash(context, sourcePayload);
        var rows = new ArrayList<DbWriteRepository.StagingRow>(records.size());
        var audit = new ArrayList<AuditEnvelope>(records.size());
        for (var record : records) {
            var index = globalIndex.getAndIncrement();
            rows.add(new DbWriteRepository.StagingRow(
                    context.processExecutionId(),
                    context.taskDefinitionId(),
                    sourceName,
                    sourceFileHash,
                    index,
                    jsonConfigurationMapper.toJson(record.values())));
            // INGESTED: primer punto donde una fila origen (xls/csv/txt/...) se vuelve trazable.
            audit.add(ingestedEnvelope(context, sourceName, sourceFileHash, index));
        }
        var written = dbWriteRepository.insertStagingBatch(targetDataSource, rows, batchSize);
        emitRecordAudit(audit);
        return written;
    }

    /**
     * Emite el evento INGESTED con la identidad estable de fila: numero de fila
     * <b>1-based</b> (el operador busca "fila 1" = primera fila de datos, no fila 0)
     * y hash del archivo origen para ubicar el archivo exacto. El {@code record_index}
     * interno sigue siendo 0-based; aqui se convierte solo para presentacion.
     */
    private AuditEnvelope ingestedEnvelope(TaskContext context, String sourceName, String sourceFileHash, long index) {
        var recordNumber = index + 1;
        var recordId = (sourceName == null ? "" : sourceName + ":") + recordNumber;
        return new AuditEnvelope(
                UUID.randomUUID().toString(),
                context.processExecutionId() == null ? null : "exec-" + context.processExecutionId(),
                recordId,
                AuditLevel.RECORD,
                "RECORD_INGESTED",
                "INGESTED",
                context.processExecutionId(),
                context.taskDefinitionId(),
                sourceName,
                null,
                Map.of(),
                null,
                null,
                sourceName,
                sourceFileHash,
                recordNumber,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                Instant.now(),
                AuditEnvelope.CURRENT_SCHEMA_VERSION);
    }

    /**
     * Hash del archivo origen calculado una sola vez por fuente y cacheado en el
     * {@code TaskContext}: el fast-path invoca este task una vez por batch, asi que
     * sin cache se releeria el archivo en cada batch. El streaming del hash es O(bytes)
     * pero solo se paga una vez por archivo (csv/txt/excel/fin/...).
     */
    private String sourceFileHash(TaskContext context, SourcePayload sourcePayload) {
        // Sin archivo origen no hay hash que computar (DB_WRITE a staging desde una
        // fuente que no es un archivo); con archivo, el hash es obligatorio y se
        // computa una sola vez por fuente.
        if (sourcePayload == null) {
            return null;
        }
        // Clave por location+size+lastModified (no solo name): dos archivos con el
        // mismo nombre desde rutas distintas no comparten cache ni hash.
        var file = sourcePayload.file();
        var cacheKey = "_sourceFileHash:" + sourcePayload.location()
                + ":" + (file == null ? "" : file.size())
                + ":" + (file == null || file.lastModified() == null ? "" : file.lastModified());
        synchronized (context.attributes()) {
            var cached = context.attributes().get(cacheKey);
            if (cached instanceof String hash) {
                return hash;
            }
            var hash = sourceFingerprintService.fileHash(sourcePayload);
            context.attributes().put(cacheKey, hash);
            return hash;
        }
    }

    private void emitRecordAudit(List<AuditEnvelope> envelopes) {
        if (recordAuditEmitter != null && !envelopes.isEmpty()) {
            recordAuditEmitter.emitRecords(envelopes);
        }
    }

    /**
     * Contador compartido en el TaskContext: el fast-path reusa el mismo contexto
     * para todos los batches (y archivos en paralelo) del sink, asi que el
     * AtomicLong da continuidad y es thread-safe entre workers.
     */
    private java.util.concurrent.atomic.AtomicLong stagingIndexCounter(TaskContext context) {
        synchronized (context.attributes()) {
            return (java.util.concurrent.atomic.AtomicLong) context.attributes()
                    .computeIfAbsent("_stagingRecordIndex",
                            key -> new java.util.concurrent.atomic.AtomicLong(0));
        }
    }
}
