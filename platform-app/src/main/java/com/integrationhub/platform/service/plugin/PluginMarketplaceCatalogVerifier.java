package com.integrationhub.platform.service.plugin;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.Signature;
import java.time.Clock;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@ApplicationScoped
public class PluginMarketplaceCatalogVerifier {

    static final String INTEGRITY_HEADER = "X-Plugin-Catalog-Integrity";
    static final String SIGNATURE_HEADER = "X-Plugin-Catalog-Signature";

    private static final Pattern INTEGRITY_PATTERN =
            Pattern.compile("^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$");
    private static final Pattern SIGNATURE_PATTERN =
            Pattern.compile("^[A-Za-z0-9._:-]+:[A-Za-z0-9+/]+={0,2}$");

    private final Map<String, PluginTrustMaterial> trustedPublicKeys;
    private final Set<String> revokedKeyIds;
    private final Clock clock;

    @Inject
    public PluginMarketplaceCatalogVerifier(Instance<PluginTrustMaterialProvider> providers) {
        this(trustedPublicKeysFrom(providers), revokedKeyIdsFrom(providers), Clock.systemUTC());
    }

    PluginMarketplaceCatalogVerifier(
            Map<String, PluginTrustMaterial> trustedPublicKeys,
            Set<String> revokedKeyIds,
            Clock clock) {
        this.trustedPublicKeys = trustedPublicKeys == null ? Map.of() : Map.copyOf(trustedPublicKeys);
        this.revokedKeyIds = revokedKeyIds == null ? Set.of() : Set.copyOf(revokedKeyIds);
        this.clock = clock == null ? Clock.systemUTC() : clock;
    }

    public void verify(String catalogUrl, String body, Optional<String> integrity, Optional<String> signature) {
        if (integrity.isEmpty() || signature.isEmpty()) {
            throw new IllegalArgumentException("Plugin marketplace catalog must include integrity and signature headers");
        }
        var declaredIntegrity = integrity.get().trim();
        var declaredSignature = signature.get().trim();
        if (!INTEGRITY_PATTERN.matcher(declaredIntegrity).matches()) {
            throw new IllegalArgumentException("Plugin marketplace catalog integrity must use SRI sha256/384/512");
        }
        if (!SIGNATURE_PATTERN.matcher(declaredSignature).matches()) {
            throw new IllegalArgumentException("Plugin marketplace catalog signature must include key id and value");
        }
        verifyIntegrity(body, declaredIntegrity);
        verifySignature(catalogUrl, declaredIntegrity, declaredSignature);
    }

    private void verifyIntegrity(String body, String declaredIntegrity) {
        var separator = declaredIntegrity.indexOf('-');
        var algorithm = "SHA-" + declaredIntegrity.substring(3, separator);
        try {
            var digest = MessageDigest.getInstance(algorithm);
            var calculated = Base64.getEncoder().encodeToString(
                    digest.digest((body == null ? "" : body).getBytes(StandardCharsets.UTF_8)));
            var expected = declaredIntegrity.substring(separator + 1);
            if (!MessageDigest.isEqual(calculated.getBytes(StandardCharsets.UTF_8),
                    expected.getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Plugin marketplace catalog integrity does not match body");
            }
        } catch (GeneralSecurityException error) {
            throw new IllegalArgumentException("Plugin marketplace catalog integrity cannot be verified", error);
        }
    }

    private void verifySignature(String catalogUrl, String integrity, String declaredSignature) {
        var parts = declaredSignature.split(":", 2);
        var keyId = parts[0];
        if (revokedKeyIds.contains(keyId)) {
            throw new IllegalArgumentException("Plugin marketplace catalog signature key is revoked");
        }
        var trustedKey = trustedPublicKeys.get(keyId);
        if (trustedKey == null) {
            throw new IllegalArgumentException("Plugin marketplace catalog signature key is not trusted");
        }
        if (trustedKey.expiresAt() != null && !trustedKey.expiresAt().isAfter(clock.instant())) {
            throw new IllegalArgumentException("Plugin marketplace catalog signature key is expired");
        }
        try {
            var verifier = Signature.getInstance("SHA256withECDSA");
            verifier.initVerify(trustedKey.publicKey());
            verifier.update(canonicalPayload(catalogUrl, integrity).getBytes(StandardCharsets.UTF_8));
            var signatureBytes = Base64.getDecoder().decode(parts[1]);
            if (!verifier.verify(signatureBytes)) {
                throw new IllegalArgumentException("Plugin marketplace catalog signature is invalid");
            }
        } catch (GeneralSecurityException | IllegalArgumentException error) {
            if (error instanceof IllegalArgumentException illegalArgumentException) {
                throw illegalArgumentException;
            }
            throw new IllegalArgumentException("Plugin marketplace catalog signature cannot be verified", error);
        }
    }

    static String canonicalPayload(String catalogUrl, String integrity) {
        return catalogUrl.trim() + ":" + integrity.trim();
    }

    private static Map<String, PluginTrustMaterial> trustedPublicKeysFrom(
            Instance<PluginTrustMaterialProvider> providers) {
        if (providers == null) {
            return Map.of();
        }
        var keys = new LinkedHashMap<String, PluginTrustMaterial>();
        for (var provider : providers) {
            provider.trustedPublicKeys().forEach((keyId, material) -> {
                if (keys.putIfAbsent(keyId, material) != null) {
                    throw new IllegalArgumentException("Backend plugin trust material has duplicate key: " + keyId);
                }
            });
        }
        return Map.copyOf(keys);
    }

    private static Set<String> revokedKeyIdsFrom(Instance<PluginTrustMaterialProvider> providers) {
        if (providers == null) {
            return Set.of();
        }
        return providers.stream()
                .flatMap(provider -> provider.revokedKeyIds().stream())
                .collect(Collectors.toUnmodifiableSet());
    }
}
