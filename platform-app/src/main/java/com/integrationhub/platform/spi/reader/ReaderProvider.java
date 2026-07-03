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
     * Schema de configuración del tipo de reader: la UI lo renderiza con {@code ih-schema-form}
     * para configurar un reader aportado por un plugin sin formulario hardcoded. Opt-in
     * (vacío por defecto).
     */
    default PluginConfigSchema configSchema() {
        return PluginConfigSchema.empty();
    }
}
