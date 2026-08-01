// @trace spec 001-catalogo-fuentes RF-006, RF-007, RF-008 (catalogo-fuentes: fuente cloud Google Cloud Storage) ADR-006
package com.integrationhub.platform.provider.source;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.channels.Channels;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fuente de almacenamiento de objetos Google Cloud Storage (GCS).
 *
 * <p>{@code selectFiles} lista objetos por {@code prefix} aplicando la regla de nombre y el
 * {@code selectionMode}; {@code openFile} descarga por <b>streaming</b> (ReadChannel →
 * {@code InputStream}). Credenciales: {@code adc} (Application Default Credentials / Workload
 * Identity) o {@code service-account-json} (referenciado via {@code ${secret:...}}). El cliente
 * {@link Storage} usa el transporte HTTP/JSON (lean-native) y se cachea por hash de config.
 * Ver ADR-006.</p>
 */
@ApplicationScoped
public class GcsSourceProvider implements SourceProvider {

    private final ConcurrentHashMap<String, Storage> clientCache = new ConcurrentHashMap<>();

    @Override
    public String type() {
        return "GCS";
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        String bucket = SourceConfigurationSupport.requireString(configuration, "bucket");
        String prefix = SourceConfigurationSupport.resolvePathTemplate(
                SourceConfigurationSupport.optionalString(configuration, "prefix", ""), configuration);
        SourceConfigurationSupport.FileNameRule fileNameRule = SourceConfigurationSupport.fileNameRule(configuration);
        String selectionMode = SourceConfigurationSupport.selectionMode(configuration);
        String mediaType = SourceConfigurationSupport.optionalString(configuration, "mediaType", null);

        Storage storage = resolveStorage(configuration);

        if (fileNameRule == null) {
            String key = prefix;
            String fileName = objectName(key);
            if (fileName.isBlank()) {
                throw new IllegalStateException("GCS source requires 'fileNameTemplate' when 'prefix' is a folder");
            }
            return List.of(new SelectedSourceFile(fileName, key, SourceConfigurationSupport.detectMediaType(fileName, mediaType), null, null));
        }

        List<Blob> matches = new ArrayList<>();
        storage.list(bucket, Storage.BlobListOption.prefix(prefix)).iterateAll().forEach(blob -> {
            String fileName = objectName(blob.getName());
            if (!fileName.isBlank() && fileNameRule.matches(fileName)) {
                matches.add(blob);
            }
        });
        matches.sort(Comparator.comparing(this::updatedInstant));

        if (matches.isEmpty()) {
            throw new IllegalStateException("No GCS objects match selector " + fileNameRule.description()
                    + " in gs://" + bucket + "/" + prefix);
        }
        if ("single".equalsIgnoreCase(selectionMode)) {
            if (matches.size() != 1) {
                throw new IllegalStateException("Expected exactly one GCS object for selector " + fileNameRule.description()
                        + " in gs://" + bucket + "/" + prefix + " but found " + matches.size());
            }
            return List.of(toSelectedFile(matches.getFirst(), mediaType));
        }
        if ("all".equalsIgnoreCase(selectionMode)) {
            return matches.stream().map(blob -> toSelectedFile(blob, mediaType)).toList();
        }
        return List.of(toSelectedFile(matches.getLast(), mediaType));
    }

    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        String bucket = SourceConfigurationSupport.requireString(configuration, "bucket");
        Storage storage = resolveStorage(configuration);
        BlobId blobId = BlobId.of(bucket, selectedFile.location());
        // Streaming: el supplier abre un ReadChannel perezosamente; el caller cierra el stream.
        return new SourcePayload(selectedFile, () -> Channels.newInputStream(storage.reader(blobId)));
    }

    private SelectedSourceFile toSelectedFile(Blob blob, String configuredMediaType) {
        String fileName = objectName(blob.getName());
        return new SelectedSourceFile(
                fileName,
                blob.getName(),
                SourceConfigurationSupport.detectMediaType(fileName, configuredMediaType),
                blob.getSize() == null || blob.getSize() <= 0 ? null : blob.getSize(),
                updatedInstant(blob)
        );
    }

    private Instant updatedInstant(Blob blob) {
        return blob.getUpdateTimeOffsetDateTime() == null ? Instant.EPOCH : blob.getUpdateTimeOffsetDateTime().toInstant();
    }

    private String objectName(String key) {
        if (key == null) {
            return "";
        }
        String normalized = key.endsWith("/") ? key.substring(0, key.length() - 1) : key;
        return normalized.contains("/") ? normalized.substring(normalized.lastIndexOf('/') + 1) : normalized;
    }

    private Storage resolveStorage(Map<String, Object> configuration) {
        String authMode = SourceConfigurationSupport.optionalString(configuration, "authMode", "adc");
        String projectId = SourceConfigurationSupport.optionalString(configuration, "projectId", "");
        String serviceAccountJson = SourceConfigurationSupport.optionalString(configuration, "serviceAccountJson", "");
        String cacheKey = String.join("|", authMode, projectId,
                Integer.toHexString(serviceAccountJson.hashCode()));
        return clientCache.computeIfAbsent(cacheKey, key -> buildStorage(authMode, projectId, serviceAccountJson));
    }

    private Storage buildStorage(String authMode, String projectId, String serviceAccountJson) {
        StorageOptions.Builder builder = StorageOptions.newBuilder();
        if (!projectId.isBlank()) {
            builder.setProjectId(projectId);
        }
        if ("service-account-json".equalsIgnoreCase(authMode)) {
            if (serviceAccountJson.isBlank()) {
                throw new IllegalArgumentException("GCS authMode 'service-account-json' requires 'serviceAccountJson'");
            }
            try {
                builder.setCredentials(GoogleCredentials.fromStream(
                        new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8))));
            } catch (IOException e) {
                throw new IllegalStateException("Cannot read GCS service account credentials", e);
            }
        }
        // adc: sin setCredentials -> Application Default Credentials / Workload Identity
        return builder.build().getService();
    }
}
