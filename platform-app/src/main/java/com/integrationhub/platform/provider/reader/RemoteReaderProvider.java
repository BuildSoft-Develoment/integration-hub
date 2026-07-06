package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.service.artifact.ArtifactStaging;
import com.integrationhub.platform.service.artifact.StagedDownload;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.ArtifactReference;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

public class RemoteReaderProvider implements ReaderProvider {

    /**
     * Proyecto #3 Fase 3a: el reader por referencia requiere spiVersion mayor >= 2 (retira el contentBase64 del envío;
     * el guard v58 de tamaño ya no aplica porque el input va por el object store, no por gRPC).
     */
    static final int REQUIRED_SPI_VERSION = 2;
    /** TTL de la URL presignada de descarga (corta vida; el plugin descarga dentro del READ síncrono). */
    static final Duration DOWNLOAD_TTL = Duration.ofMinutes(15);
    /** Red de seguridad contra loop infinito de paginación (además del guard de no-progreso del cursor). */
    static final int MAX_PAGES = 10_000_000;

    private final String type;
    private final RemotePluginDescriptor descriptor;
    private final RemotePluginInvoker invoker;
    private final RemotePluginRegistry registry;
    private final ArtifactStaging staging;

    public RemoteReaderProvider(String type,
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

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        requireArtifactRefContract();
        var staged = stage(payload);
        try {
            // 3b: LOOP paginado con cursor (checkpoint por página). Acota la memoria de la plataforma a una página +
            // los skips acumulados. El plugin devuelve una página + nextCursor; se repite hasta nextCursor vacío. Un
            // plugin no-paginado (sin nextCursor) hace una sola iteración = comportamiento 3a (backward-compatible).
            var effectiveBatchSize = Math.max(1, batchSize);
            var allSkips = new ArrayList<ReadSkip>();
            int total = 0;
            int batchNumber = 1;
            String cursor = null;
            for (int page = 1; ; page++) {
                if (page > MAX_PAGES) {
                    throw degraded("el reader remoto excedió " + MAX_PAGES + " páginas: el plugin puede no estar "
                            + "avanzando el cursor (posible loop)");
                }
                var result = invoke(staged.reference(), payload, configuration, batchSize, cursor);
                var records = list(result.outputs().get("records"), "Remote reader plugin must return outputs.records")
                        .stream()
                        .map(this::record)
                        .toList();
                allSkips.addAll(listOrEmpty(result.outputs().get("skippedRows")).stream().map(this::skip).toList());

                // Re-batcha la página en trozos de batchSize para el consumer (contrato consistente con readers locales).
                for (int from = 0; from < records.size(); from += effectiveBatchSize) {
                    var to = Math.min(from + effectiveBatchSize, records.size());
                    consumer.accept(new ReadBatch(payload.name(), batchNumber++, records.subList(from, to)));
                }
                total += records.size();

                var nextCursor = text(result.outputs().get("nextCursor"));
                if (nextCursor.isBlank()) {
                    break; // fin de la paginación (o plugin no-paginado)
                }
                if (Objects.equals(nextCursor, cursor)) {
                    throw degraded("el reader remoto no avanza el cursor ('" + nextCursor + "'): posible loop");
                }
                cursor = nextCursor;
            }
            // records() VACÍO a propósito: la plataforma streameó por el consumer; ningún caller lee records() del
            // reader remoto (verificado). Acota la memoria en el streaming pipeline.
            return new ReadResult(List.of(), total, allSkips.size(), allSkips);
        } finally {
            staging.deleteStaged(staged.key());
        }
    }

    /** 3a: stagea el archivo de entrada (upload por streaming) y presigna un GET para que el plugin lo descargue. */
    private StagedDownload stage(SourcePayload payload) {
        var size = payload.file() == null || payload.file().size() == null ? 0L : payload.file().size();
        try (var stream = payload.openStream()) {
            return staging.stageForDownload(stream, payload.mediaType(), size, DOWNLOAD_TTL);
        } catch (IOException error) {
            throw degraded("no se pudo stagear el archivo para el reader remoto: " + error.getMessage());
        }
    }

    private TaskResult invoke(ArtifactReference inputReference, SourcePayload payload,
                              Map<String, Object> configuration, int batchSize, String cursor) {
        if (!descriptor.trusted()) {
            throw degraded("descriptor no confiable");
        }
        try {
            var result = invoker.invoke(
                    descriptor,
                    "READER_READ:" + normalized(type),
                    context(),
                    request(inputReference, payload, configuration, batchSize, cursor));
            if (result.suspended()) {
                throw degraded("remote reader provider requires immediate result");
            }
            if (!result.success()) {
                throw degraded(result.details());
            }
            return result;
        } catch (RuntimeException error) {
            registry.markDegraded(descriptor.id(), "reader remoto fallido: " + error.getMessage());
            throw error;
        }
    }

    private Map<String, Object> request(ArtifactReference inputReference, SourcePayload payload,
                                        Map<String, Object> configuration, int batchSize, String cursor) {
        var request = new LinkedHashMap<String, Object>();
        request.put("configuration", configuration == null ? Map.of() : configuration);
        request.put("batchSize", batchSize);
        var sourceFile = new LinkedHashMap<String, Object>();
        sourceFile.put("name", payload.name());
        sourceFile.put("location", payload.location());
        sourceFile.put("mediaType", payload.mediaType());
        request.put("sourceFile", sourceFile);
        // 3a: el archivo va por referencia (GET presignado), no como contentBase64; el plugin lo descarga por streaming.
        request.put(ArtifactReference.ARTIFACT_REF, inputReference.asMap());
        // 3b: cursor de paginación (ausente en la primera página). El plugin debería tratarlo como un OFFSET y usar un
        // Range GET de la URL presignada para reanudar sin re-descargar todo (ver ArtifactTransfer.openRange).
        if (cursor != null && !cursor.isBlank()) {
            request.put("cursor", cursor);
        }
        return request;
    }

    /** Negociación: el reader por referencia requiere que el plugin declare spiVersion mayor >= 2. */
    private void requireArtifactRefContract() {
        int major = majorVersion(descriptor.spiVersion());
        if (major < REQUIRED_SPI_VERSION) {
            throw degraded("el plugin declara spiVersion='" + descriptor.spiVersion() + "' pero el reader remoto por "
                    + "referencia (artifactRef) requiere spiVersion mayor >= " + REQUIRED_SPI_VERSION
                    + ": actualiza el plugin para descargar el archivo de la URL presignada en vez de recibir contentBase64");
        }
    }

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

    private TaskContext context() {
        var context = new TaskContext(null, null);
        context.attributes().put("pluginCapability", "reader");
        context.attributes().put("providerType", type);
        context.attributes().put("operation", "READ");
        return context;
    }

    private IllegalStateException degraded(String reason) {
        var message = reason == null || reason.isBlank() ? "remote reader provider failed" : reason;
        registry.markDegraded(descriptor.id(), message);
        return new IllegalStateException("Plugin remoto " + descriptor.id() + " no pudo leer registros: " + message);
    }

    private ReadRecord record(Object value) {
        if (!(value instanceof Map<?, ?> raw)) {
            throw degraded("Remote reader record must be an object");
        }
        var copy = new LinkedHashMap<String, Object>();
        for (var entry : raw.entrySet()) {
            if (entry.getKey() instanceof String key) {
                copy.put(key, entry.getValue());
            }
        }
        return new ReadRecord(copy);
    }

    private ReadSkip skip(Object value) {
        if (!(value instanceof Map<?, ?> raw)) {
            throw degraded("Remote reader skipped row must be an object");
        }
        return new ReadSkip(intValue(raw.get("rowNumber")), text(raw.get("reason")));
    }

    private List<Object> list(Object value, String message) {
        if (!(value instanceof List<?> raw)) {
            throw degraded(message);
        }
        return List.copyOf(raw);
    }

    private List<Object> listOrEmpty(Object value) {
        if (value == null) {
            return List.of();
        }
        if (!(value instanceof List<?> raw)) {
            throw degraded("Remote reader outputs.skippedRows must be a list");
        }
        return List.copyOf(raw);
    }

    private static int intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        var text = text(value);
        return text.isBlank() ? 0 : Integer.parseInt(text);
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static String normalized(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
