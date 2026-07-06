package com.integrationhub.platform.service.artifact;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;

/**
 * Proyecto #3, Fase 2b — produce el {@link ArtifactStaging} desde config. Si el bucket no está configurado, produce un
 * {@link UnconfiguredArtifactStaging} (null-object) para que el app arranque igual y el source remoto por referencia
 * falle-fast con un mensaje claro al usarse.
 *
 * <p>Las credenciales se leen de config como cualquier secreto ({@code ${secret:...}} re-resuelto de Vault, según la
 * directiva permanente — no se persisten).</p>
 */
@ApplicationScoped
public class ArtifactStagingProducer {

    @Produces
    @ApplicationScoped
    public ArtifactStaging artifactStaging(
            @ConfigProperty(name = "integrationhub.plugin.remote.staging.bucket") Optional<String> bucket,
            @ConfigProperty(name = "integrationhub.plugin.remote.staging.region", defaultValue = "us-east-1") String region,
            @ConfigProperty(name = "integrationhub.plugin.remote.staging.endpoint", defaultValue = "") String endpoint,
            @ConfigProperty(name = "integrationhub.plugin.remote.staging.access-key-id", defaultValue = "") String accessKeyId,
            @ConfigProperty(name = "integrationhub.plugin.remote.staging.secret-access-key", defaultValue = "") String secretAccessKey,
            @ConfigProperty(name = "integrationhub.plugin.remote.staging.path-style-access", defaultValue = "false") boolean pathStyleAccess) {

        if (bucket.isEmpty() || bucket.get().isBlank()) {
            return new UnconfiguredArtifactStaging();
        }
        return new S3ArtifactStaging(new S3StagingConfig(
                bucket.get(), region, endpoint, accessKeyId, secretAccessKey, pathStyleAccess));
    }
}
