package com.integrationhub.platform.service.artifact;

/**
 * Configuración del staging S3/MinIO. Se pasa por constructor a {@link S3ArtifactStaging} para que sea testeable con
 * los valores de un contenedor MinIO sin depender de CDI/@ConfigProperty.
 *
 * @param bucket          bucket de staging (con lifecycle-expiry recomendada como red de seguridad)
 * @param region          región (p.ej. {@code us-east-1}; MinIO ignora pero el SDK la exige)
 * @param endpoint        endpoint S3-compatible (p.ej. MinIO {@code http://host:9000}); vacío = AWS real
 * @param accessKeyId     credencial de la PLATAFORMA para firmar (no se entrega al plugin)
 * @param secretAccessKey credencial de la PLATAFORMA para firmar
 * @param pathStyleAccess {@code true} para MinIO (path-style)
 */
public record S3StagingConfig(
        String bucket,
        String region,
        String endpoint,
        String accessKeyId,
        String secretAccessKey,
        boolean pathStyleAccess) {
}
