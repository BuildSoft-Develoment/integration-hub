package com.integrationhub.platform.provider.source;

import com.integrationhub.platform.spi.source.SourcePayload;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FilesystemSourceProviderTest {

    private final FilesystemSourceProvider provider = new FilesystemSourceProvider();

    @Test
    void readsExactFilesystemPath(@TempDir Path tempDir) throws Exception {
        Path file = tempDir.resolve("clientes.txt");
        Files.writeString(file, "contenido exacto");

        var selected = provider.selectFiles(Map.of(
                "path", file.toString()
        ));
        SourcePayload payload = provider.openFile(selected.getFirst(), Map.of(
                "path", file.toString()
        ));

        assertEquals("clientes.txt", payload.name());
        String expectedMediaType = Files.probeContentType(file);
        assertEquals(expectedMediaType == null ? "application/octet-stream" : expectedMediaType, payload.mediaType());
        try (var stream = payload.openStream()) {
            assertArrayEquals(Files.readAllBytes(file), stream.readAllBytes());
        }
    }

    @Test
    void selectsAllMatchingFilesUsingTemplate(@TempDir Path tempDir) throws Exception {
        Path directory = Files.createDirectories(tempDir.resolve("archivos"));
        Path first = directory.resolve("EDBV_20250326_C910_V.txt");
        Path second = directory.resolve("EDBV_20250327_C910_V.txt");
        Path ignored = directory.resolve("OTRO_20250327_C910_V.txt");
        Files.writeString(first, "archivo 1");
        Files.writeString(second, "archivo 2");
        Files.writeString(ignored, "ignorado");

        var configuration = Map.of(
                "path", directory.toString(),
                "fileNameTemplate", "EDBV_{yyyyMMdd}_{empresa}_V.txt",
                "templateVariables", Map.of("empresa", "C910"),
                "selectionMode", "all"
        );

        var selected = provider.selectFiles(configuration);

        assertEquals(2, selected.size());
        assertEquals("EDBV_20250326_C910_V.txt", selected.get(0).name());
        assertEquals("EDBV_20250327_C910_V.txt", selected.get(1).name());
    }

    @Test
    void rejectsSingleSelectionWhenMultipleFilesMatch(@TempDir Path tempDir) throws Exception {
        Path directory = Files.createDirectories(tempDir.resolve("archivos"));
        Files.writeString(directory.resolve("EDBV_20250326_C910_V.txt"), "archivo 1");
        Files.writeString(directory.resolve("EDBV_20250327_C910_V.txt"), "archivo 2");

        var configuration = Map.of(
                "path", directory.toString(),
                "fileNameTemplate", "EDBV_{yyyyMMdd}_{empresa}_V.txt",
                "templateVariables", Map.of("empresa", "C910"),
                "selectionMode", "single"
        );

        var error = assertThrows(IllegalStateException.class, () -> provider.selectFiles(configuration));
        assertEquals(true, error.getMessage().contains("Expected exactly one file"));
    }

    @Test
    void selectsLatestFileUsingTemplateAndDatePlaceholderDirectory(@TempDir Path tempDir) throws Exception {
        String folderName = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Path datedDirectory = Files.createDirectories(tempDir.resolve(folderName));

        Path older = datedDirectory.resolve("EDBV_20250326_C910_V.txt");
        Path newer = datedDirectory.resolve("EDBV_20260326_C910_V.txt");
        Files.writeString(older, "archivo viejo");
        Files.writeString(newer, "archivo nuevo");
        Files.setLastModifiedTime(older, FileTime.from(Instant.parse("2025-03-26T10:15:30Z")));
        Files.setLastModifiedTime(newer, FileTime.from(Instant.parse("2026-03-26T10:15:30Z")));

        var configuration = Map.of(
                "path", tempDir.resolve("{yyyyMMdd}").toString(),
                "fileNameTemplate", "EDBV_{yyyyMMdd}_{empresa}_V.txt",
                "templateVariables", Map.of("empresa", "C910"),
                "selectionMode", "latestModified"
        );
        var selected = provider.selectFiles(configuration);
        SourcePayload payload = provider.openFile(selected.getFirst(), configuration);

        assertEquals("EDBV_20260326_C910_V.txt", payload.name());
        try (var stream = payload.openStream()) {
            assertArrayEquals(Files.readAllBytes(newer), stream.readAllBytes());
        }
    }
}
