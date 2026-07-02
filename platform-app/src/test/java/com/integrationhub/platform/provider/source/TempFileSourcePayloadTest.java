package com.integrationhub.platform.provider.source;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RNF-04 (streaming de sources remotos)
 */
class TempFileSourcePayloadTest {

    @Test
    void streamsContentFromTempFileAndExposesMetadata() throws Exception {
        var temp = TempFileSourcePayload.createTempFile("pagos.csv");
        Files.writeString(temp, "codigo,monto\nA,100\n");

        var payload = TempFileSourcePayload.of("pagos.csv", "sftp://host/pagos.csv", "text/csv", temp);

        assertEquals("pagos.csv", payload.name());
        assertEquals("sftp://host/pagos.csv", payload.location());
        assertEquals("text/csv", payload.mediaType());
        try (var stream = payload.openStream()) {
            assertArrayEquals("codigo,monto\nA,100\n".getBytes(StandardCharsets.UTF_8),
                    stream.readAllBytes());
        }
    }

    @Test
    void deletesTempFileWhenStreamClosed() throws Exception {
        var temp = TempFileSourcePayload.createTempFile("big.csv");
        Files.writeString(temp, "x".repeat(1024));
        assertTrue(Files.exists(temp));

        var payload = TempFileSourcePayload.of("big.csv", "ftp://host/big.csv", "text/csv", temp);
        var stream = payload.openStream();
        stream.readAllBytes();
        assertTrue(Files.exists(temp), "el archivo vive mientras el stream esta abierto");
        stream.close();

        assertFalse(Files.exists(temp), "el archivo temporal se borra al cerrar el stream consumido");
    }

    @Test
    void createTempFilePreservesExtensionForReaderMediaTypeDetection() throws Exception {
        Path temp = TempFileSourcePayload.createTempFile("remesas.xlsx");
        try {
            assertTrue(temp.getFileName().toString().endsWith(".xlsx"));
        } finally {
            Files.deleteIfExists(temp);
        }
    }

    @Test
    void deletesTempFileWhenDownloadFailsBeforePayloadIsReturned() {
        var created = new AtomicReference<Path>();

        assertThrows(java.io.IOException.class, () -> TempFileSourcePayload.fromDownloadedTemp(
                "fallido.csv",
                "sftp://host/fallido.csv",
                temp -> {
                    created.set(temp);
                    Files.writeString(temp, "partial");
                    throw new java.io.IOException("download failed");
                }));

        assertFalse(Files.exists(created.get()), "el temporal parcial se elimina si falla la descarga");
    }
}
