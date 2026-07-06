package com.integrationhub.platform.integration;

import com.integrationhub.platform.provider.source.RemoteSourceProvider;
import com.integrationhub.platform.service.artifact.S3ArtifactStaging;
import com.integrationhub.platform.service.artifact.S3StagingConfig;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.ArtifactReference;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Proyecto #3, Fase 2b — E2E: {@link RemoteSourceProvider} real + {@link S3ArtifactStaging} real + <b>MinIO real</b>. Un
 * invoker-stub juega el rol del plugin (lee la {@code artifactRef} del payload y SUBE por la URL presignada, como haría
 * el SDK); la plataforma lee el archivo por streaming del staging y lo borra al cerrar. Sin extender el sidecar (el
 * patrón invoker-stub del análisis 2b).
 */
class RemoteSourceArtifactRefMinioIT {

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
    static void startMinio() {
        MINIO.start();
        endpoint = "http://" + MINIO.getHost() + ":" + MINIO.getMappedPort(9000);
        try (S3Client s3 = S3Client.builder()
                .region(Region.of(REGION))
                .httpClient(UrlConnectionHttpClient.create())
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)))
                .endpointOverride(URI.create(endpoint))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build()) {
            s3.createBucket(CreateBucketRequest.builder().bucket(BUCKET).build());
        }
    }

    @AfterAll
    static void stopMinio() {
        MINIO.stop();
    }

    @Test
    void openFileUploadsViaPresignedUrlAndStreamsFromStaging() throws Exception {
        var staging = new S3ArtifactStaging(new S3StagingConfig(BUCKET, REGION, endpoint, ACCESS_KEY, SECRET_KEY, true));
        var content = ("id,amount\n" + "9,900\n".repeat(1000)).getBytes(StandardCharsets.UTF_8);

        var descriptor = new RemotePluginDescriptor(
                "acme-source", "1.0.0", "2", // spiVersion 2 -> soporta artifactRef
                Set.of(), Set.of("REMOTE_FS"), Set.of(), "GRPC", endpoint, true);

        // Invoker-stub = el plugin: en OPEN lee la artifactRef y SUBE por HTTP a la URL presignada.
        RemotePluginInvoker invoker = (desc, taskType, context, payload) -> {
            if (taskType.startsWith("SOURCE_SELECT")) {
                return TaskResult.success("selected", Map.of("files", java.util.List.of(Map.of(
                        "name", "big.csv", "location", "remote://big.csv", "mediaType", "text/csv", "size", content.length))));
            }
            try {
                @SuppressWarnings("unchecked")
                var refMap = (Map<String, Object>) payload.get(ArtifactReference.ARTIFACT_REF);
                var reference = ArtifactReference.fromMap(refMap);
                var put = HttpClient.newHttpClient().send(
                        HttpRequest.newBuilder(URI.create(reference.uri()))
                                .PUT(HttpRequest.BodyPublishers.ofByteArray(content)).build(),
                        HttpResponse.BodyHandlers.discarding());
                if (put.statusCode() / 100 != 2) {
                    return TaskResult.failure("subida fallida HTTP " + put.statusCode(), Map.of());
                }
            } catch (Exception error) {
                return TaskResult.failure(error.getMessage(), Map.of());
            }
            return TaskResult.success("opened", Map.of("mediaType", "text/csv"));
        };

        var provider = new RemoteSourceProvider("REMOTE_FS", descriptor, invoker, new RemotePluginRegistry(), staging);
        var files = provider.selectFiles(Map.of());
        var payload = provider.openFile(files.getFirst(), Map.of());

        try (var stream = payload.openStream()) {
            assertEquals(new String(content, StandardCharsets.UTF_8),
                    new String(stream.readAllBytes(), StandardCharsets.UTF_8),
                    "la plataforma lee por streaming del staging exactamente lo que el plugin subio");
        }
    }
}
