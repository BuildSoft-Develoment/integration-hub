package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginDescriptor;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PluginDescriptorTrustPolicyTest {

    @Test
    void allowsTrustedGrpcDescriptorWithValidSignatureOnLocalhostForDev() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("http://localhost:9090");

        assertDoesNotThrow(() -> fixture.policy().validate(descriptor));
    }

    @Test
    void rejectsTrustedDescriptorWithoutIntegrity() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("http://localhost:9090");
        descriptor.integrity = null;

        assertThrows(IllegalArgumentException.class, () -> fixture.policy().validate(descriptor));
    }

    @Test
    void rejectsTrustedDescriptorWithoutSignature() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("http://localhost:9090");
        descriptor.signature = "not-a-signature";

        assertThrows(IllegalArgumentException.class, () -> fixture.policy().validate(descriptor));
    }

    @Test
    void rejectsNonLocalHttpEndpoint() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("http://plugins.example.com:9090");

        assertThrows(IllegalArgumentException.class, () -> fixture.policy().validate(descriptor));
    }

    @Test
    void rejectsHttpsEndpointOutsideAllowlist() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("https://plugins.example.com:9443");

        assertThrows(IllegalArgumentException.class, () -> fixture.policy().validate(descriptor));
    }

    @Test
    void allowsHttpsEndpointWhenOriginIsAllowlisted() throws Exception {
        var fixture = signedFixture(Set.of("https://plugins.example.com:9443"));
        var descriptor = fixture.descriptor("https://plugins.example.com:9443/acme");

        assertDoesNotThrow(() -> fixture.policy().validate(descriptor));
    }

    @Test
    void rejectsUnsupportedTransport() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("http://localhost:9090");
        descriptor.transport = "IN_PROCESS";

        assertThrows(IllegalArgumentException.class, () -> fixture.policy().validate(descriptor));
    }

    @Test
    void rejectsDescriptorWithoutId() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("http://localhost:9090");
        descriptor.id = " ";

        assertThrows(IllegalArgumentException.class, () -> fixture.policy().validate(descriptor));
    }

    @Test
    void allowsKafkaDescriptorWithoutEndpoint() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor(null);
        descriptor.transport = "KAFKA";

        assertDoesNotThrow(() -> fixture.policy().validate(descriptor));
    }

    @Test
    void rejectsTrustedDescriptorWhenKeyIsNotTrusted() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("http://localhost:9090");
        var policyWithoutKeys = new PluginDescriptorTrustPolicy(Set.of());

        assertThrows(IllegalArgumentException.class, () -> policyWithoutKeys.validate(descriptor));
    }

    @Test
    void rejectsTrustedDescriptorWhenSignedPayloadWasTampered() throws Exception {
        var fixture = signedFixture(Set.of());
        var descriptor = fixture.descriptor("http://localhost:9090");
        descriptor.version = "1.0.1";

        assertThrows(IllegalArgumentException.class, () -> fixture.policy().validate(descriptor));
    }

    @Test
    void rejectsTrustedDescriptorWhenKeyIsRevoked() throws Exception {
        var keyPair = keyPair();
        var policy = new PluginDescriptorTrustPolicy(
                Set.of(),
                Map.of("dev-key", keyPair.getPublic()),
                Set.of("dev-key"),
                fixedClock("2026-06-29T00:00:00Z"));
        var descriptor = descriptor("http://localhost:9090", keyPair);

        assertThrows(IllegalArgumentException.class, () -> policy.validate(descriptor));
    }

    @Test
    void rejectsTrustedDescriptorWhenKeyIsExpired() throws Exception {
        var keyPair = keyPair();
        var encoded = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
        var policy = new PluginDescriptorTrustPolicy(
                "",
                "dev-key:" + encoded + ":2026-01-01T00:00:00Z",
                "");
        var descriptor = descriptor("http://localhost:9090", keyPair);

        assertThrows(IllegalArgumentException.class, () -> policy.validate(descriptor));
    }

    @Test
    void allowsTrustedDescriptorWhenConfiguredKeyExpiresInFuture() throws Exception {
        var keyPair = keyPair();
        var encoded = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
        var policy = new PluginDescriptorTrustPolicy(
                "",
                "dev-key:" + encoded + ":2999-01-01T00:00:00Z",
                "");
        var descriptor = descriptor("http://localhost:9090", keyPair);

        assertDoesNotThrow(() -> policy.validate(descriptor));
    }

    private SignedFixture signedFixture(Set<String> allowedOrigins) throws Exception {
        var keyPair = keyPair();
        return new SignedFixture(
                new PluginDescriptorTrustPolicy(allowedOrigins, Map.of("dev-key", keyPair.getPublic())),
                keyPair);
    }

    private KeyPair keyPair() throws Exception {
        var generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        return generator.generateKeyPair();
    }

    private Clock fixedClock(String instant) {
        return Clock.fixed(Instant.parse(instant), ZoneOffset.UTC);
    }

    private String sign(KeyPair keyPair, PluginDescriptor descriptor) throws Exception {
        var signer = Signature.getInstance("SHA256withECDSA");
        signer.initSign(keyPair.getPrivate());
        signer.update(PluginDescriptorTrustPolicy.canonicalPayload(descriptor).getBytes(StandardCharsets.UTF_8));
        return "dev-key:" + Base64.getEncoder().encodeToString(signer.sign());
    }

    private PluginDescriptor descriptor(String endpoint, KeyPair keyPair) throws Exception {
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
        descriptor.signature = sign(keyPair, descriptor);
        return descriptor;
    }

    private final class SignedFixture {
        private final PluginDescriptorTrustPolicy policy;
        private final KeyPair keyPair;

        private SignedFixture(PluginDescriptorTrustPolicy policy, KeyPair keyPair) {
            this.policy = policy;
            this.keyPair = keyPair;
        }

        PluginDescriptorTrustPolicy policy() {
            return policy;
        }

        PluginDescriptor descriptor(String endpoint) throws Exception {
            return PluginDescriptorTrustPolicyTest.this.descriptor(endpoint, keyPair);
        }
    }
}
