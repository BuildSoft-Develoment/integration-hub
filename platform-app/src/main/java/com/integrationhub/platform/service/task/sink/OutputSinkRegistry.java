package com.integrationhub.platform.service.task.sink;

import com.integrationhub.platform.spi.task.sink.OutputSink;
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

    /**
     * ¿Hay sink para este tipo? Lo mismo que pregunta {@link #resolve} justo antes de fallar, pero sin
     * excepción: sirve para poder decirlo ANTES, al guardar el proceso.
     *
     * <p>Existía la asimetría de que el catálogo de {@code /sources} admite tipos que la salida no
     * sabe entregar —hay 8 de entrada y 2 de salida—, y el único momento en que eso se notaba era la
     * ejecución, con el proceso ya publicado y alguien esperando el archivo.</p>
     */
    public boolean supports(String type) {
        return type != null && sinks.get().anyMatch(sink -> sink.type().equalsIgnoreCase(type));
    }

    /** Tipos con sink, en orden estable. Para decir en el error QUÉ sí se puede elegir. */
    public List<String> availableTypes() {
        return sinks.get().map(OutputSink::type).sorted(String.CASE_INSENSITIVE_ORDER).toList();
    }
}
