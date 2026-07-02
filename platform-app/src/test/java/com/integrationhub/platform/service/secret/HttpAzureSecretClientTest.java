package com.integrationhub.platform.service.secret;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HttpAzureSecretClientTest {

    @Test
    void readsTheJsonSecretValueWithBearerTokenAndApiVersion() throws IOException {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var authSeen = new AtomicReference<String>();
        var querySeen = new AtomicReference<String>();
        server.createContext("/secrets/acme-bank", exchange -> {
            authSeen.set(exchange.getRequestHeaders().getFirst("Authorization"));
            querySeen.set(exchange.getRequestURI().getQuery());
            // Azure returns the secret content as a string in `value`.
            respond(exchange, 200, "{\"value\":\"{\\\"apiKey\\\":\\\"azure-secret\\\"}\"}");
        });
        server.start();
        try {
            var client = new HttpAzureSecretClient(true, address(server), "tok");

            var secret = client.readSecret("acme-bank");

            assertTrue(secret.isPresent());
            assertEquals("azure-secret", secret.get().get("apiKey"));
            assertEquals("Bearer tok", authSeen.get());
            assertEquals("api-version=7.4", querySeen.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void returnsEmptyWhenDisabledOrUnconfigured() {
        assertTrue(new HttpAzureSecretClient(false, "http://127.0.0.1:1", "tok")
                .readSecret("acme-bank").isEmpty());
        assertTrue(new HttpAzureSecretClient(true, "", "tok").readSecret("acme-bank").isEmpty());
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
