package com.integrationhub.platform.spi.task.writer;

import com.integrationhub.platform.spi.config.PluginConfigSchema;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

/**
 * ADR-016: escritor de formato de archivo (espejo de {@link com.integrationhub.platform.spi.reader.ReaderProvider}).
 * Serializa registros a un formato (CSV / TXT ancho-fijo / XLSX) de forma <b>streaming</b> — nunca materializa el
 * archivo completo en memoria. Lo usa la tarea {@code FILE_WRITE} para producir un archivo de salida.
 *
 * <p>El escritor parsea del {@code configuration} el layout de <i>detalle</i> (delimitador, columnas, encoding); los
 * valores YA RESUELTOS de cabecera/trailer (constantes, metadata, agregados count/sum) los calcula la tarea y se pasan
 * a {@link FileWriteSession#writeHeader}/{@link FileWriteSession#writeTrailer}. Asi el escritor solo formatea; la
 * tarea decide que va en cada celda.
 */
public interface FileFormatWriter {

    /** Formato que produce este escritor: {@code "CSV"}, {@code "TXT"}, {@code "XLSX"}, ... (case-insensitive). */
    String format();

    /**
     * Abre una sesion de escritura streaming sobre {@code out}. El caller escribe cabecera (una vez), detalle (N lotes)
     * y trailer (una vez), y cierra la sesion. <b>El {@code close()} de la sesion hace flush de todo a {@code out} pero
     * NO cierra {@code out}</b>: el dueno del stream (p. ej. {@code WritableArtifact}) lo cierra y lee su tamano. Asi se
     * evita el doble-close entre el escritor y el store del artefacto.
     */
    FileWriteSession open(OutputStream out, Map<String, Object> configuration) throws IOException;

    /**
     * Schema de configuracion del formato: la UI lo renderiza con {@code ih-schema-form} (config dirigida por schema,
     * como los readers). Opt-in (vacio por defecto).
     */
    default PluginConfigSchema configSchema() {
        return PluginConfigSchema.empty();
    }

    /** Valida la config al CREAR/ACTUALIZAR (fail-fast 400), no al escribir. Default no-op. */
    default void validateConfiguration(Map<String, Object> configuration) {
        // no-op por defecto
    }
}
