package com.integrationhub.platform.provider.reader;

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

import java.io.IOException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class RemoteReaderProvider implements ReaderProvider {

    /** Umbral por defecto del contenido remoto (conservador ~4 MB): el server del plugin suele capar a ~4 MB inbound. */
    public static final long DEFAULT_MAX_CONTENT_BYTES = 4L * 1024 * 1024;

    private final String type;
    private final RemotePluginDescriptor descriptor;
    private final RemotePluginInvoker invoker;
    private final RemotePluginRegistry registry;
    // v58-fix: guard de tamano. El reader empuja el archivo COMPLETO (Base64 dentro de configuration_json) en un
    // request gRPC unary; para archivos grandes el server del plugin lo rechaza con un RESOURCE_EXHAUSTED cripitico.
    // Se pre-chequea el tamano Base64 estimado y se rechaza con un mensaje ACCIONABLE (usar reader local). No es
    // streaming; es un guard de operabilidad hasta que exista un contrato de streaming.
    private final long maxContentBytes;

    public RemoteReaderProvider(String type,
                                RemotePluginDescriptor descriptor,
                                RemotePluginInvoker invoker,
                                RemotePluginRegistry registry) {
        this(type, descriptor, invoker, registry, DEFAULT_MAX_CONTENT_BYTES);
    }

    public RemoteReaderProvider(String type,
                                RemotePluginDescriptor descriptor,
                                RemotePluginInvoker invoker,
                                RemotePluginRegistry registry,
                                long maxContentBytes) {
        this.type = type;
        this.descriptor = descriptor;
        this.invoker = invoker;
        this.registry = registry;
        this.maxContentBytes = maxContentBytes > 0 ? maxContentBytes : DEFAULT_MAX_CONTENT_BYTES;
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
        var result = invoke(payload, configuration, batchSize);
        var records = list(result.outputs().get("records"), "Remote reader plugin must return outputs.records")
                .stream()
                .map(this::record)
                .toList();
        var skips = listOrEmpty(result.outputs().get("skippedRows")).stream()
                .map(this::skip)
                .toList();

        var effectiveBatchSize = Math.max(1, batchSize);
        for (int from = 0, batchNumber = 1; from < records.size(); from += effectiveBatchSize, batchNumber++) {
            var to = Math.min(from + effectiveBatchSize, records.size());
            consumer.accept(new ReadBatch(payload.name(), batchNumber, records.subList(from, to)));
        }
        return new ReadResult(records, records.size(), skips.size(), skips);
    }

    private TaskResult invoke(SourcePayload payload, Map<String, Object> configuration, int batchSize) {
        if (!descriptor.trusted()) {
            throw degraded("descriptor no confiable");
        }
        try {
            var result = invoker.invoke(
                    descriptor,
                    "READER_READ:" + normalized(type),
                    context(),
                    request(payload, configuration, batchSize));
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

    private Map<String, Object> request(SourcePayload payload, Map<String, Object> configuration, int batchSize) {
        var request = new LinkedHashMap<String, Object>();
        request.put("configuration", configuration == null ? Map.of() : configuration);
        request.put("batchSize", batchSize);
        var sourceFile = new LinkedHashMap<String, Object>();
        sourceFile.put("name", payload.name());
        sourceFile.put("location", payload.location());
        sourceFile.put("mediaType", payload.mediaType());
        request.put("sourceFile", sourceFile);
        var content = bytes(payload);
        // Estimacion del tamano Base64 (~4/3 del binario). Si excede el umbral, se rechaza ANTES de invocar con un
        // mensaje accionable, en vez de un RESOURCE_EXHAUSTED gRPC crudo del server del plugin.
        var estimatedBase64 = content.length / 3L * 4;
        if (estimatedBase64 > maxContentBytes) {
            throw degraded("el archivo '" + payload.name() + "' (~" + estimatedBase64 + " B en Base64) excede el "
                    + "maximo del reader remoto (" + maxContentBytes + " B). Los plugins remotos transfieren el "
                    + "archivo completo en un mensaje gRPC (sin streaming); usa un reader LOCAL para archivos "
                    + "masivos o sube el limite del plugin y de integrationhub.plugin.remote.reader.max-content-bytes");
        }
        request.put("contentBase64", Base64.getEncoder().encodeToString(content));
        return request;
    }

    private byte[] bytes(SourcePayload payload) {
        try (var stream = payload.openStream()) {
            return stream.readAllBytes();
        } catch (IOException error) {
            throw new IllegalArgumentException("Cannot read source payload for remote reader", error);
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
