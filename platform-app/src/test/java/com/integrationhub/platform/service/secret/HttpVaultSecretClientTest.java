package com.integrationhub.platform.service.secret;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HttpVaultSecretClientTest {

    @Test
    void readsAKvV2SecretSendingTheVaultToken() throws IOException {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var tokenSeen = new AtomicReference<String>();
        var pathSeen = new AtomicReference<String>();
        server.createContext("/v1/secret/data/payments/acme-bank", exchange -> {
            tokenSeen.set(exchange.getRequestHeaders().getFirst("X-Vault-Token"));
            pathSeen.set(exchange.getRequestURI().getPath());
            respond(exchange, 200, "{\"data\":{\"data\":{\"apiKey\":\"s3cr3t\",\"user\":\"acme\"}}}");
        });
        server.start();
        try {
            var client = new HttpVaultSecretClient(true, address(server), "test-token", "secret");

            var secret = client.readSecret("payments/acme-bank");

            assertTrue(secret.isPresent());
            assertEquals("s3cr3t", secret.get().get("apiKey"));
            assertEquals("acme", secret.get().get("user"));
            assertEquals("test-token", tokenSeen.get());
            assertEquals("/v1/secret/data/payments/acme-bank", pathSeen.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void returnsEmptyWhenDisabled() {
        var client = new HttpVaultSecretClient(false, "http://127.0.0.1:1", "test-token", "secret");

        assertTrue(client.readSecret("payments/acme-bank").isEmpty());
    }

    @Test
    void returnsEmptyOnANon200Response() throws IOException {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/secret/data/missing/x", exchange -> respond(exchange, 404, "{}"));
        server.start();
        try {
            var client = new HttpVaultSecretClient(true, address(server), "test-token", "secret");

            assertTrue(client.readSecret("missing/x").isEmpty());
        } finally {
            server.stop(0);
        }
    }

    private static String address(HttpServer server) {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    private static void respond(com.sun.net.httpserver.HttpExchange exchange, int status, String body)
            throws IOException {
        var bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (var os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
