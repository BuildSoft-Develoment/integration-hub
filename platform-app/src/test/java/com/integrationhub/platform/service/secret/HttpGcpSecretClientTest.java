package com.integrationhub.platform.service.secret;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HttpGcpSecretClientTest {

    @Test
    void readsAndDecodesTheBase64JsonPayloadWithBearerToken() throws IOException {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var authSeen = new AtomicReference<String>();
        var base64 = Base64.getEncoder()
                .encodeToString("{\"apiKey\":\"gcp-secret\"}".getBytes(StandardCharsets.UTF_8));
        server.createContext("/v1/projects/demo/secrets/acme-bank/versions/latest:access", exchange -> {
            authSeen.set(exchange.getRequestHeaders().getFirst("Authorization"));
            respond(exchange, 200, "{\"payload\":{\"data\":\"" + base64 + "\"}}");
        });
        server.start();
        try {
            var client = new HttpGcpSecretClient(true, address(server), "demo", "tok");

            var secret = client.readSecret("acme-bank");

            assertTrue(secret.isPresent());
            assertEquals("gcp-secret", secret.get().get("apiKey"));
            assertEquals("Bearer tok", authSeen.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void returnsEmptyWhenDisabledOrUnconfigured() {
        assertTrue(new HttpGcpSecretClient(false, "http://127.0.0.1:1", "demo", "tok")
                .readSecret("acme-bank").isEmpty());
        assertTrue(new HttpGcpSecretClient(true, "http://127.0.0.1:1", "", "tok")
                .readSecret("acme-bank").isEmpty());
    }

    private static String address(HttpServer server) {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    private static void respond(HttpExchange exchange, int status, String body) throws IOException {
        var bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (var os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
