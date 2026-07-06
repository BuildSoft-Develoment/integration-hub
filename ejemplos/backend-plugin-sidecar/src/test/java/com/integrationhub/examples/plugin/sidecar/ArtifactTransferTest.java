package com.integrationhub.examples.plugin.sidecar;

import com.integrationhub.platform.task.ArtifactReference;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Proyecto #3, Fase 1 — el SDK transfiere el artefacto por HTTP contra la URL (presignada) de la referencia. Se prueba
 * contra un {@link HttpServer} en-JVM real (no mocks): descarga GET, subida PUT (con Content-Type), y error HTTP.
 */
class ArtifactTransferTest {

    private HttpServer server;
    private String baseUrl;
    private final ArtifactTransfer transfer = new ArtifactTransfer();

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    @Test
    void downloadFetchesTheArtifactBytesFromAGetReference() throws Exception {
        var payload = "id,amount\n1,100\n".getBytes(StandardCharsets.UTF_8);
        server.createContext("/artifact", exchange -> {
            exchange.sendResponseHeaders(200, payload.length);
            try (var os = exchange.getResponseBody()) {
                os.write(payload);
            }
        });

        var ref = ArtifactReference.get(baseUrl + "/artifact", "text/csv", payload.length, 0L);
        assertArrayEquals(payload, transfer.download(ref));
    }

    @Test
    void uploadSendsTheArtifactBytesAndContentTypeToAPutReference() throws Exception {
        var received = new AtomicReference<byte[]>();
        var contentType = new AtomicReference<String>();
        server.createContext("/upload", exchange -> {
            contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
            received.set(exchange.getRequestBody().readAllBytes());
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });

        var content = "hello-artifact".getBytes(StandardCharsets.UTF_8);
        var ref = ArtifactReference.put(baseUrl + "/upload", "application/octet-stream", 0L);
        transfer.upload(ref, content);

        assertArrayEquals(content, received.get());
        assertEquals("application/octet-stream", contentType.get());
    }

    @Test
    void nonSuccessStatusRaisesIoException() {
        server.createContext("/missing", exchange -> {
            exchange.sendResponseHeaders(404, -1);
            exchange.close();
        });
        var ref = ArtifactReference.get(baseUrl + "/missing", "text/csv", 0L, 0L);
        var error = assertThrows(IOException.class, () -> transfer.download(ref));
        assertTrue(error.getMessage().contains("404"));
    }

    @Test
    void downloadRejectsAPutReference() {
        var ref = ArtifactReference.put(baseUrl + "/x", "text/csv", 0L);
        assertThrows(IllegalArgumentException.class, () -> transfer.download(ref));
    }
}
