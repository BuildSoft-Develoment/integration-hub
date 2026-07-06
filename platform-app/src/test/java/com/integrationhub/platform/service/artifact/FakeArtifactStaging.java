package com.integrationhub.platform.service.artifact;

import com.integrationhub.platform.task.ArtifactReference;

import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Test double de {@link ArtifactStaging} en memoria: presigna una referencia {@code mem://<key>}, deja que el "plugin"
 * suba con {@link #upload}, y sirve el contenido por streaming con delete-on-close (como la impl real). Sin MinIO.
 */
public class FakeArtifactStaging implements ArtifactStaging {

    public static final String SCHEME = "mem://";

    private final ConcurrentMap<String, byte[]> store = new ConcurrentHashMap<>();
    /** Keys borradas en el close() del stream (para asertar el cleanup). */
    public final List<String> deleted = new ArrayList<>();

    @Override
    public StagedUpload presignUpload(String mediaType, Duration ttl) {
        var key = "fake-staging/" + UUID.randomUUID();
        var reference = ArtifactReference.put(SCHEME + key, mediaType, System.currentTimeMillis() + ttl.toMillis());
        return new StagedUpload(reference, key);
    }

    @Override
    public InputStream openAndDeleteOnClose(String key) {
        var bytes = store.get(key);
        if (bytes == null) {
            throw new IllegalStateException("objeto de staging no subido: " + key);
        }
        return new FilterInputStream(new ByteArrayInputStream(bytes)) {
            @Override
            public void close() throws IOException {
                try {
                    super.close();
                } finally {
                    store.remove(key);
                    deleted.add(key);
                }
            }
        };
    }

    /** Simula al plugin subiendo el archivo a la URL de la referencia PUT. */
    public void upload(String referenceUri, byte[] content) {
        store.put(referenceUri.substring(SCHEME.length()), content);
    }

    // --- Fase 3a (caso reader): la plataforma sube y presigna un GET; el plugin descarga por download(uri). ---

    @Override
    public StagedDownload stageForDownload(java.io.InputStream content, String mediaType, long sizeBytes,
                                           java.time.Duration ttl) {
        var key = "fake-staging/" + UUID.randomUUID();
        try (content) {
            store.put(key, content.readAllBytes());
        } catch (java.io.IOException error) {
            throw new java.io.UncheckedIOException(error);
        }
        var reference = ArtifactReference.get(SCHEME + key, mediaType, Math.max(0, sizeBytes),
                System.currentTimeMillis() + ttl.toMillis());
        return new StagedDownload(reference, key);
    }

    @Override
    public void deleteStaged(String key) {
        if (store.remove(key) != null) {
            deleted.add(key);
        }
    }

    /** Simula al plugin descargando de la URL de la referencia GET (caso reader). */
    public byte[] download(String referenceUri) {
        return store.get(referenceUri.substring(SCHEME.length()));
    }
}
