package com.integrationhub.platform.provider.task.filecompress;

import com.integrationhub.platform.provider.artifact.LocalTempArtifactStore;
import com.integrationhub.platform.provider.compress.GzipCompressor;
import com.integrationhub.platform.provider.compress.ZipCompressor;
import com.integrationhub.platform.service.artifact.ArtifactStoreRegistry;
import com.integrationhub.platform.service.compress.FileCompressorRegistry;
import com.integrationhub.platform.spi.artifact.StoredArtifact;
import com.integrationhub.platform.spi.task.TaskContext;
import net.lingala.zip4j.io.inputstream.ZipInputStream;
import net.lingala.zip4j.model.LocalFileHeader;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileCompressTaskProviderTest {

    private static FileCompressTaskProvider provider() {
        return new FileCompressTaskProvider(
                new FileCompressorRegistry(List.of(new ZipCompressor(), new GzipCompressor())),
                new ArtifactStoreRegistry(List.of(new LocalTempArtifactStore())));
    }

    private static StoredArtifact writeTempFile(String name, String content) throws Exception {
        var store = new LocalTempArtifactStore();
        try (var artifact = store.create(name)) {
            artifact.outputStream().write(content.getBytes(StandardCharsets.UTF_8));
            return artifact.finish();
        }
    }

    private static Map<String, Object> fileRef(StoredArtifact artifact) {
        return Map.of("path", artifact.location(), "name", artifact.name(), "size", artifact.size(), "store", artifact.store());
    }

    private static Map<String, String> readZip(byte[] bytes, char[] password) throws Exception {
        var result = new LinkedHashMap<String, String>();
        try (var zis = new ZipInputStream(new ByteArrayInputStream(bytes), password)) {
            LocalFileHeader header;
            while ((header = zis.getNextEntry()) != null) {
                result.put(header.getFileName(), new String(zis.readAllBytes(), StandardCharsets.UTF_8));
            }
        }
        return result;
    }

    private static void cleanup(StoredArtifact... artifacts) throws Exception {
        for (var artifact : artifacts) {
            Files.deleteIfExists(Path.of(artifact.location()));
        }
    }

    @Test
    void zipsMultipleFilesFromSummary() throws Exception {
        var f1 = writeTempFile("a.csv", "AAA");
        var f2 = writeTempFile("b.csv", "BBB");
        var context = new TaskContext(9L, 1L);
        context.attributes().put("taskOutputs", Map.of("w1.summary.files", List.of(fileRef(f1), fileRef(f2))));
        var config = Map.<String, Object>of(
                "algorithm", "ZIP",
                "input", Map.of("sourceTaskRef", "w1", "sourceOutput", "summary"));

        var result = provider().execute(context, config);

        assertTrue(result.success());
        assertEquals(2L, ((Number) result.outputs().get("entryCount")).longValue());
        var zipPath = String.valueOf(result.outputs().get("archivePath"));
        var byName = readZip(Files.readAllBytes(Path.of(zipPath)), null);
        assertEquals("AAA", byName.get("a.csv"));
        assertEquals("BBB", byName.get("b.csv"));

        Files.deleteIfExists(Path.of(zipPath));
        cleanup(f1, f2);
    }

    @Test
    void zipWithAesEncryption() throws Exception {
        var f1 = writeTempFile("secret.csv", "TOPSECRET");
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("w1.summary.files", List.of(fileRef(f1))));
        var config = Map.<String, Object>of(
                "algorithm", "ZIP", "encryption", "AES256", "password", "clave123",
                "input", Map.of("sourceTaskRef", "w1"));

        var result = provider().execute(context, config);

        var bytes = Files.readAllBytes(Path.of(String.valueOf(result.outputs().get("archivePath"))));
        assertEquals("TOPSECRET", readZip(bytes, "clave123".toCharArray()).get("secret.csv"));
        assertThrows(Exception.class, () -> readZip(bytes, null));

        Files.deleteIfExists(Path.of(String.valueOf(result.outputs().get("archivePath"))));
        cleanup(f1);
    }

    @Test
    void gzipRejectsMultipleFiles() throws Exception {
        var f1 = writeTempFile("a.csv", "A");
        var f2 = writeTempFile("b.csv", "B");
        var context = new TaskContext(1L, 1L);
        context.attributes().put("taskOutputs", Map.of("w1.summary.files", List.of(fileRef(f1), fileRef(f2))));
        var config = Map.<String, Object>of("algorithm", "GZIP", "input", Map.of("sourceTaskRef", "w1"));

        assertThrows(IllegalArgumentException.class, () -> provider().execute(context, config));
        cleanup(f1, f2);
    }

    @Test
    void requiresSourceTaskRef() {
        var config = Map.<String, Object>of("algorithm", "ZIP");
        assertThrows(IllegalArgumentException.class, () -> provider().execute(new TaskContext(1L, 1L), config));
    }
}
