package com.integrationhub.platform.service.artifact;

import com.integrationhub.platform.task.ArtifactReference;

/**
 * Resultado de presignar una subida: la {@link ArtifactReference} (PUT) que se pasa al plugin, y la {@code key}
 * interna con la que la plataforma lee/limpia el objeto tras la subida.
 */
public record StagedUpload(ArtifactReference reference, String key) {
}
