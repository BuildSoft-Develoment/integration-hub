package com.integrationhub.platform.provider.task.sink;

// @trace ADR-016 (sink de salida Filesystem: escribe streaming con temporal + rename atomico)

import com.integrationhub.platform.spi.task.sink.OutputSink;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;

/**
 * ADR-016: sink Filesystem. Escribe el artefacto (streaming) a {@code path}/{@code dropPath}, primero a un temporal
 * ({@code dropPath + tmpExtension}) y luego {@code rename} atomico al nombre final, para que el consumidor nunca vea
 * un archivo a medio escribir. Crea los directorios padre si faltan.
 */
@ApplicationScoped
public class FilesystemSink implements OutputSink {

    private static final String DEFAULT_TMP_EXTENSION = ".part";

    @Override
    public String type() {
        return "FILESYSTEM";
    }

    @Override
    public void deliver(String dropPath, StreamSource source, Map<String, Object> configuration) throws IOException {
        var basePath = SinkConfigurationSupport.optionalString(configuration, "path", "");
        var tmpExtension = SinkConfigurationSupport.optionalString(configuration, "tmpExtension", DEFAULT_TMP_EXTENSION);
        var target = resolveTarget(basePath, dropPath);
        var parent = target.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        var tmp = target.resolveSibling(target.getFileName() + tmpExtension);
        try (var in = source.open(); var out = Files.newOutputStream(tmp)) {
            in.transferTo(out);
        }
        moveIntoPlace(tmp, target);
    }

    private static Path resolveTarget(String basePath, String dropPath) {
        if (basePath.isBlank()) {
            return Path.of(dropPath);
        }
        // dropPath se interpreta relativo a basePath: se quita el '/' inicial para que resolve no lo trate como absoluto.
        var relative = dropPath.startsWith("/") ? dropPath.substring(1) : dropPath;
        return Path.of(basePath).resolve(relative);
    }

    private static void moveIntoPlace(Path tmp, Path target) throws IOException {
        try {
            Files.move(tmp, target, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException atomicNotSupported) {
            // Fallback no-atomico (p. ej. cross-filesystem o Windows con destino existente).
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
