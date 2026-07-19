package com.integrationhub.platform.provider.compress;

import com.integrationhub.platform.spi.compress.CompressionEntry;
import com.integrationhub.platform.spi.compress.CompressionOptions;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.GZIPInputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GzipCompressorTest {

    private static CompressionEntry entry(String name, String content) {
        return new CompressionEntry(name, () -> new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void gzipsSingleEntry() throws Exception {
        var out = new ByteArrayOutputStream();
        var count = new GzipCompressor().compress(List.of(entry("data.csv", "hello,world")), out, CompressionOptions.plain(6));

        assertEquals(1, count);
        try (var gzis = new GZIPInputStream(new ByteArrayInputStream(out.toByteArray()))) {
            assertEquals("hello,world", new String(gzis.readAllBytes(), StandardCharsets.UTF_8));
        }
    }

    @Test
    void rejectsMultipleEntries() {
        var entries = List.of(entry("a", "A"), entry("b", "B"));
        assertThrows(IllegalArgumentException.class,
                () -> new GzipCompressor().compress(entries, new ByteArrayOutputStream(), CompressionOptions.plain(6)));
    }
}
