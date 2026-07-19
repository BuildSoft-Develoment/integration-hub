package com.integrationhub.platform.spi.compress;

import com.integrationhub.platform.spi.config.PluginConfigSchema;

import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

/**
 * ADR-016: compresor de archivos (familia resuelta por {@code algorithm}). Comprime N entradas a un {@code target}
 * de forma <b>streaming</b> (una entrada a la vez, sin materializar en heap). Lo usa la tarea {@code FILE_COMPRESS}.
 * ZIP soporta multiples entradas + AES; GZIP una sola sin cifrado.
 */
public interface FileCompressor {

    /** Algoritmo: {@code "ZIP"}, {@code "GZIP"}, ... (case-insensitive). */
    String algorithm();

    /** ZIP=true (bundlea N); GZIP=false (un solo archivo). */
    boolean supportsMultipleEntries();

    /** ZIP=true (AES-256); GZIP=false. */
    boolean supportsEncryption();

    /**
     * Comprime {@code entries} al {@code target} (streaming). Devuelve el numero de entradas escritas. NO cierra
     * {@code target} salvo lo que el propio stream de compresion cierre; el dueno del stream (el artefacto) lo maneja.
     */
    long compress(List<CompressionEntry> entries, OutputStream target, CompressionOptions options) throws IOException;

    /** Config dirigida por schema (opt-in). */
    default PluginConfigSchema configSchema() {
        return PluginConfigSchema.empty();
    }
}
