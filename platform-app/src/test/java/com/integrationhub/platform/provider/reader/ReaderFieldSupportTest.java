package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.source.SourcePayload;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers RF-002 (reingenieria: prueba que cubre el/los RF en produccion)
class ReaderFieldSupportTest {

    @Test
    @SuppressWarnings("unchecked")
    void cachesCompiledJexlScriptsAcrossRows() throws Exception {
        var cacheField = ReaderFieldSupport.class.getDeclaredField("SCRIPT_CACHE");
        cacheField.setAccessible(true);
        var cache = (ConcurrentMap<String, Object>) cacheField.get(null);
        cache.clear();

        var provider = new TxtReaderProvider();
        var script = "if (value == null || value == '') { valid = false; } else { value = value.toUpperCase(); }";
        var payload = SourcePayload.fromBytes(
                "cliente.txt",
                """
                dni|nom
                1|ana
                2|luis
                """.getBytes(StandardCharsets.UTF_8),
                "text/plain"
        );

        provider.readInBatches(payload, Map.of(
                "mode", "delimited",
                "delimiter", "|",
                "rowData", 1,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1),
                        Map.of("name", "nombre", "position", 2, "script", script)
                )
        ), 1, batch -> {
        });

        assertEquals(1, cache.size());
        assertTrue(cache.containsKey(script));
    }
}
