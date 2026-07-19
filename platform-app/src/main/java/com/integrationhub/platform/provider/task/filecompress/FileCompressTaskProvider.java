package com.integrationhub.platform.provider.task.filecompress;

// @trace ADR-016 (salida generica: tarea FILE_COMPRESS - comprime uno o varios archivos)

import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.artifact.ArtifactStoreRegistry;
import com.integrationhub.platform.service.compress.FileCompressorRegistry;
import com.integrationhub.platform.spi.artifact.StoredArtifact;
import com.integrationhub.platform.spi.compress.CompressionEntry;
import com.integrationhub.platform.spi.compress.CompressionOptions;
import com.integrationhub.platform.spi.compress.FileCompressor;
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
 * ADR-016: tarea {@code FILE_COMPRESS}. Consume {@code summary.files} de una tarea previa (una o varias rutas), las
 * comprime con el algoritmo elegido ({@code ZIP}/{@code GZIP}) a un nuevo artefacto y publica su referencia. ZIP
 * bundlea varias entradas y soporta AES-256 (password por referencia vault); GZIP comprime un solo archivo.
 *
 * <p>Config: {@code algorithm}, {@code compressionLevel}, {@code archiveNameTemplate}, {@code entryNameTemplate},
 * {@code encryption} (NONE/AES256), {@code password} ({@code ${secret:...}}), {@code deleteSourcesAfter}.</p>
 */
@ApplicationScoped
public class FileCompressTaskProvider implements TaskProvider {

    private final FileCompressorRegistry compressors;
    private final ArtifactStoreRegistry artifactStores;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    @Inject
    public FileCompressTaskProvider(FileCompressorRegistry compressors,
                                    ArtifactStoreRegistry artifactStores,
                                    JsonConfigurationMapper jsonConfigurationMapper) {
        this.compressors = compressors;
        this.artifactStores = artifactStores;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    /** Constructor de test (sin resolucion de secretos: password literal). */
    public FileCompressTaskProvider(FileCompressorRegistry compressors, ArtifactStoreRegistry artifactStores) {
        this(compressors, artifactStores, null);
    }

    @Override
    public String type() {
        return "FILE_COMPRESS";
    }

    @Override
    public AsyncOffloadSupport asyncOffloadSupport() {
        // Unidad self-contained dado el store compartido: offload-able. En fase 1 (LocalTempArtifactStore) el offload
        // real es mono-JVM; el multi-nodo llega con S3ArtifactStore (fase 2).
        return AsyncOffloadSupport.SUPPORTED;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        var algorithm = stringValue(configuration.get("algorithm"), "ZIP");
        var compressor = compressors.resolve(algorithm);

        var sourceFiles = resolveSourceFiles(context, configuration);
        if (sourceFiles.isEmpty()) {
            throw new IllegalArgumentException("FILE_COMPRESS: no input files to compress (upstream summary.files is empty)");
        }
        if (!compressor.supportsMultipleEntries() && sourceFiles.size() > 1) {
            throw new IllegalArgumentException(algorithm + " compresses a single file, but upstream produced "
                    + sourceFiles.size() + " files; use ZIP to bundle multiple");
        }

        var options = resolveOptions(configuration, compressor);
        var entryNameTemplate = stringValue(configuration.get("entryNameTemplate"), "${originalName}");
        var entries = new ArrayList<CompressionEntry>(sourceFiles.size());
        for (var source : sourceFiles) {
            var artifact = source;
            var sourceStore = artifactStores.resolve(artifact.store());
            var entryName = entryNameTemplate.replace("${originalName}", artifact.name());
            entries.add(new CompressionEntry(entryName, () -> sourceStore.open(artifact)));
        }

        var archiveName = resolveArchiveName(context, configuration, algorithm);
        var store = artifactStores.forExecution(boolValue(configuration.get("async"), false));

        long entryCount;
        StoredArtifact stored;
        try (var artifact = store.create(archiveName)) {
            entryCount = compressor.compress(entries, artifact.outputStream(), options);
            stored = artifact.finish();
        } catch (IOException error) {
            throw new IllegalStateException("FILE_COMPRESS could not build archive " + archiveName, error);
        }

        if (boolValue(configuration.get("deleteSourcesAfter"), false)) {
            deleteSources(sourceFiles);
        }

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("archivePath", stored.location());
        outputs.put("archiveName", stored.name());
        outputs.put("archiveSize", stored.size());
        outputs.put("store", stored.store());
        outputs.put("entryCount", entryCount);
        outputs.put("files", List.of(fileRef(stored)));
        return TaskResult.success("FILE_COMPRESS produced " + stored.name() + " (" + entryCount + " entries)", outputs);
    }

    private void deleteSources(List<StoredArtifact> sourceFiles) {
        for (var source : sourceFiles) {
            try {
                artifactStores.resolve(source.store()).delete(source);
            } catch (IOException | RuntimeException ignored) {
                // best-effort: no abortar la ejecucion por no poder borrar un temporal de origen
            }
        }
    }

    // --- resolucion de la lista de archivos de origen (summary.files de la tarea previa) ---

    @SuppressWarnings("unchecked")
    private List<StoredArtifact> resolveSourceFiles(TaskContext context, Map<String, Object> configuration) {
        var input = mapValue(configuration.get("input"));
        var sourceTaskRef = stringValue(input.get("sourceTaskRef"), "");
        if (sourceTaskRef.isBlank()) {
            throw new IllegalArgumentException("FILE_COMPRESS requires input.sourceTaskRef");
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

    // --- opciones de compresion ---

    private CompressionOptions resolveOptions(Map<String, Object> configuration, FileCompressor compressor) {
        var level = deflateLevel(configuration.get("compressionLevel"));
        var encryption = stringValue(configuration.get("encryption"), "NONE");
        if (!"NONE".equalsIgnoreCase(encryption)) {
            if (!compressor.supportsEncryption()) {
                throw new IllegalArgumentException(compressor.algorithm() + " does not support encryption; use ZIP");
            }
            var password = resolvePassword(configuration);
            if (password.isBlank()) {
                throw new IllegalArgumentException("FILE_COMPRESS: encryption '" + encryption
                        + "' requires a non-blank password (use a ${secret:...} reference)");
            }
            return CompressionOptions.encrypted(password.toCharArray(), level);
        }
        return CompressionOptions.plain(level);
    }

    private String resolvePassword(Map<String, Object> configuration) {
        var raw = stringValue(configuration.get("password"), "");
        if (raw.isBlank() || jsonConfigurationMapper == null) {
            return raw;
        }
        // Resuelve ${secret:...} de forma defensiva (si el motor ya lo resolvio, un literal se devuelve igual).
        var resolved = jsonConfigurationMapper.resolveSecretsIn(new LinkedHashMap<>(Map.of("password", raw))).get("password");
        return resolved == null ? "" : String.valueOf(resolved);
    }

    private int deflateLevel(Object raw) {
        var value = stringValue(raw, "NORMAL");
        return switch (value.toUpperCase()) {
            case "STORE" -> 0;
            case "FAST", "FASTEST" -> 1;
            case "NORMAL" -> 6;
            case "BEST", "MAXIMUM" -> 9;
            default -> {
                try {
                    yield Math.max(0, Math.min(9, Integer.parseInt(value)));
                } catch (NumberFormatException notNumeric) {
                    yield 6;
                }
            }
        };
    }

    private String resolveArchiveName(TaskContext context, Map<String, Object> configuration, String algorithm) {
        var template = stringValue(configuration.get("archiveNameTemplate"),
                "export-${_processExecutionId}." + extensionFor(algorithm));
        return template.replace("${_processExecutionId}", String.valueOf(context.processExecutionId()))
                .replace("${_taskDefinitionId}", String.valueOf(context.taskDefinitionId()));
    }

    private static String extensionFor(String algorithm) {
        return switch (algorithm.toUpperCase()) {
            case "GZIP" -> "gz";
            case "TAR_GZ" -> "tar.gz";
            default -> "zip";
        };
    }

    private static Map<String, Object> fileRef(StoredArtifact artifact) {
        var ref = new LinkedHashMap<String, Object>();
        ref.put("path", artifact.location());
        ref.put("name", artifact.name());
        ref.put("size", artifact.size());
        ref.put("store", artifact.store());
        return ref;
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

    private boolean boolValue(Object raw, boolean defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(raw));
    }
}
