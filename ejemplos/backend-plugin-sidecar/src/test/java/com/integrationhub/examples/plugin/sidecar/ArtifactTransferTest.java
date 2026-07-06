package com.integrationhub.examples.plugin.sidecar;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.task.ArtifactReference;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
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

    @Test
    void openDownloadStreamsTheArtifactWithoutMaterializingUpfront() throws Exception {
        var payload = "row\n".repeat(50_000).getBytes(StandardCharsets.UTF_8);
        server.createContext("/big", exchange -> {
            exchange.sendResponseHeaders(200, payload.length);
            try (var os = exchange.getResponseBody()) {
                os.write(payload);
            }
        });

        var ref = ArtifactReference.get(baseUrl + "/big", "text/csv", payload.length, 0L);
        try (var stream = transfer.openDownload(ref)) {
            assertArrayEquals(payload, stream.readAllBytes());
        }
    }

    /**
     * e2e de la FASE 1: la referencia sobrevive el wire REAL (Jackson JSON, como viaja en el payload del plugin) y el
     * SDK la usa para transferir. Cadena completa: crear ArtifactReference → asMap → JSON → parse → fromMap →
     * ArtifactTransfer contra el HttpServer real. Cubre el seam contrato↔SDK↔wire que los tests aislados no tocaban.
     */
    @Test
    void referenceSurvivesJsonWireThenTransferDownloadsAndUploads() throws Exception {
        var mapper = new ObjectMapper();
        var payload = "id,amount\n7,700\n".getBytes(StandardCharsets.UTF_8);
        var uploaded = new AtomicReference<byte[]>();
        server.createContext("/download", exchange -> {
            exchange.sendResponseHeaders(200, payload.length);
            try (var os = exchange.getResponseBody()) {
                os.write(payload);
            }
        });
        server.createContext("/upload", exchange -> {
            uploaded.set(exchange.getRequestBody().readAllBytes());
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });

        // GET: la plataforma pondria ref.asMap() bajo "artifactRef" en el payload; se serializa/parsea como JSON.
        var getRef = ArtifactReference.get(baseUrl + "/download", "text/csv", payload.length, 1730000000000L);
        var envelope = new LinkedHashMap<String, Object>();
        envelope.put(ArtifactReference.ARTIFACT_REF, getRef.asMap());
        var json = mapper.writeValueAsString(envelope);
        @SuppressWarnings("unchecked")
        var parsed = (Map<String, Object>) mapper.readValue(json, Map.class);
        @SuppressWarnings("unchecked")
        var parsedRefMap = (Map<String, Object>) parsed.get(ArtifactReference.ARTIFACT_REF);
        var reconstructed = ArtifactReference.fromMap(parsedRefMap);
        assertEquals(getRef, reconstructed, "la referencia debe sobrevivir el round-trip JSON intacta");
        assertArrayEquals(payload, transfer.download(reconstructed));

        // PUT: mismo camino para la referencia de subida (caso source).
        var putRef = ArtifactReference.put(baseUrl + "/upload", "application/octet-stream", 1730000000000L);
        var putReconstructed = ArtifactReference.fromMap(
                mapper.readValue(mapper.writeValueAsString(putRef.asMap()), Map.class));
        transfer.upload(putReconstructed, payload);
        assertArrayEquals(payload, uploaded.get());
    }

    @Test
    void openRangeDownloadsFromTheOffset() throws Exception {
        var full = "0123456789".getBytes(StandardCharsets.UTF_8);
        server.createContext("/ranged", exchange -> {
            var rangeHeader = exchange.getRequestHeaders().getFirst("Range"); // "bytes=3-"
            int start = Integer.parseInt(rangeHeader.replace("bytes=", "").replace("-", ""));
            var slice = java.util.Arrays.copyOfRange(full, start, full.length);
            exchange.sendResponseHeaders(206, slice.length);
            try (var os = exchange.getResponseBody()) {
                os.write(slice);
            }
        });

        var ref = ArtifactReference.get(baseUrl + "/ranged", "application/octet-stream", full.length, 0L);
        try (var stream = transfer.openRange(ref, 3)) {
            assertArrayEquals("3456789".getBytes(StandardCharsets.UTF_8), stream.readAllBytes());
        }
    }
}
