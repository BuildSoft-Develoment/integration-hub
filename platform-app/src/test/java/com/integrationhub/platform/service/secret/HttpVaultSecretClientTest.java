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


    // @trace ADR-031 D3, D4 (el contrato HTTP exacto contra la boveda)

    @Test
    void listsPathsAsAVaultListRequest() throws IOException {
        // LIST es un verbo propio de Vault y HttpClient rechaza metodos no estandar; la API acepta
        // GET con ?list=true, que es la forma documentada. Si eso cambiara, este test lo caza antes
        // de que la pantalla se quede sin claves en silencio.
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var uriSeen = new AtomicReference<String>();
        var tokenSeen = new AtomicReference<String>();
        server.createContext("/v1/secret/metadata/connections", exchange -> {
            uriSeen.set(exchange.getRequestURI().toString());
            tokenSeen.set(exchange.getRequestHeaders().getFirst("X-Vault-Token"));
            respond(exchange, 200, "{\"data\":{\"keys\":[\"db/\",\"sftp-banco\"]}}");
        });
        server.start();
        try {
            var client = new HttpVaultSecretClient(true, address(server), "test-token", "secret");

            assertEquals(java.util.List.of("db/", "sftp-banco"), client.listPaths("connections"));
            assertEquals("/v1/secret/metadata/connections?list=true", uriSeen.get());
            assertEquals("test-token", tokenSeen.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void readsFieldNamesFromSubkeysAndNeverFromData() throws IOException {
        // ADR-031 D4: por `subkeys` los valores llegan a null y NO salen de la boveda. Este test es
        // el que impide que un refactor lo cambie a `data` sin que nadie se entere.
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var pathSeen = new AtomicReference<String>();
        server.createContext("/v1/secret/subkeys/connections/db/ih-internal", exchange -> {
            pathSeen.set(exchange.getRequestURI().getPath());
            respond(exchange, 200, "{\"data\":{\"subkeys\":{\"username\":null,\"password\":null}}}");
        });
        server.start();
        try {
            var client = new HttpVaultSecretClient(true, address(server), "test-token", "secret");

            var campos = client.readFieldNames("connections/db/ih-internal");

            assertEquals(java.util.List.of("username", "password"), campos);
            assertEquals("/v1/secret/subkeys/connections/db/ih-internal", pathSeen.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void degradesToEmptyWhenThePolicyDeniesTheRequest() throws IOException {
        // Es el estado real de un despliegue sin las dos lineas de politica de D4. Un 403 aqui no es
        // un error de la aplicacion: es una capacidad que no hay, y la pantalla degrada (D3).
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/secret/subkeys/connections/x", exchange -> respond(exchange, 403, "{}"));
        server.createContext("/v1/secret/metadata/connections", exchange -> respond(exchange, 403, "{}"));
        server.start();
        try {
            var client = new HttpVaultSecretClient(true, address(server), "test-token", "secret");

            assertTrue(client.readFieldNames("connections/x").isEmpty());
            assertTrue(client.listPaths("connections").isEmpty());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void aPathWithStraySlashesDoesNotProduceADoubleSlash() throws IOException {
        // `/connections/` y `connections` son la misma carpeta. Sin normalizar, la URI saldria con
        // `//` y Vault contestaria 404 -indistinguible de "no hay nada ahi"-.
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var pathSeen = new AtomicReference<String>();
        server.createContext("/v1/secret/metadata/connections", exchange -> {
            pathSeen.set(exchange.getRequestURI().getPath());
            respond(exchange, 200, "{\"data\":{\"keys\":[]}}");
        });
        server.start();
        try {
            var client = new HttpVaultSecretClient(true, address(server), "test-token", "secret");

            client.listPaths("/connections/");

            assertEquals("/v1/secret/metadata/connections", pathSeen.get());
        } finally {
            server.stop(0);
        }
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
