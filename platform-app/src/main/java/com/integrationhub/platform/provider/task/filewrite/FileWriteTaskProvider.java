package com.integrationhub.platform.provider.task.filewrite;

// @trace ADR-016 (salida generica: tarea FILE_WRITE - serializa registros a un archivo)

import com.integrationhub.platform.service.artifact.ArtifactStoreRegistry;
import com.integrationhub.platform.service.writer.FileFormatWriterRegistry;
import com.integrationhub.platform.spi.artifact.StoredArtifact;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.spi.writer.FileFormatWriter;
import com.integrationhub.platform.spi.writer.FileWriteSession;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ADR-016: tarea {@code FILE_WRITE}. Serializa los registros de una tarea previa a un archivo (via {@link FileFormatWriter})
 * y lo materializa en el {@link com.integrationhub.platform.spi.artifact.ArtifactStore} (temp local en sync). Publica en
 * {@code summary} la referencia del archivo ({@code archivePath}/{@code archiveSize}/{@code recordCount}) y {@code files}
 * (lista de rutas, para que {@code FILE_COMPRESS}/{@code FILE_DELIVER} lo consuman).
 *
 * <p>Fase 1: fuente {@code records} en memoria (volumenes chicos), un unico archivo ordenado (header/detalle/trailer)
 * con agregados calculados en memoria. La fuente-tabla con paginado keyset (&gt;1M) y el pre-query de agregados llegan
 * en el siguiente slice (mismo patron que {@code MT101_BUILD_FROM_TABLE}). {@code asyncOffloadSupport} default =
 * {@code UNSUPPORTED} (escritor secuencial unico).</p>
 */
@ApplicationScoped
public class FileWriteTaskProvider implements TaskProvider {

    private final FileFormatWriterRegistry writers;
    private final ArtifactStoreRegistry artifactStores;

    @Inject
    public FileWriteTaskProvider(FileFormatWriterRegistry writers, ArtifactStoreRegistry artifactStores) {
        this.writers = writers;
        this.artifactStores = artifactStores;
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

        var records = resolveRecords(context, configuration);
        var layout = mapValue(configuration.get("layout"));
        var aggregates = computeAggregates(records, layout);
        var archiveName = resolveArchiveName(context, configuration, format);
        var store = artifactStores.forExecution(boolValue(configuration.get("async"), false));

        StoredArtifact stored;
        try (var artifact = store.create(archiveName)) {
            try (FileWriteSession session = writer.open(artifact.outputStream(), configuration)) {
                if (layout.containsKey("header")) {
                    session.writeHeader(resolveCells(cellList(layout.get("header")), context, aggregates));
                }
                session.writeDetail(records);
                if (layout.containsKey("trailer")) {
                    session.writeTrailer(resolveCells(cellList(layout.get("trailer")), context, aggregates));
                }
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
        outputs.put("recordCount", records.size());
        // files: contrato de handoff multi-archivo (FILE_COMPRESS/FILE_DELIVER lo leen). En fase 1 es de un elemento.
        outputs.put("files", List.of(fileRef(stored)));
        return TaskResult.success("FILE_WRITE wrote " + records.size() + " records to " + stored.name(), outputs);
    }

    private static Map<String, Object> fileRef(StoredArtifact artifact) {
        var ref = new LinkedHashMap<String, Object>();
        ref.put("path", artifact.location());
        ref.put("name", artifact.name());
        ref.put("size", artifact.size());
        ref.put("store", artifact.store());
        return ref;
    }

    // --- resolucion de la fuente de registros (fase 1: records en memoria) ---

    private List<ReadRecord> resolveRecords(TaskContext context, Map<String, Object> configuration) {
        var input = mapValue(configuration.get("input"));
        var sourceTaskRef = stringValue(input.get("sourceTaskRef"), "");
        var sourceOutput = stringValue(input.get("sourceOutput"), "records");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("FILE_WRITE requires input.sourceTaskRef");
        }
        var raw = taskOutputs(context).get(sourceTaskRef + "." + sourceOutput);
        return toRecords(raw);
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
        return "";
    }

    private Object resolveMetadata(String key, TaskContext context) {
        return switch (key) {
            case "_processExecutionId" -> context.processExecutionId();
            case "_taskDefinitionId" -> context.taskDefinitionId();
            default -> "";
        };
    }

    private Aggregates computeAggregates(List<ReadRecord> records, Map<String, Object> layout) {
        var sumFields = new ArrayList<String>();
        collectSumFields(layout.get("header"), sumFields);
        collectSumFields(layout.get("trailer"), sumFields);
        var sums = new LinkedHashMap<String, BigDecimal>();
        for (var field : sumFields) {
            sums.putIfAbsent(field, BigDecimal.ZERO);
        }
        for (var record : records) {
            for (var field : sums.keySet()) {
                var value = record.values().get(field);
                var amount = toBigDecimal(value);
                if (amount != null) {
                    sums.put(field, sums.get(field).add(amount));
                }
            }
        }
        return new Aggregates(records.size(), sums);
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

    private String stringValue(Object raw, String defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }

    /** Agregados calculados sobre los registros: conteo y sumas por campo (BigDecimal para precision monetaria). */
    private record Aggregates(long count, Map<String, BigDecimal> sums) {
    }
}
