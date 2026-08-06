package com.integrationhub.platform.spi.source;

import com.integrationhub.platform.spi.config.PluginConfigField;
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

    /**
     * Claves de configuración que contienen una CREDENCIAL, y que por QA-006 solo pueden persistirse
     * como referencia {@code ${secret:...}}, nunca en claro.
     *
     * <p><b>Por qué lo declara el provider y no una lista central.</b> Esta informacion vivia en un
     * mapa del frontend, y ese mapa se quedo atras: no incluia {@code GCS} ni {@code AZURE_BLOB}, asi
     * que el JSON de service account de Google -con su clave privada- y el connection string de Azure
     * se guardaban literales mientras un password de SFTP si se bloqueaba. El control existia y
     * miraba a otro lado. Quien sabe que campos suyos son secretos es el provider; centralizarlo
     * garantiza que el proximo tipo nazca desprotegido.</p>
     *
     * <p>El valor por defecto se deriva de {@link #configSchema()}: un campo declarado {@code secret}
     * ya significa exactamente esto (ver {@code PluginConfigField#secret}). Asi los tipos aportados
     * por plugins quedan cubiertos sin escribir nada, y un provider con formulario propio -los
     * built-in tienen componentes Angular dedicados, no schema- sobrescribe este metodo.</p>
     *
     * <p>Devolver la lista vacia es una AFIRMACION: "este tipo no tiene ninguna credencial". Vale
     * para {@code FILESYSTEM}; no vale como olvido, y hay un test que lo comprueba contra los
     * providers registrados.</p>
     */
    default List<String> credentialKeys() {
        return configSchema().fields().stream()
                .filter(field -> "secret".equalsIgnoreCase(field.type()))
                .map(PluginConfigField::key)
                .toList();
    }
}
