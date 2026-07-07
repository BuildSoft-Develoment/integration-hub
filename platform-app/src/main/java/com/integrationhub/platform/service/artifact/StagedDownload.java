package com.integrationhub.platform.service.artifact;

import com.integrationhub.platform.task.ArtifactReference;

/**
 * Resultado de stagear un archivo para que un plugin lo DESCARGUE (caso reader): la {@link ArtifactReference} (GET)
 * que se pasa al plugin, y la {@code key} interna con la que la plataforma limpia el objeto tras el READ.
 */
public record StagedDownload(ArtifactReference reference, String key) {
}
