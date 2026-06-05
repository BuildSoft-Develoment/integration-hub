// @trace RF-006, RF-007, RF-008 (catalogo-fuentes: fuente cloud AWS S3) ADR-006
package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fuente de almacenamiento de objetos AWS S3 (o compatible via {@code endpoint}, p.ej. MinIO).
 *
 * <p>{@code selectFiles} lista objetos por {@code prefix} (ListObjectsV2) aplicando la regla de
 * nombre y el {@code selectionMode}; {@code openFile} descarga por <b>streaming</b> (GetObject →
 * {@code ResponseInputStream}) sin cargar el objeto en memoria. Credenciales: {@code default}
 * (cadena nativa: IAM role/instance-profile/env) o {@code access-key}. Cliente HTTP
 * {@code url-connection-client} (lean-native). El {@link S3Client} se cachea por hash de config.
 * Ver ADR-006.</p>
 */
@ApplicationScoped
public class S3SourceProvider implements SourceProvider {

    private final ConcurrentHashMap<String, S3Client> clientCache = new ConcurrentHashMap<>();

    @Override
    public String type() {
        return "S3";
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        String bucket = SourceConfigurationSupport.requireString(configuration, "bucket");
        String prefix = SourceConfigurationSupport.resolvePathTemplate(
                SourceConfigurationSupport.optionalString(configuration, "prefix", ""), configuration);
        SourceConfigurationSupport.FileNameRule fileNameRule = SourceConfigurationSupport.fileNameRule(configuration);
        String selectionMode = SourceConfigurationSupport.selectionMode(configuration);
        String mediaType = SourceConfigurationSupport.optionalString(configuration, "mediaType", null);

        S3Client client = resolveClient(configuration);

        if (fileNameRule == null) {
            String key = prefix;
            String fileName = key.contains("/") ? key.substring(key.lastIndexOf('/') + 1) : key;
            if (fileName.isBlank()) {
                throw new IllegalStateException("S3 source requires 'fileNameTemplate' when 'prefix' is a folder");
            }
            return List.of(new SelectedSourceFile(fileName, key, SourceConfigurationSupport.detectMediaType(fileName, mediaType), null, null));
        }

        List<S3Object> matches = new ArrayList<>();
        client.listObjectsV2Paginator(ListObjectsV2Request.builder().bucket(bucket).prefix(prefix).build())
                .contents()
                .forEach(object -> {
                    String fileName = objectName(object.key());
                    if (!fileName.isBlank() && fileNameRule.matches(fileName)) {
                        matches.add(object);
                    }
                });
        matches.sort(Comparator.comparing(object -> object.lastModified() == null ? Instant.EPOCH : object.lastModified()));

        if (matches.isEmpty()) {
            throw new IllegalStateException("No S3 objects match selector " + fileNameRule.description()
                    + " in s3://" + bucket + "/" + prefix);
        }
        if ("single".equalsIgnoreCase(selectionMode)) {
            if (matches.size() != 1) {
                throw new IllegalStateException("Expected exactly one S3 object for selector " + fileNameRule.description()
                        + " in s3://" + bucket + "/" + prefix + " but found " + matches.size());
            }
            return List.of(toSelectedFile(matches.getFirst(), mediaType));
        }
        if ("all".equalsIgnoreCase(selectionMode)) {
            return matches.stream().map(object -> toSelectedFile(object, mediaType)).toList();
        }
        return List.of(toSelectedFile(matches.getLast(), mediaType));
    }

    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        String bucket = SourceConfigurationSupport.requireString(configuration, "bucket");
        S3Client client = resolveClient(configuration);
        GetObjectRequest request = GetObjectRequest.builder().bucket(bucket).key(selectedFile.location()).build();
        // Streaming: el supplier abre el GetObject de forma perezosa; el caller cierra el stream.
        return new SourcePayload(selectedFile, () -> client.getObject(request));
    }

    private SelectedSourceFile toSelectedFile(S3Object object, String configuredMediaType) {
        String fileName = objectName(object.key());
        return new SelectedSourceFile(
                fileName,
                object.key(),
                SourceConfigurationSupport.detectMediaType(fileName, configuredMediaType),
                object.size() == null || object.size() <= 0 ? null : object.size(),
                object.lastModified()
        );
    }

    private String objectName(String key) {
        if (key == null) {
            return "";
        }
        String normalized = key.endsWith("/") ? key.substring(0, key.length() - 1) : key;
        return normalized.contains("/") ? normalized.substring(normalized.lastIndexOf('/') + 1) : normalized;
    }

    private S3Client resolveClient(Map<String, Object> configuration) {
        String region = SourceConfigurationSupport.requireString(configuration, "region");
        String authMode = SourceConfigurationSupport.optionalString(configuration, "authMode", "default");
        String accessKeyId = SourceConfigurationSupport.optionalString(configuration, "accessKeyId", "");
        String endpoint = SourceConfigurationSupport.optionalString(configuration, "endpoint", "");
        boolean pathStyleAccess = SourceConfigurationSupport.optionalBoolean(configuration, "pathStyleAccess", false);
        String cacheKey = String.join("|", region, authMode, accessKeyId, endpoint, String.valueOf(pathStyleAccess));

        return clientCache.computeIfAbsent(cacheKey, key -> buildClient(configuration, region, authMode, endpoint, pathStyleAccess));
    }

    private S3Client buildClient(Map<String, Object> configuration, String region, String authMode,
            String endpoint, boolean pathStyleAccess) {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .httpClient(UrlConnectionHttpClient.create())
                .credentialsProvider(credentialsProvider(configuration, authMode));

        if (!endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }
        if (pathStyleAccess) {
            builder.serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        }
        return builder.build();
    }

    private AwsCredentialsProvider credentialsProvider(Map<String, Object> configuration, String authMode) {
        return switch (authMode == null ? "default" : authMode.toLowerCase()) {
            case "access-key" -> StaticCredentialsProvider.create(AwsBasicCredentials.create(
                    SourceConfigurationSupport.requireString(configuration, "accessKeyId"),
                    SourceConfigurationSupport.requireString(configuration, "secretAccessKey")));
            case "assume-role" -> throw new IllegalArgumentException(
                    "S3 authMode 'assume-role' aun no soportado en backend; usa 'default' o 'access-key' (ADR-006, pendiente STS)");
            default -> DefaultCredentialsProvider.create();
        };
    }
}
