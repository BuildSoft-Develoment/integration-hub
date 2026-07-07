package com.integrationhub.examples.plugin.sidecar;

import com.integrationhub.platform.task.ArtifactReference;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Proyecto #3, Fase 1 (SDK) — transferencia de artefactos por {@link ArtifactReference} desde el lado del plugin.
 *
 * <p>El plugin remoto usa esta utilidad para <b>descargar</b> (referencia GET, caso reader) o <b>subir</b> (referencia
 * PUT, caso source) el archivo directamente contra la URL presignada del object store, por streaming — sin cargar todo
 * en memoria en el canal de control. Usa el {@code HttpClient} del JDK (sin dependencias nuevas).</p>
 */
public final class ArtifactTransfer {

    private final HttpClient http;

    public ArtifactTransfer() {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build());
    }

    public ArtifactTransfer(HttpClient http) {
        this.http = http;
    }

    /** Descarga el artefacto de una referencia GET como stream (caso reader). El caller cierra el stream. */
    public InputStream openDownload(ArtifactReference reference) throws IOException, InterruptedException {
        requireMethod(reference, ArtifactReference.GET, "openDownload");
        HttpResponse<InputStream> response = http.send(
                HttpRequest.newBuilder(URI.create(reference.uri())).GET().build(),
                HttpResponse.BodyHandlers.ofInputStream());
        ensure2xx(response.statusCode(), "descarga");
        return response.body();
    }

    /**
     * Proyecto #3, Fase 3b — descarga desde un OFFSET (Range GET) para paginar sin re-descargar todo. El plugin usa
     * esto cuando la plataforma le pasa un {@code cursor} (que debería tratar como un offset de byte en una frontera de
     * record): {@code openRange(ref, cursor)} → stream desde ese offset. Así cada byte se lee una vez en total
     * (O(archivo)) en vez de re-parsear desde el inicio cada página (O(N²)). S3/MinIO honran {@code Range} en URLs
     * presignadas (con 206 Partial Content, o 200 si se ignora).
     */
    public InputStream openRange(ArtifactReference reference, long startInclusive)
            throws IOException, InterruptedException {
        requireMethod(reference, ArtifactReference.GET, "openRange");
        HttpResponse<InputStream> response = http.send(
                HttpRequest.newBuilder(URI.create(reference.uri()))
                        .header("Range", "bytes=" + Math.max(0, startInclusive) + "-")
                        .GET().build(),
                HttpResponse.BodyHandlers.ofInputStream());
        if (response.statusCode() != 200 && response.statusCode() != 206) {
            throw new IOException("descarga por rango fallida: HTTP " + response.statusCode());
        }
        return response.body();
    }

    /** Descarga completa a bytes (conveniencia para artefactos que caben en memoria). */
    public byte[] download(ArtifactReference reference) throws IOException, InterruptedException {
        requireMethod(reference, ArtifactReference.GET, "download");
        HttpResponse<byte[]> response = http.send(
                HttpRequest.newBuilder(URI.create(reference.uri())).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray());
        ensure2xx(response.statusCode(), "descarga");
        return response.body();
    }

    /** Sube el artefacto a una referencia PUT (caso source). */
    public void upload(ArtifactReference reference, byte[] content) throws IOException, InterruptedException {
        requireMethod(reference, ArtifactReference.PUT, "upload");
        var builder = HttpRequest.newBuilder(URI.create(reference.uri()))
                .PUT(HttpRequest.BodyPublishers.ofByteArray(content == null ? new byte[0] : content));
        if (reference.mediaType() != null && !reference.mediaType().isBlank()) {
            builder.header("Content-Type", reference.mediaType());
        }
        HttpResponse<Void> response = http.send(builder.build(), HttpResponse.BodyHandlers.discarding());
        ensure2xx(response.statusCode(), "subida");
    }

    private static void requireMethod(ArtifactReference reference, String expected, String op) {
        if (reference == null || !expected.equals(reference.method())) {
            throw new IllegalArgumentException(op + " requiere una referencia " + expected
                    + " (fue " + (reference == null ? "null" : reference.method()) + ")");
        }
    }

    private static void ensure2xx(int status, String op) throws IOException {
        if (status / 100 != 2) {
            throw new IOException(op + " de artefacto fallida: HTTP " + status);
        }
    }
}
