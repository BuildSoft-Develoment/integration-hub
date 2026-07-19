package com.integrationhub.platform.spi.artifact;

/**
 * ADR-016: referencia serializable a un artefacto de archivo ya materializado por un {@link ArtifactStore}. Se publica
 * en el {@code summary} de una tarea de salida ({@code FILE_WRITE}/{@code FILE_COMPRESS}) para que la siguiente lo
 * consuma. {@code location} es opaca al pipeline: la interpreta el store que la creo (ruta local si LocalTemp,
 * bucket/key si S3). {@code store} identifica el tipo de store para re-resolverlo.
 */
public record StoredArtifact(String store, String name, String location, long size) {
}
