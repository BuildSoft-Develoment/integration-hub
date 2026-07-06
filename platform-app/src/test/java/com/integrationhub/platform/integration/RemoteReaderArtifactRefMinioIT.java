package com.integrationhub.platform.integration;

import com.integrationhub.platform.provider.reader.RemoteReaderProvider;
import com.integrationhub.platform.service.artifact.S3ArtifactStaging;
import com.integrationhub.platform.service.artifact.S3StagingConfig;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.source.SourcePayload;
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
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Proyecto #3, Fase 3a — E2E del reader por referencia: la plataforma STAGEA el input (upload por streaming) y presigna
 * un GET; un invoker-stub (plugin) lo DESCARGA por la URL presignada y devuelve records. Valida el {@code presignGetObject}
 * nuevo contra MinIO real y el cleanup del input staged tras el READ.
 */
class RemoteReaderArtifactRefMinioIT {

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
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)))
                .endpointOverride(URI.create(endpoint))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    @Test
    void readerStagesInputAndPluginDownloadsViaPresignedGet() throws Exception {
        var staging = new S3ArtifactStaging(new S3StagingConfig(BUCKET, REGION, endpoint, ACCESS_KEY, SECRET_KEY, true));
        var input = ("id,name\n" + "1,Ada\n2,Grace\n").getBytes(StandardCharsets.UTF_8);
        var descriptor = new RemotePluginDescriptor(
                "acme-reader", "1.0.0", "2", Set.of(), Set.of(), Set.of("REMOTE_CSV"), "GRPC", endpoint, true);

        // Invoker-stub = el plugin: DESCARGA el input por la URL GET presignada y devuelve records.
        RemotePluginInvoker invoker = (desc, taskType, context, payload) -> {
            try {
                @SuppressWarnings("unchecked")
                var refMap = (Map<String, Object>) payload.get(ArtifactReference.ARTIFACT_REF);
                var reference = ArtifactReference.fromMap(refMap);
                var download = HttpClient.newHttpClient().send(
                        HttpRequest.newBuilder(URI.create(reference.uri())).GET().build(),
                        HttpResponse.BodyHandlers.ofByteArray());
                if (download.statusCode() / 100 != 2) {
                    return TaskResult.failure("descarga fallida HTTP " + download.statusCode(), Map.of());
                }
                assertArrayEquals(input, download.body(), "el plugin descarga por streaming el input staged");
                var lines = new String(download.body(), StandardCharsets.UTF_8).split("\n");
                return TaskResult.success("read", Map.of("records",
                        List.of(Map.of("row", lines[1]), Map.of("row", lines[2]))));
            } catch (Exception error) {
                return TaskResult.failure(error.getMessage(), Map.of());
            }
        };

        var provider = new RemoteReaderProvider("REMOTE_CSV", descriptor, invoker, new RemotePluginRegistry(), staging);
        var payload = SourcePayload.fromBytes("clientes.csv", input, "text/csv");

        var result = provider.readInBatches(payload, Map.of(), 10, batch -> { });

        assertEquals(2, result.recordCount());
        assertEquals(0, countStagingObjects(), "el input staged se limpia tras el READ (deleteStaged)");
    }

    @Test
    void cleansUpStagedInputEvenWhenTheReadFails() {
        var staging = new S3ArtifactStaging(new S3StagingConfig(BUCKET, REGION, endpoint, ACCESS_KEY, SECRET_KEY, true));
        var descriptor = new RemotePluginDescriptor(
                "acme-reader", "1.0.0", "2", Set.of(), Set.of(), Set.of("REMOTE_CSV"), "GRPC", endpoint, true);
        // El plugin FALLA el READ (tras stagearse el input).
        RemotePluginInvoker invoker = (desc, taskType, context, payload) -> TaskResult.failure("boom del plugin", Map.of());

        var provider = new RemoteReaderProvider("REMOTE_CSV", descriptor, invoker, new RemotePluginRegistry(), staging);
        var payload = SourcePayload.fromBytes("x.csv", "data".getBytes(StandardCharsets.UTF_8), "text/csv");

        assertThrows(IllegalStateException.class, () -> provider.readInBatches(payload, Map.of(), 10, batch -> { }));
        // El finally del readInBatches limpia el input aunque el READ falle -> sin leak.
        assertEquals(0, countStagingObjects(), "el input staged se limpia aun si el READ falla (no leak)");
    }

    private static int countStagingObjects() {
        try (S3Client s3 = s3Client()) {
            return s3.listObjectsV2(ListObjectsV2Request.builder()
                    .bucket(BUCKET).prefix(S3ArtifactStaging.STAGING_PREFIX).build()).keyCount();
        }
    }
}
