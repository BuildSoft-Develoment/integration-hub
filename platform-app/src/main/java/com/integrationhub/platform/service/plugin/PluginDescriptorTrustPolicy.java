package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginDescriptor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Politica de activacion para plugins backend externos.
 *
 * <p>Esta capa valida procedencia operacional antes de publicar el descriptor en
 * el registry. El core no activa descriptores confiables sin metadatos de
 * integridad/firma, endpoint permitido y firma ECDSA valida contra una clave
 * publica confiable.</p>
 */
@ApplicationScoped
public class PluginDescriptorTrustPolicy {

    private static final Set<String> SUPPORTED_TRANSPORTS = Set.of("GRPC", "KAFKA");
    private static final Pattern INTEGRITY_PATTERN =
            Pattern.compile("^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$");
    private static final Pattern SIGNATURE_PATTERN =
            Pattern.compile("^[A-Za-z0-9._:-]+:[A-Za-z0-9+/]+={0,2}$");

    private final Set<String> allowedOrigins;
    private final Map<String, TrustedPublicKey> trustedPublicKeys;
    private final Set<String> revokedKeyIds;
    private final java.time.Clock clock;

    @Inject
    public PluginDescriptorTrustPolicy(
            @ConfigProperty(name = "integrationhub.plugins.backend.allowed-origins")
            Optional<String> allowedOrigins,
            @ConfigProperty(name = "integrationhub.plugins.backend.trusted-public-keys")
            Optional<String> trustedPublicKeys,
            @ConfigProperty(name = "integrationhub.plugins.backend.revoked-key-ids")
            Optional<String> revokedKeyIds) {
        this(
                parseAllowedOrigins(allowedOrigins.orElse("")),
                parseTrustedPublicKeys(trustedPublicKeys.orElse("")),
                parseRevokedKeyIds(revokedKeyIds.orElse("")),
                java.time.Clock.systemUTC(),
                true);
    }

    PluginDescriptorTrustPolicy(Set<String> allowedOrigins) {
        this(allowedOrigins, Map.of());
    }

    PluginDescriptorTrustPolicy(String allowedOrigins, String trustedPublicKeys, String revokedKeyIds) {
        this(
                parseAllowedOrigins(allowedOrigins),
                parseTrustedPublicKeys(trustedPublicKeys),
                parseRevokedKeyIds(revokedKeyIds),
                java.time.Clock.systemUTC(),
                true);
    }

    PluginDescriptorTrustPolicy(Set<String> allowedOrigins, Map<String, PublicKey> trustedPublicKeys) {
        this(allowedOrigins, trustedPublicKeys, Set.of(), java.time.Clock.systemUTC());
    }

    PluginDescriptorTrustPolicy(Set<String> allowedOrigins,
                                Map<String, PublicKey> trustedPublicKeys,
                                Set<String> revokedKeyIds,
                                java.time.Clock clock) {
        this(allowedOrigins, wrapTrustedPublicKeys(trustedPublicKeys), revokedKeyIds, clock, true);
    }

    private PluginDescriptorTrustPolicy(Set<String> allowedOrigins,
                                        Map<String, TrustedPublicKey> trustedPublicKeys,
                                        Set<String> revokedKeyIds,
                                        java.time.Clock clock,
                                        boolean parsedKeys) {
        this.allowedOrigins = allowedOrigins == null ? Set.of() : Set.copyOf(allowedOrigins);
        this.trustedPublicKeys = trustedPublicKeys == null ? Map.of() : Map.copyOf(trustedPublicKeys);
        this.revokedKeyIds = revokedKeyIds == null ? Set.of() : Set.copyOf(revokedKeyIds);
        this.clock = clock == null ? java.time.Clock.systemUTC() : clock;
    }

    public void validate(PluginDescriptor descriptor) {
        if (descriptor == null) {
            throw new IllegalArgumentException("Plugin descriptor is required");
        }
        requireText(descriptor.id, "Plugin id is required");
        requireText(descriptor.version, "Plugin " + descriptor.id + " version is required");
        requireText(descriptor.spiVersion, "Plugin " + descriptor.id + " spiVersion is required");

        var transport = normalizeTransport(descriptor.transport, descriptor.id);
        if ("GRPC".equals(transport)) {
            validateEndpoint(descriptor.id, descriptor.endpoint);
        }

        if (descriptor.trusted) {
            requireTrustedMetadata(descriptor);
        }
    }

    private void validateEndpoint(String pluginId, String endpoint) {
        requireText(endpoint, "Plugin " + pluginId + " endpoint is required for GRPC transport");
        URI uri;
        try {
            uri = URI.create(endpoint.trim());
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("Plugin " + pluginId + " endpoint is not a valid URI", error);
        }

        var scheme = uri.getScheme();
        var host = uri.getHost();
        if (scheme == null || host == null || uri.getRawAuthority() == null) {
            throw new IllegalArgumentException("Plugin " + pluginId + " endpoint must include scheme and host");
        }

        var normalizedScheme = scheme.toLowerCase(Locale.ROOT);
        if (!"https".equals(normalizedScheme) && !"http".equals(normalizedScheme)) {
            throw new IllegalArgumentException("Plugin " + pluginId + " endpoint scheme is not allowed");
        }

        var local = isLocalHost(host);
        if ("http".equals(normalizedScheme) && !local) {
            throw new IllegalArgumentException("Plugin " + pluginId + " endpoint must use HTTPS outside local dev");
        }

        if (!local && !allowedOrigins.contains(originOf(uri))) {
            throw new IllegalArgumentException("Plugin " + pluginId + " endpoint origin is not allowlisted");
        }
    }

    private void requireTrustedMetadata(PluginDescriptor descriptor) {
        requireText(descriptor.integrity, "Plugin " + descriptor.id + " integrity is required when trusted");
        requireText(descriptor.signature, "Plugin " + descriptor.id + " signature is required when trusted");

        if (!INTEGRITY_PATTERN.matcher(descriptor.integrity.trim()).matches()) {
            throw new IllegalArgumentException("Plugin " + descriptor.id + " integrity must use SRI sha256/384/512");
        }
        if (!SIGNATURE_PATTERN.matcher(descriptor.signature.trim()).matches()) {
            throw new IllegalArgumentException("Plugin " + descriptor.id + " signature must include key id and value");
        }
        verifySignature(descriptor);
    }

    private void verifySignature(PluginDescriptor descriptor) {
        var signatureParts = descriptor.signature.trim().split(":", 2);
        var keyId = signatureParts[0];
        if (revokedKeyIds.contains(keyId)) {
            throw new IllegalArgumentException("Plugin " + descriptor.id + " signature key is revoked");
        }
        var trustedKey = trustedPublicKeys.get(keyId);
        if (trustedKey == null) {
            throw new IllegalArgumentException("Plugin " + descriptor.id + " signature key is not trusted");
        }
        if (trustedKey.expired(clock.instant())) {
            throw new IllegalArgumentException("Plugin " + descriptor.id + " signature key is expired");
        }
        try {
            var verifier = Signature.getInstance("SHA256withECDSA");
            verifier.initVerify(trustedKey.publicKey());
            verifier.update(canonicalPayload(descriptor).getBytes(StandardCharsets.UTF_8));
            var signatureBytes = Base64.getDecoder().decode(signatureParts[1]);
            if (!verifier.verify(signatureBytes)) {
                throw new IllegalArgumentException("Plugin " + descriptor.id + " signature is invalid");
            }
        } catch (GeneralSecurityException | IllegalArgumentException error) {
            if (error instanceof IllegalArgumentException illegalArgumentException) {
                throw illegalArgumentException;
            }
            throw new IllegalArgumentException("Plugin " + descriptor.id + " signature cannot be verified", error);
        }
    }

    private String normalizeTransport(String transport, String pluginId) {
        requireText(transport, "Plugin " + pluginId + " transport is required");
        var normalized = transport.trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_TRANSPORTS.contains(normalized)) {
            throw new IllegalArgumentException("Plugin " + pluginId + " transport is not supported");
        }
        return normalized;
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private static boolean isLocalHost(String host) {
        return "localhost".equalsIgnoreCase(host)
                || "127.0.0.1".equals(host)
                || "::1".equals(host)
                || "0:0:0:0:0:0:0:1".equals(host);
    }

    private static String originOf(URI uri) {
        var port = uri.getPort();
        return uri.getScheme().toLowerCase(Locale.ROOT)
                + "://"
                + uri.getHost().toLowerCase(Locale.ROOT)
                + (port >= 0 ? ":" + port : "");
    }

    private static Set<String> parseAllowedOrigins(String raw) {
        if (raw == null || raw.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(PluginDescriptorTrustPolicy::normalizeOrigin)
                .collect(Collectors.toUnmodifiableSet());
    }

    private static Map<String, TrustedPublicKey> parseTrustedPublicKeys(String raw) {
        if (raw == null || raw.isBlank()) {
            return Map.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(PluginDescriptorTrustPolicy::parseTrustedPublicKey)
                .collect(Collectors.toUnmodifiableMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private static Map.Entry<String, TrustedPublicKey> parseTrustedPublicKey(String rawKey) {
        var parts = rawKey.split(":", 3);
        if (parts.length < 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new IllegalArgumentException(
                    "Backend plugin trusted public key must be keyId:base64X509[:expiresAtUtc]");
        }
        try {
            var encoded = Base64.getDecoder().decode(parts[1].trim());
            var publicKey = KeyFactory.getInstance("EC").generatePublic(new X509EncodedKeySpec(encoded));
            var expiresAt = parts.length == 3 && !parts[2].isBlank()
                    ? Instant.parse(parts[2].trim())
                    : null;
            return Map.entry(parts[0].trim(), new TrustedPublicKey(publicKey, expiresAt));
        } catch (GeneralSecurityException | IllegalArgumentException error) {
            throw new IllegalArgumentException("Backend plugin trusted public key is invalid: " + parts[0].trim(), error);
        }
    }

    private static Set<String> parseRevokedKeyIds(String raw) {
        if (raw == null || raw.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    private static Map<String, TrustedPublicKey> wrapTrustedPublicKeys(Map<String, PublicKey> rawKeys) {
        if (rawKeys == null || rawKeys.isEmpty()) {
            return Map.of();
        }
        return rawKeys.entrySet().stream()
                .collect(Collectors.toUnmodifiableMap(
                        entry -> entry.getKey().trim(),
                        entry -> new TrustedPublicKey(entry.getValue(), null)));
    }

    private static String normalizeOrigin(String rawOrigin) {
        var uri = URI.create(rawOrigin);
        var hasPath = uri.getRawPath() != null && !uri.getRawPath().isBlank();
        if (uri.getScheme() == null || uri.getHost() == null || hasPath) {
            throw new IllegalArgumentException("Backend plugin allowed origin must be scheme://host[:port]");
        }
        return originOf(uri);
    }

    static String canonicalPayload(PluginDescriptor descriptor) {
        return descriptor.id.trim() + "@" + descriptor.version.trim() + ":" + descriptor.integrity.trim();
    }

    private record TrustedPublicKey(PublicKey publicKey, Instant expiresAt) {
        boolean expired(Instant now) {
            return expiresAt != null && !expiresAt.isAfter(now);
        }
    }
}
