package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.entity.PluginDescriptor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Politica de activacion para plugins backend externos.
 *
 * <p>Esta capa valida procedencia operacional antes de publicar el descriptor en
 * el registry. La verificacion criptografica completa queda pendiente para el
 * flujo de instalacion, pero el core no activa descriptores confiables sin
 * metadatos de integridad/firma ni endpoints permitidos.</p>
 */
@ApplicationScoped
public class PluginDescriptorTrustPolicy {

    private static final Set<String> SUPPORTED_TRANSPORTS = Set.of("GRPC", "KAFKA");
    private static final Pattern INTEGRITY_PATTERN =
            Pattern.compile("^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$");
    private static final Pattern SIGNATURE_PATTERN =
            Pattern.compile("^[A-Za-z0-9._:-]+:[A-Za-z0-9+/]+={0,2}$");

    private final Set<String> allowedOrigins;

    @Inject
    public PluginDescriptorTrustPolicy(
            @ConfigProperty(name = "integrationhub.plugins.backend.allowed-origins", defaultValue = "")
            String allowedOrigins) {
        this(parseAllowedOrigins(allowedOrigins));
    }

    PluginDescriptorTrustPolicy(Set<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins == null ? Set.of() : Set.copyOf(allowedOrigins);
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

    private static String normalizeOrigin(String rawOrigin) {
        var uri = URI.create(rawOrigin);
        var hasPath = uri.getRawPath() != null && !uri.getRawPath().isBlank();
        if (uri.getScheme() == null || uri.getHost() == null || hasPath) {
            throw new IllegalArgumentException("Backend plugin allowed origin must be scheme://host[:port]");
        }
        return originOf(uri);
    }
}
