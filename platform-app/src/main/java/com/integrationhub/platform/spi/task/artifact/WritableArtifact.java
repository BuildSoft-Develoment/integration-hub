package com.integrationhub.platform.spi.task.artifact;

import java.io.Closeable;
import java.io.IOException;
import java.io.OutputStream;

/**
 * ADR-016: artefacto en construccion devuelto por {@link ArtifactStore#create}. El caller escribe streaming al
 * {@link #outputStream()} y llama {@link #finish()} para sellarlo (devuelve la referencia con tamano). Pensado para
 * try-with-resources: si se cierra SIN {@code finish()} (por una excepcion a mitad), el store borra el parcial
 * (mismo patron que {@code TempFileSourcePayload}).
 */
public interface WritableArtifact extends Closeable {

    /** Stream de escritura del artefacto (no cerrar directamente; lo cierra {@link #finish()}/{@link #close()}). */
    OutputStream outputStream();

    /** Sella el artefacto: hace flush/close del stream y devuelve su referencia (con {@code size}). */
    StoredArtifact finish() throws IOException;
}
