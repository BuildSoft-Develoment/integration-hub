package com.integrationhub.platform.spi.source;

import com.integrationhub.platform.spi.config.PluginConfigSchema;
import java.util.List;
import java.util.Map;

public interface SourceProvider {

    String type();

    List<SelectedSourceFile> selectFiles(Map<String, Object> configuration);

    SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration);

    /**
     * Schema de configuración del tipo de fuente: la UI lo renderiza con {@code ih-schema-form}
     * para configurar una fuente aportada por un plugin sin formulario hardcoded. Opt-in
     * (vacío por defecto).
     */
    default PluginConfigSchema configSchema() {
        return PluginConfigSchema.empty();
    }
}
