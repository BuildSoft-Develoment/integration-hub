package com.integrationhub.platform.provider.task.filewrite;

// @trace ADR-016 (salida generica: tarea FILE_WRITE - serializa registros/tabla a un archivo)

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.repository.TaskInputRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.task.artifact.ArtifactStoreRegistry;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.service.execution.TaskInputResolver;
import com.integrationhub.platform.service.task.writer.FileFormatWriterRegistry;
import com.integrationhub.platform.spi.task.artifact.StoredArtifact;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.spi.task.writer.FileFormatWriter;
import com.integrationhub.platform.spi.task.writer.FileWriteSession;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ADR-016: tarea {@code FILE_WRITE}. Serializa los registros de una tarea previa a un archivo (via {@link FileFormatWriter})
 * y lo materializa en el {@link com.integrationhub.platform.spi.task.artifact.ArtifactStore} (temp local en sync). Publica en
 * {@code summary} la referencia del archivo ({@code archivePath}/{@code archiveSize}/{@code recordCount}) y {@code files}
 * (lista de rutas, para que {@code FILE_COMPRESS}/{@code FILE_DELIVER} lo consuman).
 *
 * <p>Dos fuentes (contrato ADR-004):</p>
 * <ul>
 *   <li><b>records</b> (volumenes chicos): lee la lista de {@code taskOutputs} y agrega en memoria.</li>
 *   <li><b>table</b> (&gt;1M): pagina keyset por {@code cursor.orderBy} (memoria = una pagina), opcionalmente parsea
 *       una columna JSON ({@code payloadColumn}, p. ej. {@code payload_json} de staging_record). Cabecera con
 *       {@code count} por pre-query; trailer ({@code count}/{@code sum}) acumulado durante el streaming.</li>
 * </ul>
 *
 * <p>Un unico archivo ordenado (escritor secuencial). {@code asyncOffloadSupport} default = {@code UNSUPPORTED}.</p>
 */
@ApplicationScoped
public class FileWriteTaskProvider implements TaskProvider {

    private static final int DEFAULT_BATCH_SIZE = 5000;
    // Tope de pagina: acota memoria (una pagina en heap) aunque la config pida un batchSize desmesurado.
    private static final int MAX_BATCH_SIZE = 50_000;
    private static final String DEFAULT_TABLE = "staging_record";

    private final FileFormatWriterRegistry writers;
    private final ArtifactStoreRegistry artifactStores;
    private final TaskInputRepository taskInputRepository;
    private final ConnectionPoolManager connectionPoolManager;
    private final DataSource defaultDataSource;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    // Evaluador de expresiones por columna de detalle (ADR-004). Stateless (engine + cache estaticos); se instancia
    // aqui para no tocar los constructores de test ni el grafo CDI.
    private final FileWriteExpressionEvaluator expressions = new FileWriteExpressionEvaluator();

    @Inject
    public FileWriteTaskProvider(FileFormatWriterRegistry writers,
                                 ArtifactStoreRegistry artifactStores,
                                 TaskInputRepository taskInputRepository,
                                 ConnectionPoolManager connectionPoolManager,
                                 DataSource defaultDataSource,
                                 JsonConfigurationMapper jsonConfigurationMapper) {
        this.writers = writers;
        this.artifactStores = artifactStores;
        this.taskInputRepository = taskInputRepository;
        this.connectionPoolManager = connectionPoolManager;
        this.defaultDataSource = defaultDataSource;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    /** Constructor de test para el camino de records (sin DB). */
    public FileWriteTaskProvider(FileFormatWriterRegistry writers, ArtifactStoreRegistry artifactStores) {
        this(writers, artifactStores, null, null, null, null);
    }

    /** Constructor de test para el camino de tabla (repo/DataSource/mapper mockeados; sin ConnectionPoolManager). */
    public FileWriteTaskProvider(FileFormatWriterRegistry writers,
                                 ArtifactStoreRegistry artifactStores,
                                 TaskInputRepository taskInputRepository,
                                 DataSource defaultDataSource,
                                 JsonConfigurationMapper jsonConfigurationMapper) {
        this(writers, artifactStores, taskInputRepository, null, defaultDataSource, jsonConfigurationMapper);
    }

    @Override
    public String type() {
        return "FILE_WRITE";
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var format = stringValue(configuration.get("format"), "CSV");
        var writer = writers.resolve(format);
        writer.validateConfiguration(configuration);

        var layout = mapValue(configuration.get("layout"));
        var input = mapValue(configuration.get("input"));
        var sourceOutput = stringValue(input.get("sourceOutput"), "records");
        var tableMode = "table".equalsIgnoreCase(sourceOutput) || "targetTable".equalsIgnoreCase(sourceOutput);

        var archiveName = resolveArchiveName(context, configuration, format);
        var store = artifactStores.forExecution(boolValue(configuration.get("async"), false));

        long recordCount;
        StoredArtifact stored;
        try (var artifact = store.create(archiveName)) {
            try (FileWriteSession session = writer.open(artifact.outputStream(), configuration)) {
                recordCount = tableMode
                        ? writeFromTable(context, configuration, input, layout, session)
                        : writeFromRecords(context, input, sourceOutput, layout, session);
            }
            stored = artifact.finish();
        } catch (IOException error) {
            throw new IllegalStateException("FILE_WRITE could not write archive " + archiveName, error);
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("archivePath", stored.location());
        outputs.put("archiveName", stored.name());
        outputs.put("archiveSize", stored.size());
        outputs.put("store", stored.store());
        outputs.put("recordCount", recordCount);
        outputs.put("files", List.of(fileRef(stored)));
        return TaskResult.success("FILE_WRITE wrote " + recordCount + " records to " + stored.name(), outputs);
    }

    // --- fuente records (en memoria) ---

    private long writeFromRecords(TaskContext context, Map<String, Object> input, String sourceOutput,
                                  Map<String, Object> layout, FileWriteSession session) throws IOException {
        var sourceTaskRef = stringValue(input.get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("FILE_WRITE requires input.sourceTaskRef");
        }
        var metadata = metadataVars(context);
        var records = project(toRecords(taskOutputs(context).get(sourceTaskRef + "." + sourceOutput)),
                expressionColumns(layout), metadataColumns(layout, metadata), metadata);
        var aggregates = computeAggregates(records, layout);
        writeHeaderIfPresent(session, layout, context, aggregates);
        session.writeDetail(records);
        writeTrailerIfPresent(session, layout, context, aggregates);
        return records.size();
    }

    // --- fuente tabla (keyset paging, >1M) ---

    private long writeFromTable(TaskContext context, Map<String, Object> configuration, Map<String, Object> input,
                                Map<String, Object> layout, FileWriteSession session) throws IOException {
        var taskOutputs = taskOutputs(context);
        var sourceTaskRef = stringValue(input.get("sourceTaskRef"), "");
        var source = mapValue(configuration.get("source"));

        var table = firstNonBlank(input.get("table"), source.get("table"),
                sourceTaskRef.isBlank() ? null : taskOutputs.get(sourceTaskRef + ".table"), DEFAULT_TABLE);
        var connectionRef = firstNonBlank(input.get("connectionRef"), source.get("connectionRef"),
                sourceTaskRef.isBlank() ? null : taskOutputs.get(sourceTaskRef + ".table.connectionRef"),
                configuration.get("connectionRef"));
        var orderBy = stringValue(mapValue(input.get("cursor")).get("orderBy"), stringValue(source.get("idColumn"), ""));
        if (orderBy.isBlank()) {
            throw new IllegalArgumentException("FILE_WRITE table source requires input.cursor.orderBy (keyset pagination)");
        }
        var payloadColumn = stringValue(firstNonBlank(input.get("payloadColumn"), source.get("payloadColumn")), "");
        var batchSize = Math.min(Math.max(intValue(input.get("batchSize"), DEFAULT_BATCH_SIZE), 1), MAX_BATCH_SIZE);
        var filters = resolveFilters(input.get("filters"), context);
        var target = resolveTarget(connectionRef);
        var dataSource = target.dataSource();

        // Cabecera: sum sobre tabla no se soporta (requeriria SQL/JSON por dialecto); usar el trailer. count via pre-query.
        guardNoTableHeaderSum(layout);
        var headerCount = headerNeedsCount(layout) ? taskInputRepository.count(dataSource, table, filters) : 0L;
        writeHeaderIfPresent(session, layout, context, new Aggregates(headerCount, Map.of()));

        var exprCols = expressionColumns(layout);
        var metadata = metadataVars(context);
        var metaFields = metadataColumns(layout, metadata);
        var sums = initialSums(layout);
        Object lastKey = null;
        long total = 0;
        while (true) {
            var rawPage = taskInputRepository.readBatch(dataSource, target.connectionType(), table, orderBy,
                    filters, lastKey, batchSize);
            if (rawPage.isEmpty()) {
                break;
            }
            var nextKey = TaskInputResolver.cursorValue(rawPage, orderBy);
            if (nextKey == null) {
                // Cursor nulo -> el siguiente readBatch re-leeria la primera pagina (bucle infinito). Fail-loud.
                throw new IllegalStateException("FILE_WRITE table source: cursor column '" + orderBy
                        + "' produced a null value; keyset pagination requires a non-null, unique ordering column (e.g. the PK)");
            }
            lastKey = nextKey;
            // El cursor keyset usa la columna cruda 'orderBy'; se toma el nextKey de rawPage ANTES de proyectar
            // (la proyeccion puede reescribir/omitir esa columna). Recien despues se computa la pagina de detalle.
            var detailPage = project(payloadColumn.isBlank() ? rawPage : parsePayloadColumn(rawPage, payloadColumn),
                    exprCols, metaFields, metadata);
            session.writeDetail(detailPage);
            accumulateSums(detailPage, sums);
            total += detailPage.size();
            if (rawPage.size() < batchSize) {
                break;
            }
        }
        writeTrailerIfPresent(session, layout, context, new Aggregates(total, sums));
        return total;
    }

    private List<ReadRecord> parsePayloadColumn(List<ReadRecord> rawPage, String payloadColumn) {
        var parsed = new ArrayList<ReadRecord>(rawPage.size());
        for (var row : rawPage) {
            var payload = row.value(payloadColumn);
            if (payload == null || String.valueOf(payload).isBlank()) {
                parsed.add(new ReadRecord(new LinkedHashMap<>()));
            } else {
                parsed.add(new ReadRecord(new LinkedHashMap<>(jsonConfigurationMapper.toMap(String.valueOf(payload)))));
            }
        }
        return parsed;
    }

    // --- expresiones por columna de detalle (ADR-004) ---

    /** Columna de detalle con expresion: {@code {field, expression}}. */
    private record ExprColumn(String field, String expression) {
    }

    @SuppressWarnings("unchecked")
    private List<ExprColumn> expressionColumns(Map<String, Object> layout) {
        var detail = mapValue(layout.get("detail"));
        if (!(detail.get("columns") instanceof List<?> list)) {
            return List.of();
        }
        var columns = new ArrayList<ExprColumn>();
        for (var raw : list) {
            if (raw instanceof Map<?, ?> map) {
                var column = (Map<String, Object>) map;
                var field = stringValue(column.get("field"), "");
                var expression = stringValue(column.get("expression"), "");
                if (!field.isBlank() && !expression.isBlank()) {
                    columns.add(new ExprColumn(field, expression));
                }
            }
        }
        return columns;
    }

    // Metadata transversal (ADR-004): el motor (ProcessTaskRuntimeService) publica el mapa COMPLETO en
    // attributes["metadata"] (_processExecutionId, _taskDefinitionId, _taskOrder, _taskType, _taskRef,
    // _executionMode, _triggerSource) -> se lee de ahi para paridad con DB_WRITE. Fallback a los getters del
    // TaskContext (p.ej. tests que lo construyen sin el mapa del motor). Los tokens de lote (_batch*) no aplican
    // a FILE_WRITE (once-task, no hay slices).
    @SuppressWarnings("unchecked")
    private Map<String, Object> metadataVars(TaskContext context) {
        if (context.attributes().get("metadata") instanceof Map<?, ?> raw) {
            var metadata = new LinkedHashMap<String, Object>();
            raw.forEach((key, value) -> metadata.put(String.valueOf(key), value));
            return metadata;
        }
        var metadata = new LinkedHashMap<String, Object>();
        if (context.processExecutionId() != null) {
            metadata.put("_processExecutionId", context.processExecutionId());
        }
        if (context.taskDefinitionId() != null) {
            metadata.put("_taskDefinitionId", context.taskDefinitionId());
        }
        return metadata;
    }

    /**
     * Columnas de detalle cuyo {@code field} es un token de metadata (p.ej. {@code _processExecutionId}) SIN expresion:
     * se resuelven al mismo valor de metadata en CADA fila (la expresion, si la hay, ya resuelve metadata por su cuenta).
     */
    @SuppressWarnings("unchecked")
    private List<String> metadataColumns(Map<String, Object> layout, Map<String, Object> metadata) {
        var detail = mapValue(layout.get("detail"));
        if (!(detail.get("columns") instanceof List<?> list)) {
            return List.of();
        }
        var fields = new ArrayList<String>();
        for (var raw : list) {
            if (raw instanceof Map<?, ?> map) {
                var column = (Map<String, Object>) map;
                var field = stringValue(column.get("field"), "");
                var expression = stringValue(column.get("expression"), "");
                if (expression.isBlank() && metadata.containsKey(field)) {
                    fields.add(field);
                }
            }
        }
        return fields;
    }

    /**
     * Proyecta cada registro: inyecta los tokens de metadata referenciados como columna ({@code metaFields}) y computa
     * las columnas con expresion ({@code out[col.field] = eval(col.expression, rec)}). Sin nada de eso es un no-op
     * (devuelve la lista tal cual -> el camino sin expresiones/metadata queda byte-identico). Cada expresion ve los
     * campos CRUDOS del registro (no las columnas ya computadas); se conservan los campos crudos (los usan otras
     * columnas por nombre y los agregados {@code sum}/{@code count}).
     */
    private List<ReadRecord> project(List<ReadRecord> records, List<ExprColumn> exprColumns, List<String> metaFields,
                                     Map<String, Object> metadata) {
        if (exprColumns.isEmpty() && metaFields.isEmpty()) {
            return records;
        }
        var projected = new ArrayList<ReadRecord>(records.size());
        for (var record : records) {
            var values = new LinkedHashMap<String, Object>(record.values());
            for (var metaField : metaFields) {
                values.put(metaField, metadata.getOrDefault(metaField, ""));
            }
            for (var column : exprColumns) {
                values.put(column.field(), expressions.evaluate(column.expression(), column.field(), record.values(), metadata));
            }
            projected.add(new ReadRecord(values));
        }
        return projected;
    }

    /**
     * ADR-022: el destino viaja junto con su motor, para que la paginacion se resuelva desde el tipo
     * declarado en la Conexion. Sin {@code connectionRef} se lee de la base interna de la plataforma,
     * que es PostgreSQL por diseno.
     */
    private ConnectionPoolManager.JdbcConnectionTarget resolveTarget(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return new ConnectionPoolManager.JdbcConnectionTarget(defaultDataSource, ConnectionType.POSTGRESQL);
        }
        return connectionPoolManager.resolveJdbcTarget(connectionRef);
    }

    private Map<String, Object> resolveFilters(Object raw, TaskContext context) {
        var filters = new LinkedHashMap<String, Object>();
        if (raw instanceof Map<?, ?> rawMap) {
            // Forma legacy: mapa {columna: valor}.
            rawMap.forEach((key, value) -> filters.put(String.valueOf(key), resolveFilterValue(value, context)));
        } else if (raw instanceof List<?> rawList) {
            // Forma actual del form: lista de filas {column, value}; se ignoran las filas sin columna (en edicion).
            for (var item : rawList) {
                if (item instanceof Map<?, ?> row) {
                    var column = row.get("column");
                    if (column != null && !String.valueOf(column).isBlank()) {
                        filters.put(String.valueOf(column), resolveFilterValue(row.get("value"), context));
                    }
                }
            }
        }
        return filters;
    }

    private Object resolveFilterValue(Object value, TaskContext context) {
        if ("${_processExecutionId}".equals(value)) {
            return context.processExecutionId();
        }
        if ("${_taskDefinitionId}".equals(value)) {
            return context.taskDefinitionId();
        }
        return value;
    }

    private void guardNoTableHeaderSum(Map<String, Object> layout) {
        for (var cell : cellList(layout.get("header"))) {
            if ("sum".equalsIgnoreCase(stringValue(cell.get("aggregate"), ""))) {
                throw new IllegalArgumentException("FILE_WRITE: aggregate 'sum' is not supported in the header for a "
                        + "table source; put the sum in the trailer (accumulated during streaming)");
            }
        }
    }

    private boolean headerNeedsCount(Map<String, Object> layout) {
        for (var cell : cellList(layout.get("header"))) {
            if ("count".equalsIgnoreCase(stringValue(cell.get("aggregate"), ""))) {
                return true;
            }
        }
        return false;
    }

    // --- salida comun ---

    private void writeHeaderIfPresent(FileWriteSession session, Map<String, Object> layout, TaskContext context,
                                      Aggregates aggregates) throws IOException {
        if (layout.containsKey("header")) {
            session.writeHeader(resolveCells(cellList(layout.get("header")), context, aggregates));
        }
    }

    private void writeTrailerIfPresent(FileWriteSession session, Map<String, Object> layout, TaskContext context,
                                       Aggregates aggregates) throws IOException {
        if (layout.containsKey("trailer")) {
            session.writeTrailer(resolveCells(cellList(layout.get("trailer")), context, aggregates));
        }
    }

    private static Map<String, Object> fileRef(StoredArtifact artifact) {
        var ref = new LinkedHashMap<String, Object>();
        ref.put("path", artifact.location());
        ref.put("name", artifact.name());
        ref.put("size", artifact.size());
        ref.put("store", artifact.store());
        return ref;
    }

    @SuppressWarnings("unchecked")
    private List<ReadRecord> toRecords(Object raw) {
        if (raw instanceof ReadResult result) {
            return result.records();
        }
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        var records = new ArrayList<ReadRecord>(list.size());
        for (var item : list) {
            if (item instanceof ReadRecord record) {
                records.add(record);
            } else if (item instanceof Map<?, ?> map) {
                records.add(new ReadRecord((Map<String, Object>) map));
            }
        }
        return records;
    }

    // --- motor de layout de cabecera/trailer (constantes / metadata / agregados) ---

    private List<Object> resolveCells(List<Map<String, Object>> cells, TaskContext context, Aggregates aggregates) {
        var resolved = new ArrayList<Object>(cells.size());
        for (var cell : cells) {
            resolved.add(resolveCell(cell, context, aggregates));
        }
        return resolved;
    }

    private Object resolveCell(Map<String, Object> cell, TaskContext context, Aggregates aggregates) {
        if (cell.containsKey("value")) {
            return cell.get("value");
        }
        if (cell.containsKey("metadata")) {
            return resolveMetadata(stringValue(cell.get("metadata"), ""), context);
        }
        if (cell.containsKey("aggregate")) {
            var aggregate = stringValue(cell.get("aggregate"), "");
            if ("count".equalsIgnoreCase(aggregate)) {
                return aggregates.count();
            }
            if ("sum".equalsIgnoreCase(aggregate)) {
                var field = stringValue(cell.get("field"), "");
                return aggregates.sums().getOrDefault(field, BigDecimal.ZERO).toPlainString();
            }
        }
        if (cell.containsKey("sourceOutput")) {
            return resolveBinding(cell, context);
        }
        return "";
    }

    /**
     * ADR-004: celda ligada a un output AGREGADO (Map) de una tarea previa. Los outputs {@code summary}/{@code out}
     * se publican como Map en {@code taskOutputs} bajo {@code ref.<output>}; aqui se extrae el campo pedido. Es el
     * lugar natural de estos origenes en un archivo (una celda de cabecera/trailer), ya que no son un stream de filas
     * (el detalle solo consume {@code records}/{@code table}). Binding no resuelto -&gt; celda vacia (consistente con
     * {@code metadata}/{@code aggregate}); el front solo ofrece combos validos via {@code buildOptions}.
     */
    private Object resolveBinding(Map<String, Object> cell, TaskContext context) {
        var sourceOutput = stringValue(cell.get("sourceOutput"), "");
        var sourceTaskRef = stringValue(cell.get("sourceTaskRef"), "");
        var sourceKey = stringValue(cell.get("sourceKey"), "");
        if (sourceOutput.isBlank() || sourceTaskRef.isBlank() || sourceKey.isBlank()) {
            return "";
        }
        var output = taskOutputs(context).get(sourceTaskRef + "." + sourceOutput);
        if (output instanceof Map<?, ?> map) {
            var value = map.get(sourceKey);
            return value != null ? value : "";
        }
        return "";
    }

    private Object resolveMetadata(String key, TaskContext context) {
        // Cualquier token que el motor haya publicado (ver metadataVars); no resuelto -> celda vacia.
        var value = metadataVars(context).get(key);
        return value != null ? value : "";
    }

    private Aggregates computeAggregates(List<ReadRecord> records, Map<String, Object> layout) {
        var sums = initialSums(layout);
        accumulateSums(records, sums);
        return new Aggregates(records.size(), sums);
    }

    private LinkedHashMap<String, BigDecimal> initialSums(Map<String, Object> layout) {
        var sumFields = new ArrayList<String>();
        collectSumFields(layout.get("header"), sumFields);
        collectSumFields(layout.get("trailer"), sumFields);
        var sums = new LinkedHashMap<String, BigDecimal>();
        for (var field : sumFields) {
            sums.putIfAbsent(field, BigDecimal.ZERO);
        }
        return sums;
    }

    private void accumulateSums(List<ReadRecord> records, Map<String, BigDecimal> sums) {
        if (sums.isEmpty()) {
            return;
        }
        for (var record : records) {
            for (var field : sums.keySet()) {
                var amount = toBigDecimal(record.value(field));
                if (amount != null) {
                    sums.put(field, sums.get(field).add(amount));
                }
            }
        }
    }

    private void collectSumFields(Object cells, List<String> out) {
        for (var cell : cellList(cells)) {
            if ("sum".equalsIgnoreCase(stringValue(cell.get("aggregate"), ""))) {
                var field = stringValue(cell.get("field"), "");
                if (!field.isBlank()) {
                    out.add(field);
                }
            }
        }
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(String.valueOf(value).trim());
        } catch (NumberFormatException notNumeric) {
            return null;
        }
    }

    private String resolveArchiveName(TaskContext context, Map<String, Object> configuration, String format) {
        var template = stringValue(configuration.get("archiveNameTemplate"),
                "export-${_processExecutionId}." + extensionFor(format));
        return template.replace("${_processExecutionId}", String.valueOf(context.processExecutionId()))
                .replace("${_taskDefinitionId}", String.valueOf(context.taskDefinitionId()));
    }

    private static String extensionFor(String format) {
        return switch (format.toUpperCase()) {
            case "CSV" -> "csv";
            case "TXT" -> "txt";
            case "XLSX" -> "xlsx";
            default -> "dat";
        };
    }

    // --- helpers de config ---

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> cellList(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        var cells = new ArrayList<Map<String, Object>>(list.size());
        for (var item : list) {
            if (item instanceof Map<?, ?> map) {
                cells.add((Map<String, Object>) map);
            }
        }
        return cells;
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
            return new LinkedHashMap<>();
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
        return Integer.parseInt(String.valueOf(raw).trim());
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    /** Agregados: conteo y sumas por campo (BigDecimal para precision monetaria). */
    private record Aggregates(long count, Map<String, BigDecimal> sums) {
    }
}
