package com.integrationhub.platform.provider.artifact;

import com.integrationhub.platform.spi.artifact.StoredArtifact;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalTempArtifactStoreTest {

    @Test
    void writeSealThenReadBackAndDelete() throws Exception {
        var store = new LocalTempArtifactStore();
        StoredArtifact stored;
        try (var artifact = store.create("export.csv")) {
            artifact.outputStream().write("hola,mundo\n".getBytes(StandardCharsets.UTF_8));
            stored = artifact.finish();
        }

        assertEquals("LOCAL_TEMP", stored.store());
        assertEquals("export.csv", stored.name());
        assertEquals(11L, stored.size());
        assertTrue(stored.location().endsWith(".csv"), "el temp preserva la extension");

        try (var in = store.open(stored)) {
            assertEquals("hola,mundo\n", new String(in.readAllBytes(), StandardCharsets.UTF_8));
        }

        store.delete(stored);
        assertFalse(Files.exists(Path.of(stored.location())));
        // delete es idempotente
        store.delete(stored);
    }
}
