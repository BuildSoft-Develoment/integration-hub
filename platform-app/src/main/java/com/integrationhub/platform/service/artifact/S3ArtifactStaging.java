package com.integrationhub.platform.service.artifact;

import com.integrationhub.platform.task.ArtifactReference;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;

/**
 * Proyecto #3, Fase 2 — impl S3/MinIO de {@link ArtifactStaging}.
 *
 * <p>Aplica los refinamientos del doble-check:
 * <ul>
 *   <li><b>#1</b> el {@link S3Presigner} es un builder SEPARADO → se construye con el MISMO
 *       {@code endpointOverride} + path-style que el cliente (si no, presignaría contra AWS real, no MinIO);</li>
 *   <li><b>#2</b> NO se firma {@code Content-Type} en el PUT (el {@code PutObjectRequest} no lo fija) → un PUT HTTP
 *       plano (con o sin Content-Type) no rompe la firma ({@code SignatureDoesNotMatch});</li>
 *   <li><b>#3</b> {@code openAndDeleteOnClose} borra el objeto en el {@code close()} del stream (delete-on-close).</li>
 * </ul>
 * Reusa el patrón de credenciales/endpoint de {@code S3SourceProvider}. Las credenciales son de la PLATAFORMA (firman
 * la URL); el plugin solo recibe la URL presignada (un objeto, un método, expiración corta).</p>
 */
public class S3ArtifactStaging implements ArtifactStaging {

    /** Prefijo de las keys de staging (facilita una lifecycle-expiry por prefijo en el bucket). */
    public static final String STAGING_PREFIX = "remote-plugin-staging/";

    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;

    public S3ArtifactStaging(S3StagingConfig config) {
        this.bucket = config.bucket();
        // Mismo modelo de credenciales que S3SourceProvider: si hay access-key configurada (MinIO/dev, o AWS con creds
        // explícitas de Vault) se firma con StaticCredentialsProvider; si no, se usa la cadena por defecto
        // (DefaultCredentialsProvider) → IAM roles/instance-profile en AWS real, sin exigir creds estáticas en config.
        AwsCredentialsProvider credentials =
                config.accessKeyId() == null || config.accessKeyId().isBlank()
                        ? DefaultCredentialsProvider.create()
                        : StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(config.accessKeyId(), config.secretAccessKey()));
        var region = Region.of(config.region());

        var clientBuilder = S3Client.builder()
                .region(region)
                .httpClient(UrlConnectionHttpClient.create())
                .credentialsProvider(credentials);
        var presignerBuilder = S3Presigner.builder()
                .region(region)
                .credentialsProvider(credentials);

        if (config.endpoint() != null && !config.endpoint().isBlank()) {
            var uri = URI.create(config.endpoint());
            clientBuilder.endpointOverride(uri);
            presignerBuilder.endpointOverride(uri); // #1: el presigner necesita su propio endpoint
        }
        if (config.pathStyleAccess()) {
            var serviceConfig = S3Configuration.builder().pathStyleAccessEnabled(true).build();
            clientBuilder.serviceConfiguration(serviceConfig);
            presignerBuilder.serviceConfiguration(serviceConfig);
        }
        this.s3 = clientBuilder.build();
        this.presigner = presignerBuilder.build();
    }

    @Override
    public StagedUpload presignUpload(String mediaType, Duration ttl) {
        var key = STAGING_PREFIX + UUID.randomUUID();
        // #2: NO se fija contentType en el PutObjectRequest -> no se firma -> el PUT plano del plugin no rompe la firma.
        var putRequest = PutObjectRequest.builder().bucket(bucket).key(key).build();
        var presigned = presigner.presignPutObject(PutObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .putObjectRequest(putRequest)
                .build());
        var reference = ArtifactReference.put(
                presigned.url().toString(),
                mediaType == null ? "" : mediaType,
                System.currentTimeMillis() + ttl.toMillis());
        return new StagedUpload(reference, key);
    }

    @Override
    public StagedDownload stageForDownload(InputStream content, String mediaType, long sizeBytes, Duration ttl)
            throws IOException {
        var key = STAGING_PREFIX + UUID.randomUUID();
        var putRequest = PutObjectRequest.builder().bucket(bucket).key(key);
        if (mediaType != null && !mediaType.isBlank()) {
            putRequest.contentType(mediaType);
        }
        try (content) {
            if (sizeBytes > 0) {
                // Upload por streaming: no materializa el archivo en la plataforma.
                s3.putObject(putRequest.build(), RequestBody.fromInputStream(content, sizeBytes));
            } else {
                // Fallback tamaño desconocido: materializa (raro; el SelectedSourceFile suele traer size).
                s3.putObject(putRequest.build(), RequestBody.fromBytes(content.readAllBytes()));
            }
        }
        var presigned = presigner.presignGetObject(GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build())
                .build());
        var reference = ArtifactReference.get(
                presigned.url().toString(),
                mediaType == null ? "" : mediaType,
                Math.max(0, sizeBytes),
                System.currentTimeMillis() + ttl.toMillis());
        return new StagedDownload(reference, key);
    }

    @Override
    public void deleteStaged(String key) {
        s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    @Override
    public InputStream openAndDeleteOnClose(String key) {
        InputStream object = s3.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build());
        // #3: delete-on-close -> el objeto se borra cuando el reader terminó de consumir el stream, no antes.
        return new FilterInputStream(object) {
            @Override
            public void close() throws IOException {
                try {
                    super.close();
                } finally {
                    s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
                }
            }
        };
    }
}
