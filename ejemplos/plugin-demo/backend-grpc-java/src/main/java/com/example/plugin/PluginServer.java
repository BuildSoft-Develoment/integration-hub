package com.example.plugin;

import io.grpc.Grpc;
import io.grpc.InsecureServerCredentials;
import io.grpc.Server;

import java.io.IOException;
import java.util.logging.Logger;

/**
 * Bootstrap del servidor gRPC del plugin. Responsabilidad unica: ciclo de vida
 * (bind del puerto, arranque, shutdown limpio). El puerto se toma de la variable de
 * entorno {@code PLUGIN_GRPC_PORT} (default 50061) para que el contenedor lo controle.
 *
 * <p>Plaintext (h2c): la terminacion TLS se delega al ingress/sidecar del despliegue.
 * La plataforma se conecta con {@code endpoint=http://host:port} (usePlaintext).</p>
 */
public final class PluginServer {

    private static final Logger LOG = Logger.getLogger(PluginServer.class.getName());
    private static final int DEFAULT_PORT = 50061;

    private final int port;
    private Server server;

    public PluginServer(int port) {
        this.port = port;
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        var port = resolvePort();
        var server = new PluginServer(port);
        server.start();
        server.blockUntilShutdown();
    }

    static int resolvePort() {
        var raw = System.getenv("PLUGIN_GRPC_PORT");
        if (raw == null || raw.isBlank()) {
            return DEFAULT_PORT;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("PLUGIN_GRPC_PORT must be an integer, got '" + raw + "'");
        }
    }

    public void start() throws IOException {
        server = Grpc.newServerBuilderForPort(port, InsecureServerCredentials.create())
                .addService(new RemotePluginServiceImpl())
                .build()
                .start();
        LOG.info(() -> "DEMO_TRANSFORM_JAVA gRPC plugin listening on port " + port);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("Shutting down gRPC plugin server");
            try {
                PluginServer.this.stop();
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
            }
        }));
    }

    public void stop() throws InterruptedException {
        if (server != null) {
            server.shutdown();
        }
    }

    public void blockUntilShutdown() throws InterruptedException {
        if (server != null) {
            server.awaitTermination();
        }
    }
}
