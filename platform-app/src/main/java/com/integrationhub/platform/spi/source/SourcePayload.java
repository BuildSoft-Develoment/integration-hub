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

    public SourcePayload(SelectedSourceFile file, StreamSupplier streamSupplier) {
        this.file = file;
        this.streamSupplier = streamSupplier;
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
}
