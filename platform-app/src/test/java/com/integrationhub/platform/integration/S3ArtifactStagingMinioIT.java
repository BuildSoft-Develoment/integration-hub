package com.integrationhub.platform.integration;

import com.integrationhub.platform.service.artifact.S3ArtifactStaging;
import com.integrationhub.platform.service.artifact.S3StagingConfig;
import com.integrationhub.platform.task.ArtifactReference;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Proyecto #3, Fase 2 — VERIFICACIÓN CRÍTICA (leyenda de #4): antes de construir el resto, se prueba end-to-end contra
 * un <b>MinIO real</b> (Testcontainers) que:
 * <ol>
 *   <li>el {@link S3ArtifactStaging} presigna un PUT contra el endpoint MinIO (no AWS) — refinamiento #1;</li>
 *   <li>un PUT HTTP <b>plano</b> a esa URL sube los bytes sin romper la firma — refinamiento #2 (el gotcha);</li>
 *   <li>{@code openAndDeleteOnClose} lee por streaming y BORRA en el close — refinamiento #3.</li>
 * </ol>
 * Si esto no pasara, {@code artifactRef} sería una integración asumida que falla en runtime.
 */
class S3ArtifactStagingMinioIT {

    private static final String ACCESS_KEY = "minioadmin";
    private static final String SECRET_KEY = "minioadmin";
    private static final String BUCKET = "staging";
    private static final String REGION = "us-east-1";

    @SuppressWarnings("resource")
    private static final GenericContainer<?> MINIO =
            new GenericContainer<>(DockerImageName.parse("minio/minio:RELEASE.2024-01-16T16-07-38Z"))
                    .withEnv("MINIO_ROOT_USER", ACCESS_KEY)
                    .withEnv("MINIO_ROOT_PASSWORD", SECRET_KEY)
                    .withCommand("server", "/data")
                    .withExposedPorts(9000)
                    .waitingFor(Wait.forHttp("/minio/health/ready").forPort(9000).withStartupTimeout(Duration.ofSeconds(60)));

    private static String endpoint;

    @BeforeAll
    static void startMinioAndBucket() {
        MINIO.start();
        endpoint = "http://" + MINIO.getHost() + ":" + MINIO.getMappedPort(9000);
        try (S3Client s3 = s3Client()) {
            s3.createBucket(CreateBucketRequest.builder().bucket(BUCKET).build());
        }
    }

    @AfterAll
    static void stopMinio() {
        MINIO.stop();
    }

    private static S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(REGION))
                .httpClient(UrlConnectionHttpClient.create())
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)))
                .endpointOverride(URI.create(endpoint))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    private static S3ArtifactStaging staging() {
        return new S3ArtifactStaging(new S3StagingConfig(BUCKET, REGION, endpoint, ACCESS_KEY, SECRET_KEY, true));
    }

    @Test
    void presignedPutThenStreamedReadBackThenDeleteOnClose() throws Exception {
        var staging = staging();
        var content = "id,amount\n42,4200\n".getBytes(StandardCharsets.UTF_8);

        // 1. La plataforma presigna un PUT (lo que iría en artifactRef para el plugin).
        var staged = staging.presignUpload("text/csv", Duration.ofMinutes(5));
        assertEquals(ArtifactReference.PUT, staged.reference().method());

        // 2. El plugin (simulado) sube por HTTP PLANO a la URL presignada (como hace ArtifactTransfer).
        var put = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create(staged.reference().uri()))
                        .PUT(HttpRequest.BodyPublishers.ofByteArray(content))
                        .header("Content-Type", "text/csv")
                        .build(),
                HttpResponse.BodyHandlers.discarding());
        assertEquals(2, put.statusCode() / 100, "el PUT presignado debe aceptar el subida (2xx), no SignatureDoesNotMatch");

        // 3. La plataforma lee por streaming; el close() borra el objeto.
        byte[] readBack;
        try (var stream = staging.openAndDeleteOnClose(staged.key())) {
            readBack = stream.readAllBytes();
        }
        assertArrayEquals(content, readBack);

        // 4. Tras el close, el objeto ya no existe (delete-on-close).
        try (S3Client s3 = s3Client()) {
            assertThrows(NoSuchKeyException.class, () -> s3.getObject(
                    GetObjectRequest.builder().bucket(BUCKET).key(staged.key()).build()));
        }
    }

    /**
     * Propiedad de SEGURIDAD (doble-check): la credencial efímera DEBE expirar. Se presigna con TTL de 1 s, se espera a
     * que venza, y el PUT debe ser rechazado (no-2xx). Sin esto, "corta vida" sería una afirmación hueca.
     */
    @Test
    void presignedUrlIsRejectedAfterItsTtlExpires() throws Exception {
        var staging = staging();
        var staged = staging.presignUpload("text/csv", Duration.ofSeconds(1));

        Thread.sleep(2_500);

        var put = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create(staged.reference().uri()))
                        .PUT(HttpRequest.BodyPublishers.ofByteArray("late".getBytes(StandardCharsets.UTF_8)))
                        .build(),
                HttpResponse.BodyHandlers.discarding());

        assertNotEquals(2, put.statusCode() / 100,
                "el PUT presignado debe ser rechazado tras vencer el TTL (credencial efimera); fue HTTP " + put.statusCode());
    }

    /**
     * Path de error (doble-check): si el plugin no subió el objeto, {@code openAndDeleteOnClose} falla claro
     * (NoSuchKey) — lo que la migración del source (fase 2b) traducirá a "source degradado".
     */
    @Test
    void openMissingObjectFailsWithNoSuchKey() {
        var staging = staging();
        assertThrows(NoSuchKeyException.class,
                () -> staging.openAndDeleteOnClose(S3ArtifactStaging.STAGING_PREFIX + "no-subido"));
    }
}
