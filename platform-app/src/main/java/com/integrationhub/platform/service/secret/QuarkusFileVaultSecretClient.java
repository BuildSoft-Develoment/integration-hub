package com.integrationhub.platform.service.secret;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.Config;

import javax.crypto.SecretKey;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class QuarkusFileVaultSecretClient implements FileVaultSecretClient {

    private static final String PROVIDER_PREFIX = "quarkus.file.vault.provider.";
    private final Config config;

    @Inject
    public QuarkusFileVaultSecretClient(Config config) {
        this.config = config;
    }

    @Override
    public Optional<Map<String, String>> readSecret(String providerName, String alias) {
        String baseKey = PROVIDER_PREFIX + providerName + ".";
        String keystorePath = config.getOptionalValue(baseKey + "path", String.class)
                .orElseThrow(() -> new IllegalArgumentException("Missing config value: " + baseKey + "path"));
        String keystoreSecret = config.getOptionalValue(baseKey + "secret", String.class)
                .orElseThrow(() -> new IllegalArgumentException("Missing config value: " + baseKey + "secret"));
        String storeType = config.getOptionalValue(baseKey + "type", String.class).orElse("PKCS12");
        char[] password = keystoreSecret.toCharArray();

        try (InputStream inputStream = Files.newInputStream(resolvePath(keystorePath))) {
            KeyStore keyStore = KeyStore.getInstance(storeType);
            keyStore.load(inputStream, password);
            KeyStore.ProtectionParameter protection = new KeyStore.PasswordProtection(password);
            KeyStore.Entry entry = keyStore.getEntry(alias, protection);
            if (entry == null) {
                return Optional.empty();
            }
            if (entry instanceof KeyStore.SecretKeyEntry secretKeyEntry) {
                SecretKey secretKey = secretKeyEntry.getSecretKey();
                String value = new String(secretKey.getEncoded(), java.nio.charset.StandardCharsets.UTF_8);
                return Optional.of(Map.of("password", value, "value", value, "user", alias));
            }
            if (entry instanceof KeyStore.TrustedCertificateEntry certificateEntry) {
                String value = java.util.Base64.getEncoder().encodeToString(certificateEntry.getTrustedCertificate().getEncoded());
                return Optional.of(Map.of("value", value, "certificate", value, "user", alias));
            }
            return Optional.empty();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot read local secret from keystore for provider " + providerName + " and alias " + alias, e);
        }
    }

    private Path resolvePath(String configuredPath) {
        Path path = Path.of(configuredPath);
        if (path.isAbsolute()) {
            return path;
        }
        return Path.of(System.getProperty("user.dir")).resolve(configuredPath).normalize();
    }
}
