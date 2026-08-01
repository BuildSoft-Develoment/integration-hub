// @trace spec 001-catalogo-fuentes RF-006, RF-007, RF-008 (catalogo-fuentes: fuente cloud Azure Blob Storage) ADR-006
package com.integrationhub.platform.provider.source;

import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.ListBlobsOptions;
import com.azure.storage.common.StorageSharedKeyCredential;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fuente de almacenamiento de objetos Azure Blob Storage.
 *
 * <p>{@code selectFiles} lista blobs por {@code prefix} aplicando la regla de nombre y el
 * {@code selectionMode}; {@code openFile} descarga por <b>streaming</b>
 * ({@code BlobClient.openInputStream()}). Credenciales: {@code account-key},
 * {@code sas-token} o {@code connection-string} (referenciados via {@code ${secret:...}}).
 * {@code managed-identity} requiere {@code azure-identity} (pendiente, spike native). El cliente
 * de contenedor se cachea por hash de config. Ver ADR-006.</p>
 */
@ApplicationScoped
public class AzureBlobSourceProvider implements SourceProvider {

    private final ConcurrentHashMap<String, BlobContainerClient> clientCache = new ConcurrentHashMap<>();

    @Override
    public String type() {
        return "AZURE_BLOB";
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        String prefix = SourceConfigurationSupport.resolvePathTemplate(
                SourceConfigurationSupport.optionalString(configuration, "prefix", ""), configuration);
        SourceConfigurationSupport.FileNameRule fileNameRule = SourceConfigurationSupport.fileNameRule(configuration);
        String selectionMode = SourceConfigurationSupport.selectionMode(configuration);
        String mediaType = SourceConfigurationSupport.optionalString(configuration, "mediaType", null);

        BlobContainerClient containerClient = resolveContainerClient(configuration);

        if (fileNameRule == null) {
            String key = prefix;
            String fileName = objectName(key);
            if (fileName.isBlank()) {
                throw new IllegalStateException("Azure Blob source requires 'fileNameTemplate' when 'prefix' is a folder");
            }
            return List.of(new SelectedSourceFile(fileName, key, SourceConfigurationSupport.detectMediaType(fileName, mediaType), null, null));
        }

        List<BlobItem> matches = new ArrayList<>();
        containerClient.listBlobs(new ListBlobsOptions().setPrefix(prefix), null).forEach(item -> {
            String fileName = objectName(item.getName());
            if (!fileName.isBlank() && fileNameRule.matches(fileName)) {
                matches.add(item);
            }
        });
        matches.sort(Comparator.comparing(this::lastModifiedInstant));

        if (matches.isEmpty()) {
            throw new IllegalStateException("No Azure blobs match selector " + fileNameRule.description()
                    + " in container " + containerClient.getBlobContainerName() + " prefix " + prefix);
        }
        if ("single".equalsIgnoreCase(selectionMode)) {
            if (matches.size() != 1) {
                throw new IllegalStateException("Expected exactly one Azure blob for selector " + fileNameRule.description()
                        + " but found " + matches.size());
            }
            return List.of(toSelectedFile(matches.getFirst(), mediaType));
        }
        if ("all".equalsIgnoreCase(selectionMode)) {
            return matches.stream().map(item -> toSelectedFile(item, mediaType)).toList();
        }
        return List.of(toSelectedFile(matches.getLast(), mediaType));
    }

    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        BlobContainerClient containerClient = resolveContainerClient(configuration);
        // Streaming: openInputStream() descarga por bloques sin cargar todo en memoria.
        return new SourcePayload(selectedFile, () -> containerClient.getBlobClient(selectedFile.location()).openInputStream());
    }

    private SelectedSourceFile toSelectedFile(BlobItem item, String configuredMediaType) {
        String fileName = objectName(item.getName());
        Long size = item.getProperties() == null ? null : item.getProperties().getContentLength();
        return new SelectedSourceFile(
                fileName,
                item.getName(),
                SourceConfigurationSupport.detectMediaType(fileName, configuredMediaType),
                size == null || size <= 0 ? null : size,
                lastModifiedInstant(item)
        );
    }

    private Instant lastModifiedInstant(BlobItem item) {
        OffsetDateTime lastModified = item.getProperties() == null ? null : item.getProperties().getLastModified();
        return lastModified == null ? Instant.EPOCH : lastModified.toInstant();
    }

    private String objectName(String key) {
        if (key == null) {
            return "";
        }
        String normalized = key.endsWith("/") ? key.substring(0, key.length() - 1) : key;
        return normalized.contains("/") ? normalized.substring(normalized.lastIndexOf('/') + 1) : normalized;
    }

    private BlobContainerClient resolveContainerClient(Map<String, Object> configuration) {
        String accountName = SourceConfigurationSupport.optionalString(configuration, "accountName", "");
        String container = SourceConfigurationSupport.requireString(configuration, "container");
        String authMode = SourceConfigurationSupport.optionalString(configuration, "authMode", "account-key");
        String cacheKey = String.join("|", accountName, container, authMode,
                Integer.toHexString(SourceConfigurationSupport.optionalString(configuration, "endpoint", "").hashCode()));
        return clientCache.computeIfAbsent(cacheKey, key -> buildServiceClient(configuration, accountName, authMode)
                .getBlobContainerClient(container));
    }

    private BlobServiceClient buildServiceClient(Map<String, Object> configuration, String accountName, String authMode) {
        String endpoint = SourceConfigurationSupport.optionalString(configuration, "endpoint", "");
        String resolvedEndpoint = endpoint.isBlank() ? "https://" + accountName + ".blob.core.windows.net" : endpoint;
        BlobServiceClientBuilder builder = new BlobServiceClientBuilder();

        return switch (authMode == null ? "account-key" : authMode.toLowerCase()) {
            case "connection-string" ->
                builder.connectionString(SourceConfigurationSupport.requireString(configuration, "connectionString")).buildClient();
            case "sas-token" ->
                builder.endpoint(resolvedEndpoint)
                        .sasToken(SourceConfigurationSupport.requireString(configuration, "sasToken"))
                        .buildClient();
            case "managed-identity" -> throw new IllegalArgumentException(
                    "Azure authMode 'managed-identity' aun no soportado en backend; usa account-key/sas-token/connection-string (ADR-006, pendiente azure-identity)");
            default -> builder.endpoint(resolvedEndpoint)
                    .credential(new StorageSharedKeyCredential(
                            SourceConfigurationSupport.requireString(configuration, "accountName"),
                            SourceConfigurationSupport.requireString(configuration, "accountKey")))
                    .buildClient();
        };
    }
}
