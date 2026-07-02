package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.service.secret.SecretResolver;
import io.quarkus.arc.DefaultBean;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.PublicKey;
import java.security.cert.X509Certificate;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
@DefaultBean
public class ConfigPluginTrustMaterialProvider implements PluginTrustMaterialProvider {

    private final Map<String, PluginTrustMaterial> trustedPublicKeys;
    private final Set<String> revokedKeyIds;

    @Inject
    public ConfigPluginTrustMaterialProvider(
            @ConfigProperty(name = "integrationhub.plugins.backend.trusted-public-keys")
            Optional<String> trustedPublicKeys,
            @ConfigProperty(name = "integrationhub.plugins.backend.trusted-public-keys-ref")
            Optional<String> trustedPublicKeysRef,
            @ConfigProperty(name = "integrationhub.plugins.backend.trust-store.path")
            Optional<String> trustStorePath,
            @ConfigProperty(name = "integrationhub.plugins.backend.trust-store.password")
            Optional<String> trustStorePassword,
            @ConfigProperty(name = "integrationhub.plugins.backend.trust-store.type", defaultValue = "PKCS12")
            String trustStoreType,
            @ConfigProperty(name = "integrationhub.plugins.backend.revoked-key-ids")
            Optional<String> revokedKeyIds,
            @ConfigProperty(name = "integrationhub.plugins.backend.revoked-key-ids-ref")
            Optional<String> revokedKeyIdsRef,
            SecretResolver secretResolver) {
        this.trustedPublicKeys = loadTrustedKeys(
                mergeSecretBackedValue(trustedPublicKeys.orElse(""), trustedPublicKeysRef.orElse(""), secretResolver),
                trustStorePath.orElse(""),
                trustStorePassword.orElse(""),
                trustStoreType,
                secretResolver);
        this.revokedKeyIds = parseRevokedKeyIds(
                mergeSecretBackedValue(revokedKeyIds.orElse(""), revokedKeyIdsRef.orElse(""), secretResolver));
    }

    ConfigPluginTrustMaterialProvider(String trustedPublicKeys,
                                      String trustStorePath,
                                      String trustStorePassword,
                                      String trustStoreType,
                                      SecretResolver secretResolver,
                                      String revokedKeyIds) {
        this(trustedPublicKeys, "", trustStorePath, trustStorePassword, trustStoreType, secretResolver, revokedKeyIds, "");
    }

    ConfigPluginTrustMaterialProvider(String trustedPublicKeys,
                                      String trustedPublicKeysRef,
                                      String trustStorePath,
                                      String trustStorePassword,
                                      String trustStoreType,
                                      SecretResolver secretResolver,
                                      String revokedKeyIds,
                                      String revokedKeyIdsRef) {
        this.trustedPublicKeys = loadTrustedKeys(
                mergeSecretBackedValue(trustedPublicKeys, trustedPublicKeysRef, secretResolver),
                trustStorePath,
                trustStorePassword,
                trustStoreType,
                secretResolver);
        this.revokedKeyIds = parseRevokedKeyIds(mergeSecretBackedValue(revokedKeyIds, revokedKeyIdsRef, secretResolver));
    }

    @Override
    public Map<String, PluginTrustMaterial> trustedPublicKeys() {
        return trustedPublicKeys;
    }

    @Override
    public Set<String> revokedKeyIds() {
        return revokedKeyIds;
    }

    static Map<String, PluginTrustMaterial> parseTrustedPublicKeys(String raw) {
        if (raw == null || raw.isBlank()) {
            return Map.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(ConfigPluginTrustMaterialProvider::parseTrustedPublicKey)
                .collect(Collectors.toUnmodifiableMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private static Map.Entry<String, PluginTrustMaterial> parseTrustedPublicKey(String rawKey) {
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
            return Map.entry(parts[0].trim(), new PluginTrustMaterial(parts[0].trim(), publicKey, expiresAt));
        } catch (GeneralSecurityException | IllegalArgumentException error) {
            throw new IllegalArgumentException("Backend plugin trusted public key is invalid: " + parts[0].trim(), error);
        }
    }

    private static Map<String, PluginTrustMaterial> loadTrustedKeys(
            String trustedPublicKeys,
            String trustStorePath,
            String trustStorePassword,
            String trustStoreType,
            SecretResolver secretResolver) {
        var keys = new LinkedHashMap<>(parseTrustedPublicKeys(trustedPublicKeys));
        loadTrustStore(trustStorePath, trustStorePassword, trustStoreType, secretResolver)
                .forEach((keyId, material) -> {
                    if (keys.putIfAbsent(keyId, material) != null) {
                        throw new IllegalArgumentException("Backend plugin trust material has duplicate key: " + keyId);
                    }
                });
        return Map.copyOf(keys);
    }

    private static Map<String, PluginTrustMaterial> loadTrustStore(
            String trustStorePath,
            String trustStorePassword,
            String trustStoreType,
            SecretResolver secretResolver) {
        if (trustStorePath == null || trustStorePath.isBlank()) {
            return Map.of();
        }
        try (InputStream stream = Files.newInputStream(Path.of(trustStorePath.trim()))) {
            var keyStore = KeyStore.getInstance(trustStoreType == null || trustStoreType.isBlank()
                    ? KeyStore.getDefaultType()
                    : trustStoreType.trim());
            keyStore.load(stream, resolvePassword(trustStorePassword, secretResolver));
            var keys = new LinkedHashMap<String, PluginTrustMaterial>();
            var aliases = keyStore.aliases();
            while (aliases.hasMoreElements()) {
                var alias = aliases.nextElement();
                var certificate = keyStore.getCertificate(alias);
                if (certificate != null) {
                    keys.put(alias, new PluginTrustMaterial(
                            alias,
                            certificate.getPublicKey(),
                            certificate instanceof X509Certificate x509 ? x509.getNotAfter().toInstant() : null));
                }
            }
            return Map.copyOf(keys);
        } catch (IOException | GeneralSecurityException error) {
            throw new IllegalArgumentException("Backend plugin trust store cannot be loaded", error);
        }
    }

    private static char[] resolvePassword(String rawPassword, SecretResolver secretResolver) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return new char[0];
        }
        var trimmed = rawPassword.trim();
        if (trimmed.startsWith("${") && trimmed.endsWith("}")) {
            var expression = trimmed.substring(2, trimmed.length() - 1);
            var separator = expression.indexOf(':');
            if (separator <= 0 || separator == expression.length() - 1) {
                throw new IllegalArgumentException("Trust store password secret reference must be ${source:reference}");
            }
            var source = expression.substring(0, separator);
            var reference = expression.substring(separator + 1);
            return secretResolver.resolve(source, reference)
                    .orElseThrow(() -> new IllegalArgumentException("Trust store password secret is not resolvable"))
                    .toCharArray();
        }
        return trimmed.toCharArray();
    }

    private static String mergeSecretBackedValue(String inlineValue, String secretReference, SecretResolver secretResolver) {
        var inline = inlineValue == null ? "" : inlineValue.trim();
        if (secretReference == null || secretReference.isBlank()) {
            return inline;
        }
        var resolved = resolveSecretReference(secretReference.trim(), secretResolver);
        if (inline.isBlank()) {
            return resolved;
        }
        if (resolved.isBlank()) {
            return inline;
        }
        return inline + "," + resolved;
    }

    private static String resolveSecretReference(String rawReference, SecretResolver secretResolver) {
        if (secretResolver == null) {
            throw new IllegalArgumentException("SecretResolver is required for plugin trust material secret references");
        }
        var reference = unwrapExpression(rawReference);
        var separator = reference.indexOf(':');
        if (separator <= 0 || separator == reference.length() - 1) {
            throw new IllegalArgumentException("Plugin trust material secret reference must be ${source:reference}");
        }
        var source = reference.substring(0, separator);
        var valueReference = reference.substring(separator + 1);
        return secretResolver.resolve(source, valueReference)
                .orElseThrow(() -> new IllegalArgumentException("Plugin trust material secret is not resolvable"));
    }

    private static String unwrapExpression(String rawReference) {
        if (rawReference.startsWith("${") && rawReference.endsWith("}")) {
            return rawReference.substring(2, rawReference.length() - 1);
        }
        return rawReference;
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
}
