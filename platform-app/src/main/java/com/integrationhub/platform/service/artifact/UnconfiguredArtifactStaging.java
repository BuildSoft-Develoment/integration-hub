package com.integrationhub.platform.service.artifact;

import java.io.InputStream;
import java.time.Duration;

/**
 * Null-object de {@link ArtifactStaging} cuando el staging S3/MinIO NO está configurado. Permite que el app arranque
 * sin staging; cualquier uso (source remoto por referencia) **falla-fast** con un mensaje accionable en vez de un NPE.
 */
public class UnconfiguredArtifactStaging implements ArtifactStaging {

    private static final String MESSAGE =
            "staging de artefactos S3/MinIO no configurado: define integrationhub.plugin.remote.staging.bucket "
                    + "(+ endpoint/credenciales) para usar sources/readers remotos por referencia";

    @Override
    public StagedUpload presignUpload(String mediaType, Duration ttl) {
        throw new IllegalStateException(MESSAGE);
    }

    @Override
    public InputStream openAndDeleteOnClose(String key) {
        throw new IllegalStateException(MESSAGE);
    }
}
