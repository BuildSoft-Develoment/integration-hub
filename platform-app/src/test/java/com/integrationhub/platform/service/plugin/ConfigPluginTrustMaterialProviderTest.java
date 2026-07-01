package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.service.secret.SecretResolver;
import com.integrationhub.platform.service.secret.SecretValueProvider;
import org.junit.jupiter.api.Test;

import java.security.KeyPairGenerator;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConfigPluginTrustMaterialProviderTest {

    @Test
    void loadsTrustMaterialAndRevocationsFromSecretReferences() throws Exception {
        var first = trustedKey("inline-key");
        var second = trustedKey("secret-key");
        var resolver = new SecretResolver(List.<SecretValueProvider>of(new SecretValueProvider() {
            @Override
            public boolean supports(String source) {
                return "config".equalsIgnoreCase(source);
            }

            @Override
            public Optional<String> resolve(String reference) {
                return switch (reference) {
                    case "plugins.trusted.keys" -> Optional.of(second);
                    case "plugins.revoked.keys" -> Optional.of("old-key,blocked-key");
                    default -> Optional.empty();
                };
            }
        }));

        var provider = new ConfigPluginTrustMaterialProvider(
                first,
                "${config:plugins.trusted.keys}",
                "",
                "",
                "PKCS12",
                resolver,
                "inline-revoked",
                "${config:plugins.revoked.keys}");

        assertEquals(2, provider.trustedPublicKeys().size());
        assertTrue(provider.trustedPublicKeys().containsKey("inline-key"));
        assertTrue(provider.trustedPublicKeys().containsKey("secret-key"));
        assertEquals(3, provider.revokedKeyIds().size());
        assertTrue(provider.revokedKeyIds().contains("blocked-key"));
    }

    private static String trustedKey(String keyId) throws Exception {
        var generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        var keyPair = generator.generateKeyPair();
        return keyId + ":" + Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
    }
}
