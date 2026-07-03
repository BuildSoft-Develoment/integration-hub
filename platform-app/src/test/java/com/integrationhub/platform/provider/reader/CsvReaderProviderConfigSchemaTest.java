package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CsvReaderProviderConfigSchemaTest {

    @Test
    void exposesConfigSchemaForTheCsvReader() {
        PluginConfigSchema schema = new CsvReaderProvider().configSchema();

        assertFalse(schema.isEmpty());
        List<String> keys = schema.fields().stream().map(PluginConfigField::key).toList();
        assertTrue(keys.containsAll(List.of("delimiter", "encoding")), "campos del reader CSV: " + keys);

        PluginConfigField encoding = schema.fields().stream()
                .filter(f -> f.key().equals("encoding"))
                .findFirst()
                .orElseThrow();
        assertEquals("select", encoding.type());
        List<String> options = encoding.options().stream().map(o -> o.value()).toList();
        assertTrue(options.contains("UTF-8"), "opciones de encoding: " + options);
    }
}
