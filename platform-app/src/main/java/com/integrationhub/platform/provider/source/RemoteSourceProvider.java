package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.service.artifact.ArtifactStaging;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.ArtifactReference;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class RemoteSourceProvider implements SourceProvider {

    /** Proyecto #3 Fase 2b: el contrato source por {@code artifactRef} requiere spiVersion mayor >= 2 (retira Base64). */
    static final int REQUIRED_SPI_VERSION = 2;
    /** TTL de la URL presignada de subida (corta vida; el plugin sube dentro del OPEN síncrono). */
    static final Duration UPLOAD_TTL = Duration.ofMinutes(15);

    private final String type;
    private final RemotePluginDescriptor descriptor;
    private final RemotePluginInvoker invoker;
    private final RemotePluginRegistry registry;
    private final ArtifactStaging staging;

    public RemoteSourceProvider(String type,
                                RemotePluginDescriptor descriptor,
                                RemotePluginInvoker invoker,
                                RemotePluginRegistry registry,
                                ArtifactStaging staging) {
        this.type = type;
        this.descriptor = descriptor;
        this.invoker = invoker;
        this.registry = registry;
        this.staging = staging;
    }

    @Override
    public String type() {
        return type;
    }

    /** Config-schema declarado por el plugin remoto para este source type (o vacío). */
    @Override
    public PluginConfigSchema configSchema() {
        return descriptor.configSchemaFor(type);
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        var result = invoke("SELECT", Map.of("configuration", configuration == null ? Map.of() : configuration));
        var files = list(result.outputs().get("files"), "Remote source plugin must return outputs.files");
        return files.stream().map(this::selectedFile).toList();
    }

    /**
     * Fase 2b — el plugin ya no devuelve {@code contentBase64}: la plataforma presigna un PUT, el plugin SUBE el archivo
     * a esa URL (vía el SDK {@code ArtifactTransfer}), y la plataforma lo lee por <b>streaming</b> del staging
     * (delete-on-close). Negocia por {@code spiVersion} (fail-fast, no ruptura silenciosa).
     */
    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        requireArtifactRefContract();
        var staged = staging.presignUpload(selectedFile.mediaType(), UPLOAD_TTL);

        var payload = new LinkedHashMap<String, Object>();
        payload.put("configuration", configuration == null ? Map.of() : configuration);
        payload.put("file", selectedFile(selectedFile));
        payload.put(ArtifactReference.ARTIFACT_REF, staged.reference().asMap());

        var result = invoke("OPEN", payload);
        var mediaType = text(result.outputs().get("mediaType"));
        var effectiveMediaType = mediaType.isBlank() ? selectedFile.mediaType() : mediaType;

        // Read-back perezoso por streaming; el close() del stream borra el objeto de staging (delete-on-close).
        var file = new SelectedSourceFile(selectedFile.name(), selectedFile.location(),
                effectiveMediaType, selectedFile.size(), selectedFile.lastModified());
        return new SourcePayload(file, () -> staging.openAndDeleteOnClose(staged.key()));
    }

    /** Negociación de contrato: el source por {@code artifactRef} requiere que el plugin declare spiVersion >= 2. */
    private void requireArtifactRefContract() {
        int major = majorVersion(descriptor.spiVersion());
        if (major < REQUIRED_SPI_VERSION) {
            throw degraded("el plugin declara spiVersion='" + descriptor.spiVersion() + "' pero el source remoto por "
                    + "referencia (artifactRef) requiere spiVersion mayor >= " + REQUIRED_SPI_VERSION
                    + ": actualiza el plugin para subir el archivo a la URL presignada en vez de devolver contentBase64");
        }
    }

    /** Parsea el componente MAYOR de spiVersion ("1", "2.1.0", ...) de forma robusta; no numérico → 0. */
    private static int majorVersion(String spiVersion) {
        if (spiVersion == null || spiVersion.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(spiVersion.trim().split("\\.")[0]);
        } catch (NumberFormatException error) {
            return 0;
        }
    }

    private TaskResult invoke(String operation, Map<String, Object> payload) {
        if (!descriptor.trusted()) {
            throw degraded("descriptor no confiable");
        }
        try {
            var result = invoker.invoke(
                    descriptor,
                    "SOURCE_" + operation + ":" + normalized(type),
                    context(operation),
                    payload);
            if (result.suspended()) {
                throw degraded("remote source provider requires immediate result");
            }
            if (!result.success()) {
                throw degraded(result.details());
            }
            return result;
        } catch (RuntimeException error) {
            registry.markDegraded(descriptor.id(), "source remoto fallido: " + error.getMessage());
            throw error;
        }
    }

    private TaskContext context(String operation) {
        var context = new TaskContext(null, null);
        context.attributes().put("pluginCapability", "source");
        context.attributes().put("providerType", type);
        context.attributes().put("operation", operation);
        return context;
    }

    private IllegalStateException degraded(String reason) {
        var message = reason == null || reason.isBlank() ? "remote source provider failed" : reason;
        registry.markDegraded(descriptor.id(), message);
        return new IllegalStateException("Plugin remoto " + descriptor.id() + " no pudo leer fuente: " + message);
    }

    private SelectedSourceFile selectedFile(Object value) {
        if (!(value instanceof Map<?, ?> raw)) {
            throw degraded("Remote source file entry must be an object");
        }
        return new SelectedSourceFile(
                required(raw.get("name"), "Remote source file name is required"),
                required(raw.get("location"), "Remote source file location is required"),
                text(raw.get("mediaType")),
                longValue(raw.get("size")),
                instant(raw.get("lastModified")));
    }

    private Map<String, Object> selectedFile(SelectedSourceFile file) {
        var copy = new LinkedHashMap<String, Object>();
        copy.put("name", file.name());
        copy.put("location", file.location());
        copy.put("mediaType", file.mediaType());
        copy.put("size", file.size());
        copy.put("lastModified", file.lastModified() == null ? null : file.lastModified().toString());
        return copy;
    }

    private List<Object> list(Object value, String message) {
        if (!(value instanceof List<?> raw)) {
            throw degraded(message);
        }
        return List.copyOf(raw);
    }

    private String required(Object value, String message) {
        var text = text(value);
        if (text.isBlank()) {
            throw degraded(message);
        }
        return text;
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static Long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        var text = text(value);
        return text.isBlank() ? null : Long.parseLong(text);
    }

    private static Instant instant(Object value) {
        var text = text(value);
        return text.isBlank() ? null : Instant.parse(text);
    }

    private static String normalized(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
