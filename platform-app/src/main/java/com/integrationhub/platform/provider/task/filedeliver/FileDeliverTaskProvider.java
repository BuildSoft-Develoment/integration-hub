package com.integrationhub.platform.provider.task.filedeliver;

// @trace ADR-016 (salida generica: tarea FILE_DELIVER - entrega archivos a un sink /sources OUTPUT)

import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.task.artifact.ArtifactStoreRegistry;
import com.integrationhub.platform.service.task.sink.OutputSinkRegistry;
import com.integrationhub.platform.service.task.sink.SinkDefinitionService;
import com.integrationhub.platform.spi.task.artifact.StoredArtifact;
import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ADR-016: tarea {@code FILE_DELIVER}. Consume {@code summary.files} de una tarea previa y entrega cada archivo a un
 * {@link com.integrationhub.platform.spi.task.sink.OutputSink} resuelto por {@code sinkRef} — una definicion {@code /sources}
 * con {@code direction} de salida ({@code OUTPUT}/{@code BOTH}). Reutiliza la config de conexion del source (host/
 * credenciales/vault) y streamea desde el artefacto (nunca el archivo completo en memoria).
 */
@ApplicationScoped
public class FileDeliverTaskProvider implements TaskProvider {

    private final OutputSinkRegistry sinks;
    private final ArtifactStoreRegistry artifactStores;
    private final SinkDefinitionService sinkDefinitionService;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    @Inject
    public FileDeliverTaskProvider(OutputSinkRegistry sinks,
                                   ArtifactStoreRegistry artifactStores,
                                   SinkDefinitionService sinkDefinitionService,
                                   JsonConfigurationMapper jsonConfigurationMapper) {
        this.sinks = sinks;
        this.artifactStores = artifactStores;
        this.sinkDefinitionService = sinkDefinitionService;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    @Override
    public String type() {
        return "FILE_DELIVER";
    }

    @Override
    public AsyncOffloadSupport asyncOffloadSupport() {
        // Entregar N archivos independientes es offload-able (como MT101_PAY). El multi-nodo real llega con
        // S3ArtifactStore (fase 2); en fase 1 el store es temp local.
        return AsyncOffloadSupport.SUPPORTED;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var sinkRef = longValue(configuration.get("sinkRef"));
        if (sinkRef == null) {
            throw new IllegalArgumentException("FILE_DELIVER requires sinkRef (id of a /sources OUTPUT definition)");
        }
        var definition = sinkDefinitionService.resolve(sinkRef);
        if (!definition.allowsOutput()) {
            throw new IllegalArgumentException("FILE_DELIVER: source '" + definition.name() + "' (id " + sinkRef
                    + ") is not an OUTPUT sink (direction=" + definition.direction() + "); set it to OUTPUT or BOTH");
        }
        var sink = sinks.resolve(definition.type());
        var sinkConfig = jsonConfigurationMapper.toMap(definition.configurationJson());

        var sourceFiles = resolveSourceFiles(context, configuration);
        if (sourceFiles.isEmpty()) {
            throw new IllegalArgumentException("FILE_DELIVER: no input files to deliver (upstream summary.files is empty)");
        }
        var dropPathTemplate = stringValue(configuration.get("dropPathTemplate"), "${originalName}");

        var delivered = new ArrayList<Map<String, Object>>(sourceFiles.size());
        for (var file : sourceFiles) {
            var artifact = file;
            var store = artifactStores.resolve(artifact.store());
            var dropPath = resolveDropPath(dropPathTemplate, context, artifact.name());
            try {
                sink.deliver(dropPath, () -> store.open(artifact), sinkConfig);
            } catch (IOException error) {
                throw new IllegalStateException("FILE_DELIVER could not deliver " + artifact.name()
                        + " to sink " + definition.name(), error);
            }
            var entry = new LinkedHashMap<String, Object>();
            entry.put("name", artifact.name());
            entry.put("dropPath", dropPath);
            delivered.add(entry);
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("deliveredCount", delivered.size());
        outputs.put("sink", definition.name());
        outputs.put("sinkType", definition.type());
        outputs.put("delivered", delivered);
        return TaskResult.success("FILE_DELIVER delivered " + delivered.size() + " file(s) to " + definition.name(), outputs);
    }

    private String resolveDropPath(String template, TaskContext context, String originalName) {
        return template.replace("${originalName}", originalName)
                .replace("${_processExecutionId}", String.valueOf(context.processExecutionId()))
                .replace("${_taskDefinitionId}", String.valueOf(context.taskDefinitionId()));
    }

    // --- resolucion de la lista de archivos de origen (summary.files de la tarea previa) ---

    @SuppressWarnings("unchecked")
    private List<StoredArtifact> resolveSourceFiles(TaskContext context, Map<String, Object> configuration) {
        var input = mapValue(configuration.get("input"));
        var sourceTaskRef = stringValue(input.get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("FILE_DELIVER requires input.sourceTaskRef");
        }
        var sourceOutput = stringValue(input.get("sourceOutput"), "summary");
        var taskOutputs = taskOutputs(context);

        Object filesRaw;
        var direct = taskOutputs.get(sourceTaskRef + "." + sourceOutput);
        if (direct instanceof List<?> list) {
            filesRaw = list;
        } else if (direct instanceof Map<?, ?> map && map.get("files") instanceof List<?> nested) {
            filesRaw = nested;
        } else {
            filesRaw = taskOutputs.get(sourceTaskRef + "." + sourceOutput + ".files");
        }

        if (!(filesRaw instanceof List<?> files)) {
            return List.of();
        }
        var result = new ArrayList<StoredArtifact>(files.size());
        for (var file : files) {
            if (file instanceof Map<?, ?> map) {
                result.add(toStoredArtifact((Map<String, Object>) map));
            }
        }
        return result;
    }

    private StoredArtifact toStoredArtifact(Map<String, Object> file) {
        var store = stringValue(file.get("store"), "LOCAL_TEMP");
        var name = stringValue(file.get("name"), "file");
        var path = stringValue(file.get("path"), "");
        var size = file.get("size") instanceof Number number ? number.longValue() : 0L;
        return new StoredArtifact(store, name, path, size);
    }

    // --- helpers ---

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

    private Long longValue(Object raw) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException notNumeric) {
            return null;
        }
    }
}
