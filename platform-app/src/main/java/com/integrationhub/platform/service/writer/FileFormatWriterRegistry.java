package com.integrationhub.platform.service.writer;

import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.writer.FileFormatWriter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;

/**
 * ADR-016: registry de {@link FileFormatWriter} (espejo de {@code ReaderProviderRegistry}). Resuelve un escritor por
 * {@code format} (case-insensitive) sobre los beans CDI. Los escritores como plugin remoto son fase posterior.
 */
@ApplicationScoped
public class FileFormatWriterRegistry {

    private final Instance<FileFormatWriter> writers;

    @Inject
    public FileFormatWriterRegistry(Instance<FileFormatWriter> writers) {
        this.writers = writers;
    }

    public FileFormatWriterRegistry(Instance<FileFormatWriter> writers, boolean ignored) {
        this.writers = writers;
    }

    public FileFormatWriter resolve(String format) {
        return writerStream()
                .filter(writer -> writer.format().equalsIgnoreCase(format))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported file format writer: " + format));
    }

    /** Formatos disponibles (format -> nombre del provider), para el catalogo de tipos. */
    public Map<String, String> localWriterFormats() {
        var formats = new LinkedHashMap<String, String>();
        writerStream().forEach(writer -> {
            var format = writer.format();
            if (format != null && !format.isBlank()) {
                formats.putIfAbsent(format, writer.getClass().getSimpleName());
            }
        });
        return Collections.unmodifiableMap(formats);
    }

    public PluginConfigSchema configSchema(String format) {
        return resolve(format).configSchema();
    }

    private Stream<FileFormatWriter> writerStream() {
        return writers == null ? Stream.empty() : writers.stream();
    }
}
