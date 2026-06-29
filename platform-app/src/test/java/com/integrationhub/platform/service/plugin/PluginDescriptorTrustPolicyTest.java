package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginDescriptor;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PluginDescriptorTrustPolicyTest {

    @Test
    void allowsTrustedGrpcDescriptorOnLocalhostForDev() {
        var policy = new PluginDescriptorTrustPolicy(Set.of());
        var descriptor = descriptor("http://localhost:9090");

        assertDoesNotThrow(() -> policy.validate(descriptor));
    }

    @Test
    void rejectsTrustedDescriptorWithoutIntegrity() {
        var policy = new PluginDescriptorTrustPolicy(Set.of());
        var descriptor = descriptor("http://localhost:9090");
        descriptor.integrity = null;

        assertThrows(IllegalArgumentException.class, () -> policy.validate(descriptor));
    }

    @Test
    void rejectsTrustedDescriptorWithoutSignature() {
        var policy = new PluginDescriptorTrustPolicy(Set.of());
        var descriptor = descriptor("http://localhost:9090");
        descriptor.signature = "not-a-signature";

        assertThrows(IllegalArgumentException.class, () -> policy.validate(descriptor));
    }

    @Test
    void rejectsNonLocalHttpEndpoint() {
        var policy = new PluginDescriptorTrustPolicy(Set.of());
        var descriptor = descriptor("http://plugins.example.com:9090");

        assertThrows(IllegalArgumentException.class, () -> policy.validate(descriptor));
    }

    @Test
    void rejectsHttpsEndpointOutsideAllowlist() {
        var policy = new PluginDescriptorTrustPolicy(Set.of());
        var descriptor = descriptor("https://plugins.example.com:9443");

        assertThrows(IllegalArgumentException.class, () -> policy.validate(descriptor));
    }

    @Test
    void allowsHttpsEndpointWhenOriginIsAllowlisted() {
        var policy = new PluginDescriptorTrustPolicy(Set.of("https://plugins.example.com:9443"));
        var descriptor = descriptor("https://plugins.example.com:9443/acme");

        assertDoesNotThrow(() -> policy.validate(descriptor));
    }

    @Test
    void rejectsUnsupportedTransport() {
        var policy = new PluginDescriptorTrustPolicy(Set.of());
        var descriptor = descriptor("http://localhost:9090");
        descriptor.transport = "IN_PROCESS";

        assertThrows(IllegalArgumentException.class, () -> policy.validate(descriptor));
    }

    @Test
    void rejectsDescriptorWithoutId() {
        var policy = new PluginDescriptorTrustPolicy(Set.of());
        var descriptor = descriptor("http://localhost:9090");
        descriptor.id = " ";

        assertThrows(IllegalArgumentException.class, () -> policy.validate(descriptor));
    }

    @Test
    void allowsKafkaDescriptorWithoutEndpoint() {
        var policy = new PluginDescriptorTrustPolicy(Set.of());
        var descriptor = descriptor(null);
        descriptor.transport = "KAFKA";

        assertDoesNotThrow(() -> policy.validate(descriptor));
    }

    private PluginDescriptor descriptor(String endpoint) {
        var descriptor = new PluginDescriptor();
        descriptor.id = "acme";
        descriptor.version = "1.0.0";
        descriptor.spiVersion = "1";
        descriptor.providedTypesJson = "[\"ACME_DO\"]";
        descriptor.transport = "GRPC";
        descriptor.endpoint = endpoint;
        descriptor.trusted = true;
        descriptor.active = true;
        descriptor.integrity = "sha256-YWJjZA==";
        descriptor.signature = "dev-key:YWJjZA==";
        return descriptor;
    }
}
