package com.integrationhub.platform.spi.task.writer;

import com.integrationhub.platform.spi.reader.ReadRecord;

import java.io.Closeable;
import java.io.IOException;
import java.util.List;

/**
 * ADR-016: sesion de escritura streaming abierta por un {@link FileFormatWriter}. El orden de uso es:
 * {@link #writeHeader} (una vez, opcional) -&gt; {@link #writeDetail} (N veces, streaming) -&gt; {@link #writeTrailer}
 * (una vez, opcional) -&gt; {@link #close} (flush). Ninguna operacion carga todo el archivo en memoria.
 */
public interface FileWriteSession extends Closeable {

    /**
     * Escribe la fila de cabecera con las celdas YA RESUELTAS por la tarea (constantes, metadata, agregados). Se llama
     * una sola vez, antes del detalle. Si no hay cabecera configurada, no se llama.
     */
    void writeHeader(List<Object> headerCells) throws IOException;

    /** Anexa un lote de registros de detalle. Se puede llamar muchas veces (una por pagina/lote). */
    void writeDetail(List<ReadRecord> batch) throws IOException;

    /** Escribe la fila de trailer con celdas YA RESUELTAS (p. ej. count/sum acumulados). Una sola vez, al final. */
    void writeTrailer(List<Object> trailerCells) throws IOException;
}
