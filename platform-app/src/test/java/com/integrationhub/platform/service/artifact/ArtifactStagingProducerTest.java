package com.integrationhub.platform.service.artifact;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;

/**
 * Proyecto #3 — el producer del {@link ArtifactStaging} elige la impl según config, y NO debe romper el arranque
 * cuando el staging no está (o está a medio) configurar.
 *
 * <p>Regresión del fix de boot: antes se usaba {@code @ConfigProperty(defaultValue = "")} en endpoint/creds, y SmallRye
 * trata el default de string vacío como "sin default" (propiedad requerida) → el app no arrancaba en ningún perfil sin
 * staging (test, y prod sin configurar). Ahora son {@code Optional<String>}; estos tests fijan el contrato.</p>
 */
class ArtifactStagingProducerTest {

    private final ArtifactStagingProducer producer = new ArtifactStagingProducer();

    @Test
    void producesNullObjectWhenBucketIsAbsent() {
        var staging = producer.artifactStaging(
                Optional.empty(), "us-east-1", Optional.empty(), Optional.empty(), Optional.empty(), false);

        assertInstanceOf(UnconfiguredArtifactStaging.class, staging,
                "sin bucket -> null-object; el app arranca y el remoto por referencia falla-fast al usarse");
    }

    @Test
    void producesNullObjectWhenBucketIsBlank() {
        var staging = producer.artifactStaging(
                Optional.of("   "), "us-east-1", Optional.of("http://localhost:9100"),
                Optional.of("k"), Optional.of("s"), true);

        assertInstanceOf(UnconfiguredArtifactStaging.class, staging, "bucket en blanco cuenta como no configurado");
    }

    @Test
    void producesS3StagingWhenBucketAndEndpointConfigured() {
        // MinIO/dev: bucket + endpoint + creds + path-style. Los builders del SDK son lazy (no hay red al construir).
        var staging = producer.artifactStaging(
                Optional.of("remote-plugin-staging"), "us-east-1", Optional.of("http://localhost:9100"),
                Optional.of("minioadmin"), Optional.of("minioadmin"), true);

        assertInstanceOf(S3ArtifactStaging.class, staging);
    }

    @Test
    void producesS3StagingForRealAwsWhenEndpointAndCredsAbsent() {
        // AWS real con IAM role/instance-profile: bucket configurado pero endpoint/creds AUSENTES (Optional.empty).
        // El doble-check destapó que S3ArtifactStaging hard-codeaba StaticCredentialsProvider y reventaba con
        // "Access key ID cannot be blank"; ahora usa DefaultCredentialsProvider (cadena por defecto) como
        // S3SourceProvider, así que construye sin creds estáticas. .orElse("") thread-ea el blank sin NPE.
        var staging = producer.artifactStaging(
                Optional.of("prod-bucket"), "us-east-1", Optional.empty(), Optional.empty(), Optional.empty(), false);

        assertInstanceOf(S3ArtifactStaging.class, staging);
    }
}
