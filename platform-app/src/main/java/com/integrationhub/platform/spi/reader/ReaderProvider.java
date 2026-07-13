package com.integrationhub.platform.spi.reader;

import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.source.SourcePayload;

import java.util.Map;

public interface ReaderProvider {

    String type();

    ReadResult readInBatches(SourcePayload payload,
                             Map<String, Object> configuration,
                             int batchSize,
                             ReadBatchConsumer consumer);

    /**
     * Indicates that this reader can feed the streaming FILE_READ -> BatchTaskProvider fast path without requiring the
     * process engine to materialize all records first. New local or remote readers should opt in by capability instead
     * of being hardcoded by type in the engine.
     */
    default boolean supportsStreamingPipeline() {
        return false;
    }

    /**
     * Indicates that this reader must not be executed through collectReadResult, because doing so would defeat its
     * bounded-memory contract. The engine should route it through the streaming pipeline or fail fast.
     */
    default boolean requiresStreamingPipeline() {
        return false;
    }

    /**
     * Schema de configuracion del tipo de reader: la UI lo renderiza con {@code ih-schema-form}
     * para configurar un reader aportado por un plugin sin formulario hardcoded. Opt-in
     * (vacio por defecto).
     */
    default PluginConfigSchema configSchema() {
        return PluginConfigSchema.empty();
    }

    /**
     * #5: valida la configuración del reader al CREAR/ACTUALIZAR la definición (no al leer), para fallar temprano y
     * claro (400) en vez de aceptar una config inválida y diferir el error a runtime. Default no-op (los readers que
     * no la implementen no se afectan); cada reader valida solo lo suyo (SRP). Debe lanzar {@link IllegalArgumentException}
     * con un mensaje accionable si la config es inválida.
     */
    default void validateConfiguration(Map<String, Object> configuration) {
        // no-op por defecto
    }
}
