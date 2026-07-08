package com.example.plugin;

import com.sun.net.httpserver.HttpServer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskRequest;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskResult;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DemoRemoteCsvReaderTest {

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void readsCsvPagesFromArtifactRefUsingRangeCursor() throws Exception {
        var content = "alice,10\nbob,20\ncarol,30".getBytes(StandardCharsets.UTF_8);
        var url = startRangeServer(content);
        var reader = new DemoRemoteCsvReader();

        var first = reader.read(Map.of(
                "artifactRef", Map.of("uri", url, "method", "GET"),
                "batchSize", 2,
                "configuration", Map.of("columns", List.of("name", "amount"))));

        @SuppressWarnings("unchecked")
        var firstRecords = (List<Map<String, Object>>) first.get("records");
        assertEquals(2, firstRecords.size());
        assertEquals("alice", firstRecords.get(0).get("name"));
        assertEquals("20", firstRecords.get(1).get("amount"));
        assertTrue(first.containsKey("nextCursor"));

        var second = reader.read(Map.of(
                "artifactRef", Map.of("uri", url, "method", "GET"),
                "batchSize", 2,
                "cursor", first.get("nextCursor"),
                "configuration", Map.of("columns", List.of("name", "amount"))));

        @SuppressWarnings("unchecked")
        var secondRecords = (List<Map<String, Object>>) second.get("records");
        assertEquals(1, secondRecords.size());
        assertEquals("carol", secondRecords.get(0).get("name"));
        assertFalse(second.containsKey("nextCursor"));
    }

    @Test
    void grpcServiceRoutesReaderReadTaskTypeToRemoteCsvReader() throws Exception {
        var content = "ana,11\n".getBytes(StandardCharsets.UTF_8);
        var url = startRangeServer(content);
        var mapper = new ObjectMapper();
        var service = new RemotePluginServiceImpl();
        var observer = new RecordingObserver();

        service.execute(GrpcRemoteTaskRequest.newBuilder()
                .setPluginId("demo-transform-java")
                .setPluginVersion("1.0.0")
                .setSpiVersion("2.0.0")
                .setTaskType(DemoRemoteCsvReader.TASK_TYPE)
                .setConfigurationJson(mapper.writeValueAsString(Map.of(
                        "artifactRef", Map.of("uri", url, "method", "GET"),
                        "batchSize", 10,
                        "configuration", Map.of("columns", List.of("name", "amount")))))
                .build(), observer);

        assertNull(observer.error.get());
        var response = observer.response.get();
        assertTrue(response.getSuccess());
        var outputs = mapper.readValue(response.getOutputsJson(), Map.class);
        @SuppressWarnings("unchecked")
        var records = (List<Map<String, Object>>) outputs.get("records");
        assertEquals(1, records.size());
        assertEquals("ana", records.get(0).get("name"));
        assertEquals("11", records.get(0).get("amount"));
    }

    private String startRangeServer(byte[] content) throws Exception {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/artifact.csv", exchange -> {
            var range = exchange.getRequestHeaders().getFirst("Range");
            var offset = 0;
            if (range != null && range.startsWith("bytes=") && range.endsWith("-")) {
                offset = Integer.parseInt(range.substring("bytes=".length(), range.length() - 1));
            }
            var safeOffset = Math.max(0, Math.min(offset, content.length));
            var response = java.util.Arrays.copyOfRange(content, safeOffset, content.length);
            exchange.sendResponseHeaders(range == null ? 200 : 206, response.length);
            try (var body = exchange.getResponseBody()) {
                body.write(response);
            }
        });
        server.start();
        return "http://localhost:" + server.getAddress().getPort() + "/artifact.csv";
    }

    private static final class RecordingObserver implements StreamObserver<GrpcRemoteTaskResult> {
        private final AtomicReference<GrpcRemoteTaskResult> response = new AtomicReference<>();
        private final AtomicReference<Throwable> error = new AtomicReference<>();

        @Override
        public void onNext(GrpcRemoteTaskResult value) {
            response.set(value);
        }

        @Override
        public void onError(Throwable throwable) {
            error.set(throwable);
        }

        @Override
        public void onCompleted() {
        }
    }
}
