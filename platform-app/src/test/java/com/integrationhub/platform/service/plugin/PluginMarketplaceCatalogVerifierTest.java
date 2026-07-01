package com.integrationhub.platform.service.plugin;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PluginMarketplaceCatalogVerifierTest {

    @Test
    void acceptsCatalogWithMatchingIntegrityAndTrustedSignature() throws Exception {
        var fixture = fixture();

        assertDoesNotThrow(() -> fixture.verifier().verify(
                fixture.catalogUrl(),
                fixture.body(),
                Optional.of(fixture.integrity()),
                Optional.of(fixture.signature())));
    }

    @Test
    void rejectsCatalogWhenBodyDoesNotMatchIntegrity() throws Exception {
        var fixture = fixture();

        assertThrows(IllegalArgumentException.class, () -> fixture.verifier().verify(
                fixture.catalogUrl(),
                fixture.body() + " ",
                Optional.of(fixture.integrity()),
                Optional.of(fixture.signature())));
    }

    @Test
    void rejectsCatalogWhenSignatureKeyIsRevoked() throws Exception {
        var fixture = fixture(Set.of("market-key"));

        assertThrows(IllegalArgumentException.class, () -> fixture.verifier().verify(
                fixture.catalogUrl(),
                fixture.body(),
                Optional.of(fixture.integrity()),
                Optional.of(fixture.signature())));
    }

    private static Fixture fixture() throws Exception {
        return fixture(Set.of());
    }

    private static Fixture fixture(Set<String> revokedKeyIds) throws Exception {
        var keyPair = keyPair();
        var body = "{\"plugins\":[]}";
        var catalogUrl = "https://plugins.example.com/catalog.json";
        var integrity = integrity(body);
        var verifier = new PluginMarketplaceCatalogVerifier(
                Map.of("market-key", new PluginTrustMaterial(
                        "market-key",
                        keyPair.getPublic(),
                        Instant.parse("2999-01-01T00:00:00Z"))),
                revokedKeyIds,
                Clock.fixed(Instant.parse("2026-06-30T00:00:00Z"), ZoneOffset.UTC));
        return new Fixture(catalogUrl, body, integrity, sign(keyPair, catalogUrl, integrity), verifier);
    }

    private static KeyPair keyPair() throws Exception {
        var generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        return generator.generateKeyPair();
    }

    private static String integrity(String body) throws Exception {
        var digest = MessageDigest.getInstance("SHA-256")
                .digest(body.getBytes(StandardCharsets.UTF_8));
        return "sha256-" + Base64.getEncoder().encodeToString(digest);
    }

    private static String sign(KeyPair keyPair, String catalogUrl, String integrity) throws Exception {
        var signer = Signature.getInstance("SHA256withECDSA");
        signer.initSign(keyPair.getPrivate());
        signer.update(PluginMarketplaceCatalogVerifier.canonicalPayload(catalogUrl, integrity)
                .getBytes(StandardCharsets.UTF_8));
        return "market-key:" + Base64.getEncoder().encodeToString(signer.sign());
    }

    private record Fixture(
            String catalogUrl,
            String body,
            String integrity,
            String signature,
            PluginMarketplaceCatalogVerifier verifier) {
    }
}
