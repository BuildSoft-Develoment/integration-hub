package com.integrationhub.platform.provider.artifact;

// @trace ADR-016 (handoff de artefactos en modo sync: temp file local)

import com.integrationhub.platform.spi.artifact.ArtifactStore;
import com.integrationhub.platform.spi.artifact.StoredArtifact;
import com.integrationhub.platform.spi.artifact.WritableArtifact;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * ADR-016: {@link ArtifactStore} de modo SYNC — materializa los artefactos en temp files locales. Sirve cuando toda la
 * cadena de salida corre en el mismo JVM (proceso sync, o proceso async con las tareas de salida como pasos
 * secuenciales). El async offload multi-nodo usa {@code S3ArtifactStore} (fase 2).
 */
@ApplicationScoped
public class LocalTempArtifactStore implements ArtifactStore {

    public static final String STORE_TYPE = "LOCAL_TEMP";

    @Override
    public String type() {
        return STORE_TYPE;
    }

    @Override
    public WritableArtifact create(String name) throws IOException {
        var temp = Files.createTempFile("ih-artifact-", suffixOf(name));
        temp.toFile().deleteOnExit();
        return new LocalWritableArtifact(name, temp);
    }

    @Override
    public InputStream open(StoredArtifact artifact) throws IOException {
        return Files.newInputStream(Path.of(artifact.location()));
    }

    @Override
    public void delete(StoredArtifact artifact) throws IOException {
        Files.deleteIfExists(Path.of(artifact.location()));
    }

    private static String suffixOf(String name) {
        if (name == null) {
            return ".tmp";
        }
        var dot = name.lastIndexOf('.');
        return dot > 0 && dot < name.length() - 1 ? name.substring(dot) : ".tmp";
    }

    /** Artefacto en construccion sobre un temp file: si no se sella con {@code finish()}, {@code close()} lo borra. */
    private static final class LocalWritableArtifact implements WritableArtifact {

        private final String name;
        private final Path path;
        private final OutputStream out;
        private boolean finished;

        private LocalWritableArtifact(String name, Path path) throws IOException {
            this.name = name;
            this.path = path;
            this.out = new BufferedOutputStream(Files.newOutputStream(path));
        }

        @Override
        public OutputStream outputStream() {
            return out;
        }

        @Override
        public StoredArtifact finish() throws IOException {
            out.flush();
            out.close();
            finished = true;
            return new StoredArtifact(STORE_TYPE, name, path.toString(), Files.size(path));
        }

        @Override
        public void close() throws IOException {
            if (finished) {
                return;
            }
            try {
                out.close();
            } catch (IOException ignored) {
                // se borra igual el parcial abajo
            }
            Files.deleteIfExists(path);
        }
    }
}
