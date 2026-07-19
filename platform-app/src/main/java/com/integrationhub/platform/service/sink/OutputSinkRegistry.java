package com.integrationhub.platform.service.sink;

import com.integrationhub.platform.spi.sink.OutputSink;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Stream;

/**
 * ADR-016: registry de {@link OutputSink} (espejo de {@code SourceProviderRegistry}). Resuelve por {@code type}
 * (case-insensitive) sobre los beans CDI. Sinks como plugin remoto son fase posterior.
 */
@ApplicationScoped
public class OutputSinkRegistry {

    private final Supplier<Stream<OutputSink>> sinks;

    @Inject
    public OutputSinkRegistry(Instance<OutputSink> sinks) {
        this.sinks = () -> sinks == null ? Stream.empty() : sinks.stream();
    }

    /** Constructor de test: beans ya resueltos (sin CDI). */
    public OutputSinkRegistry(List<OutputSink> sinks) {
        this.sinks = () -> sinks == null ? Stream.empty() : sinks.stream();
    }

    public OutputSink resolve(String type) {
        return sinks.get()
                .filter(sink -> sink.type().equalsIgnoreCase(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported output sink: " + type));
    }
}
