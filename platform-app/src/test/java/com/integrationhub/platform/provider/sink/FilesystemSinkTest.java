package com.integrationhub.platform.provider.sink;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class FilesystemSinkTest {

    private static void deleteRecursively(Path dir) throws IOException {
        try (var walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // best-effort cleanup
                }
            });
        }
    }

    @Test
    void deliversCreatingDirsWithTempAndRename() throws Exception {
        var dir = Files.createTempDirectory("ih-sink-");
        try {
            new FilesystemSink().deliver("out/export.csv",
                    () -> new ByteArrayInputStream("hola,mundo\n".getBytes(StandardCharsets.UTF_8)),
                    Map.of("path", dir.toString()));

            var delivered = dir.resolve("out/export.csv");
            assertEquals("hola,mundo\n", Files.readString(delivered, StandardCharsets.UTF_8));
            assertFalse(Files.exists(dir.resolve("out/export.csv.part")), "el temporal no debe quedar");
        } finally {
            deleteRecursively(dir);
        }
    }

    @Test
    void overwritesExistingTarget() throws Exception {
        var dir = Files.createTempDirectory("ih-sink-");
        try {
            var sink = new FilesystemSink();
            sink.deliver("export.csv", () -> new ByteArrayInputStream("v1".getBytes(StandardCharsets.UTF_8)), Map.of("path", dir.toString()));
            sink.deliver("export.csv", () -> new ByteArrayInputStream("v2".getBytes(StandardCharsets.UTF_8)), Map.of("path", dir.toString()));
            assertEquals("v2", Files.readString(dir.resolve("export.csv"), StandardCharsets.UTF_8));
        } finally {
            deleteRecursively(dir);
        }
    }
}
