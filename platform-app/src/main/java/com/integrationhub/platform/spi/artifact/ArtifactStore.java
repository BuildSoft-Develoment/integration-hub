package com.integrationhub.platform.spi.artifact;

import java.io.IOException;
import java.io.InputStream;

/**
 * ADR-016: casillero del handoff de archivos entre tareas de salida ({@code FILE_WRITE} -&gt; {@code FILE_COMPRESS} -&gt;
 * {@code FILE_DELIVER}). Dos implementaciones segun el modo de ejecucion:
 * <ul>
 *   <li>{@code LocalTempArtifactStore} (sync / mismo JVM): temp file local.</li>
 *   <li>{@code S3ArtifactStore} (async / multi-nodo, fase 2): objeto en un bucket compartido, para que un worker del
 *       broker en otro nodo pueda leer el artefacto que produjo otro.</li>
 * </ul>
 * Toda operacion es <b>streaming</b> (nunca el archivo completo en memoria).
 */
public interface ArtifactStore {

    /** Tipo del store: {@code "LOCAL_TEMP"}, {@code "S3"}, ... Se guarda en {@link StoredArtifact#store()}. */
    String type();

    /** Crea un artefacto de escritura con un nombre logico (p. ej. {@code export-123.csv}). */
    WritableArtifact create(String name) throws IOException;

    /** Abre para lectura un artefacto existente por su referencia (creada por ESTE store). */
    InputStream open(StoredArtifact artifact) throws IOException;

    /** Borra un artefacto (limpieza tras la entrega, o del parcial ante fallo). Idempotente. */
    void delete(StoredArtifact artifact) throws IOException;
}
