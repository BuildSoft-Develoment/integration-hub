package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class RestSourceProvider implements SourceProvider {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Override
    public String type() {
        return "REST";
    }

    /** QA-006: campos que solo pueden persistirse como referencia ${secret:...}. */
    @Override
    public List<String> credentialKeys() {
        return List.of("password", "token");
    }

    @Override
    public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
        String url = SourceConfigurationSupport.requireString(configuration, "url");
        String mediaType = SourceConfigurationSupport.optionalString(configuration, "mediaType", null);
        String fileName = SourceConfigurationSupport.optionalString(configuration, "fileName", extractFileName(url));
        return List.of(new SelectedSourceFile(fileName, url, mediaType, null, Instant.now()));
    }

    @Override
    public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
        String url = SourceConfigurationSupport.requireString(configuration, "url");
        String method = SourceConfigurationSupport.optionalString(configuration, "method", "GET");
        String body = SourceConfigurationSupport.optionalString(configuration, "body", "");
        String mediaType = SourceConfigurationSupport.optionalString(configuration, "mediaType", selectedFile.mediaType());
        Duration timeout = SourceConfigurationSupport.timeout(configuration, 20);
        Map<String, String> headers = SourceConfigurationSupport.stringMap(configuration, "headers");

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(timeout);

        SourceConfigurationSupport.applyHeaders(builder, headers);
        applyAuthentication(builder, configuration);

        HttpRequest request = switch (method.toUpperCase()) {
            case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body)).build();
            case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofString(body)).build();
            case "DELETE" -> builder.method("DELETE", HttpRequest.BodyPublishers.ofString(body)).build();
            default -> builder.GET().build();
        };

        try {
            // Streaming directo a archivo temporal (BodyHandlers.ofFile, no
            // ofByteArray): una respuesta de varios GB no se materializa en heap.
            return TempFileSourcePayload.fromDownloadedTemp(selectedFile.name(), selectedFile.location(), tempFile -> {
                HttpResponse<java.nio.file.Path> response;
                try {
                    response = httpClient.send(request, HttpResponse.BodyHandlers.ofFile(tempFile));
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new IOException("REST source request was interrupted", error);
                }
                int status = response.statusCode();
                if (status < 200 || status >= 300) {
                    throw new IOException("REST source returned status " + status);
                }
                return response.headers().firstValue("Content-Type")
                        .orElse(mediaType != null ? mediaType : "application/octet-stream");
            });
        } catch (IOException e) {
            throw new IllegalStateException("Cannot fetch payload from REST source", e);
        }
    }

    private void applyAuthentication(HttpRequest.Builder builder, Map<String, Object> configuration) {
        String authType = SourceConfigurationSupport.optionalString(configuration, "authType", null);
        if (authType == null) {
            return;
        }

        switch (authType.toLowerCase()) {
            case "basic" -> {
                String username = SourceConfigurationSupport.requireString(configuration, "username");
                String password = SourceConfigurationSupport.requireString(configuration, "password");
                String token = Base64.getEncoder().encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
                builder.header("Authorization", "Basic " + token);
            }
            case "bearer" -> {
                String bearerToken = SourceConfigurationSupport.requireString(configuration, "token");
                builder.header("Authorization", "Bearer " + bearerToken);
            }
            default -> throw new IllegalArgumentException("Unsupported REST authType: " + authType);
        }
    }

    private String extractFileName(String url) {
        URI uri = URI.create(url);
        String path = uri.getPath();
        if (path == null || path.isBlank() || "/".equals(path)) {
            return "rest-response.bin";
        }
        int lastSlash = path.lastIndexOf('/');
        String name = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
        return name.isBlank() ? "rest-response.bin" : name;
    }
}
