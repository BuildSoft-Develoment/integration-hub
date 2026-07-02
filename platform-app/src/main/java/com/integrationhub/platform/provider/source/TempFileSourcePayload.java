package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

/**
 * {@link SourcePayload} respaldado por un archivo temporal que se descarga en
 * streaming desde un origen remoto (SFTP/FTP/REST), en vez de cargarlo completo
 * a {@code byte[]} en memoria.
 *
 * <p>El archivo temporal se borra cuando el reader cierra el stream consumido;
 * {@code deleteOnExit} es la red de seguridad si el proceso muere a mitad. Asi
 * un CSV de 1 GB por SFTP no presiona el heap: el reader lo lee por lotes desde
 * disco.</p>
 *
 * @trace spec 008-mensajeria-pagos RNF-04 (alto volumen / streaming)
 * @trace spec 002-catalogo-readers
 */
public final class TempFileSourcePayload {

    private TempFileSourcePayload() {
        // Utility.
    }

    /** Crea un archivo temporal vacio listo para que el caller lo llene. */
    public static Path createTempFile(String name) throws IOException {
        var suffix = name != null && name.contains(".") ? name.substring(name.lastIndexOf('.')) : ".tmp";
        var path = Files.createTempFile("ih-source-", suffix);
        path.toFile().deleteOnExit();
        return path;
    }

    /** SourcePayload sobre {@code path}, con auto-borrado al cerrar el stream. */
    public static SourcePayload of(String name, String location, String mediaType, Path path) throws IOException {
        var size = Files.exists(path) ? Files.size(path) : null;
        var lastModified = Files.exists(path) ? Files.getLastModifiedTime(path).toInstant() : Instant.now();
        var file = new SelectedSourceFile(name, location, mediaType, size, lastModified);
        return new SourcePayload(file, () -> selfDeletingStream(path));
    }

    /**
     * Crea un archivo temporal, deja que el caller lo llene en streaming y lo
     * elimina si la descarga falla antes de devolver el {@link SourcePayload}.
     */
    public static SourcePayload fromDownloadedTemp(String name,
                                                   String location,
                                                   TempFileDownloader downloader) throws IOException {
        var path = createTempFile(name);
        try {
            var mediaType = downloader.download(path);
            return of(name, location, mediaType, path);
        } catch (Exception error) {
            Files.deleteIfExists(path);
            if (error instanceof IOException ioError) {
                throw ioError;
            }
            throw new IOException("Cannot download source payload to temporary file", error);
        }
    }

    private static InputStream selfDeletingStream(Path path) throws IOException {
        return new FilterInputStream(Files.newInputStream(path)) {
            @Override
            public void close() throws IOException {
                try {
                    super.close();
                } finally {
                    Files.deleteIfExists(path);
                }
            }
        };
    }

    @FunctionalInterface
    public interface TempFileDownloader {
        String download(Path path) throws Exception;
    }
}
