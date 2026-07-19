package com.integrationhub.platform.provider.task.compress;

import com.integrationhub.platform.spi.task.compress.CompressionEntry;
import com.integrationhub.platform.spi.task.compress.CompressionOptions;
import net.lingala.zip4j.io.inputstream.ZipInputStream;
import net.lingala.zip4j.model.LocalFileHeader;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ZipCompressorTest {

    private static CompressionEntry entry(String name, String content) {
        return new CompressionEntry(name, () -> new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8)));
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

    @Test
    void zipsMultipleEntriesPlain() throws Exception {
        var out = new ByteArrayOutputStream();
        var count = new ZipCompressor().compress(
                List.of(entry("a.txt", "AAA"), entry("b.txt", "BBB")), out, CompressionOptions.plain(6));

        assertEquals(2, count);
        var byName = readZip(out.toByteArray(), null);
        assertEquals("AAA", byName.get("a.txt"));
        assertEquals("BBB", byName.get("b.txt"));
    }

    @Test
    void zipsWithAesEncryption() throws Exception {
        var out = new ByteArrayOutputStream();
        new ZipCompressor().compress(List.of(entry("secret.txt", "TOPSECRET")), out,
                CompressionOptions.encrypted("clave123".toCharArray(), 6));

        // con password correcto -> se lee; sin password -> falla
        assertEquals("TOPSECRET", readZip(out.toByteArray(), "clave123".toCharArray()).get("secret.txt"));
        assertThrows(Exception.class, () -> readZip(out.toByteArray(), null));
    }

    @Test
    void doesNotCloseTargetStream() throws Exception {
        var closed = new boolean[]{false};
        var out = new ByteArrayOutputStream() {
            @Override
            public void close() {
                closed[0] = true;
            }
        };
        new ZipCompressor().compress(List.of(entry("a.txt", "A")), out, CompressionOptions.plain(6));
        assertFalse(closed[0], "el compresor no debe cerrar el stream del artefacto");
    }
}
