package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskResult;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GrpcRemotePluginTransportTest {

    private final GrpcRemotePluginTransport transport = new GrpcRemotePluginTransport(new ObjectMapper());

    @Test
    void supportsOnlyGrpcDescriptorsWithEndpoint() {
        assertTrue(transport.supports(new RemotePluginDescriptor(
                "acme", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", "http://localhost:9090", true)));
        assertFalse(transport.supports(new RemotePluginDescriptor(
                "acme", "1.0.0", "1", Set.of("ACME_DO"), "KAFKA", true)));
        assertFalse(transport.supports(new RemotePluginDescriptor(
                "acme", "1.0.0", "1", Set.of("ACME_DO"), "GRPC", true)));
    }

    @Test
    void mapsSuccessfulGrpcResultToTaskResult() {
        var result = transport.toTaskResult(GrpcRemoteTaskResult.newBuilder()
                .setSuccess(true)
                .setDetails("done")
                .setOutputsJson("{\"remoteRef\":\"R-1\"}")
                .build());

        assertTrue(result.success());
        assertFalse(result.suspended());
        assertEquals("R-1", result.outputs().get("remoteRef"));
    }

    @Test
    void appliesTheConfiguredMaxMessageSizeAboveTheGrpcDefault() {
        // Default raises the 4 MiB gRPC ceiling to 16 MiB.
        assertEquals(16 * 1024 * 1024, transport.maxMessageBytes());
        // Explicit larger value is honoured.
        assertEquals(64 * 1024 * 1024,
                new GrpcRemotePluginTransport(new ObjectMapper(), 64 * 1024 * 1024).maxMessageBytes());
        // Absurdly small values are clamped to a safe floor.
        assertEquals(64 * 1024,
                new GrpcRemotePluginTransport(new ObjectMapper(), 10).maxMessageBytes());
    }

    @Test
    void mapsSuspendedGrpcResultToTaskResult() {
        var result = transport.toTaskResult(GrpcRemoteTaskResult.newBuilder()
                .setSuccess(true)
                .setSuspended(true)
                .setDetails("waiting")
                .setSuspendedStateJson("{\"idempotencyKey\":\"k\"}")
                .build());

        assertTrue(result.success());
        assertTrue(result.suspended());
        assertEquals("k", result.suspendedState().get("idempotencyKey"));
    }
}
