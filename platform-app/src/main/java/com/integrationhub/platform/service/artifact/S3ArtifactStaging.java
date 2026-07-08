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
 * S3/MinIO implementation for remote plugin artifact staging.
 *
 * <p>The platform owns the object-store credentials and only exposes short-lived presigned URLs to plugins. Uploads
 * from platform to staging require a known content length so the SDK can stream without buffering the whole artifact.
 */
public class S3ArtifactStaging implements ArtifactStaging {

    public static final String STAGING_PREFIX = "remote-plugin-staging/";

    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;

    public S3ArtifactStaging(S3StagingConfig config) {
        this.bucket = config.bucket();
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
            presignerBuilder.endpointOverride(uri);
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
        if (sizeBytes < 0) {
            throw new IOException("artifact staging requires a known content length for remote reader downloads");
        }

        var key = STAGING_PREFIX + UUID.randomUUID();
        var putRequest = PutObjectRequest.builder().bucket(bucket).key(key);
        if (mediaType != null && !mediaType.isBlank()) {
            putRequest.contentType(mediaType);
        }
        try (content) {
            s3.putObject(putRequest.build(), RequestBody.fromInputStream(content, sizeBytes));
        }
        var presigned = presigner.presignGetObject(GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build())
                .build());
        var reference = ArtifactReference.get(
                presigned.url().toString(),
                mediaType == null ? "" : mediaType,
                sizeBytes,
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
