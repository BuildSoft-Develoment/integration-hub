package com.integrationhub.platform.spi.task.sink;

import com.integrationhub.platform.spi.config.PluginConfigSchema;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

/**
 * ADR-016: sink de salida (espejo read-only de {@code SourceProvider}, pero para ESCRIBIR). Entrega un artefacto
 * (streaming) a un destino externo (Filesystem/SFTP/S3/FTP...). Reutiliza la config de conexion de una definicion
 * {@code /sources} (host/credenciales) y la op de escritura (drop path + rename atomico). <b>Streaming obligatorio</b>
 * (nunca el archivo completo en memoria — a diferencia del {@code SftpPaymentTransport} de pagos, que usa byte[]).
 */
public interface OutputSink {

    /** Tipo de transporte de salida: {@code "FILESYSTEM"}, {@code "SFTP"}, ... (case-insensitive). */
    String type();

    /**
     * Entrega el contenido de {@code source} al {@code dropPath} destino usando la {@code configuration} de conexion.
     * Debe hacer upload-con-temporal-y-rename donde el transporte lo permita (visibilidad atomica del archivo final).
     * {@code source} se puede re-abrir (para reintentos); el sink cierra cada stream que abre.
     */
    void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException;

    /** Config dirigida por schema (opt-in). */
    default PluginConfigSchema configSchema() {
        return PluginConfigSchema.empty();
    }

    /** Fuente re-abrible del artefacto a entregar (p. ej. {@code () -> artifactStore.open(artifact)}). */
    @FunctionalInterface
    interface StreamSource {
        InputStream open() throws IOException;
    }
}
