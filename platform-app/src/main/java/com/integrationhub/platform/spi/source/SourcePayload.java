package com.integrationhub.platform.spi.source;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

public final class SourcePayload {

    @FunctionalInterface
    public interface StreamSupplier {
        InputStream open() throws IOException;
    }

    private final SelectedSourceFile file;
    private final StreamSupplier streamSupplier;
    /**
     * SHA-256 hex del contenido, precomputado por el source cuando el payload es efimero
     * (p.ej. {@code TempFileSourcePayload}: el temp se borra cuando el reader cierra el
     * stream consumido, asi que re-abrir despues para hashear falla — visto con SFTP+XLSX).
     * {@code null} => el consumidor (SourceFingerprintService) lo computa por streaming.
     */
    private final String contentSha256;

    public SourcePayload(SelectedSourceFile file, StreamSupplier streamSupplier) {
        this(file, streamSupplier, null);
    }

    public SourcePayload(SelectedSourceFile file, StreamSupplier streamSupplier, String contentSha256) {
        this.file = file;
        this.streamSupplier = streamSupplier;
        this.contentSha256 = contentSha256;
    }

    public static SourcePayload fromBytes(String name, byte[] content, String mediaType) {
        return new SourcePayload(
                new SelectedSourceFile(name, name, mediaType, content == null ? null : (long) content.length, Instant.now()),
                () -> new ByteArrayInputStream(content == null ? new byte[0] : content)
        );
    }

    public static SourcePayload fromPath(Path path, String mediaType) throws IOException {
        var fileName = path.getFileName().toString();
        var size = Files.exists(path) ? Files.size(path) : null;
        var lastModified = Files.exists(path) ? Files.getLastModifiedTime(path).toInstant() : null;
        return new SourcePayload(
                new SelectedSourceFile(fileName, path.toString(), mediaType, size, lastModified),
                () -> Files.newInputStream(path)
        );
    }

    public String name() {
        return file.name();
    }

    public String mediaType() {
        return file.mediaType();
    }

    public String location() {
        return file.location();
    }

    public SelectedSourceFile file() {
        return file;
    }

    public InputStream openStream() throws IOException {
        return streamSupplier.open();
    }

    /** SHA-256 hex precomputado del contenido, o {@code null} si debe computarse bajo demanda. */
    public String contentSha256() {
        return contentSha256;
    }
}
