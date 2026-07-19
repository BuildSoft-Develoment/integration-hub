package com.integrationhub.platform.provider.task.compress;

// @trace ADR-016 (compresion GZIP via java.util.zip - un solo archivo, JDK sin dependencia)

import com.integrationhub.platform.spi.task.compress.CompressionEntry;
import com.integrationhub.platform.spi.task.compress.CompressionOptions;
import com.integrationhub.platform.spi.task.compress.FileCompressor;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.zip.GZIPOutputStream;

/**
 * ADR-016: compresor GZIP via {@code java.util.zip} (JDK, sin dependencia). GZIP comprime <b>un solo archivo</b>
 * (.gz), no bundlea; para varias entradas usar ZIP. Sin cifrado. Streaming.
 */
@ApplicationScoped
public class GzipCompressor implements FileCompressor {

    @Override
    public String algorithm() {
        return "GZIP";
    }

    @Override
    public boolean supportsMultipleEntries() {
        return false;
    }

    @Override
    public boolean supportsEncryption() {
        return false;
    }

    @Override
    public long compress(List<CompressionEntry> entries, OutputStream target, CompressionOptions options) throws IOException {
        if (entries.size() != 1) {
            throw new IllegalArgumentException("GZIP compresses a single file; got " + entries.size()
                    + " entries (use ZIP to bundle multiple)");
        }
        // nonClosing: gz.close() finaliza el trailer gzip pero NO cierra el artefacto (su dueno lo cierra).
        try (var gz = new LeveledGzipOutputStream(nonClosing(target), clampLevel(options.deflateLevel()))) {
            try (var in = entries.get(0).source().open()) {
                in.transferTo(gz);
            }
        }
        return 1;
    }

    private static int clampLevel(int level) {
        if (level <= 0) {
            return 0;
        }
        return Math.min(level, 9);
    }

    /** GZIPOutputStream que fija el nivel de deflate (el {@code def} protegido no es accesible desde fuera). */
    private static final class LeveledGzipOutputStream extends GZIPOutputStream {
        private LeveledGzipOutputStream(OutputStream out, int level) throws IOException {
            super(out);
            def.setLevel(level);
        }
    }

    /** Filtro que hace flush pero NO cierra el delegate (el {@code WritableArtifact} es el dueno del stream). */
    private static OutputStream nonClosing(OutputStream delegate) {
        return new java.io.FilterOutputStream(delegate) {
            @Override
            public void write(byte[] bytes, int off, int len) throws IOException {
                out.write(bytes, off, len);
            }

            @Override
            public void close() throws IOException {
                flush();
            }
        };
    }
}
