package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginMarketplaceCatalogCache;
import com.integrationhub.platform.repository.PluginMarketplaceCatalogCacheRepository;
import io.quarkus.arc.DefaultBean;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
@DefaultBean
public class HttpPluginMarketplaceCatalogClient implements PluginMarketplaceCatalogClient {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final PluginMarketplaceCatalogVerifier verifier;
    private final PluginMarketplaceCatalogCacheRepository cacheRepository;
    private final Duration cacheTtl;
    private final Clock clock;
    private final Map<String, CachedCatalog> cache = new ConcurrentHashMap<>();

    @Inject
    public HttpPluginMarketplaceCatalogClient(
            ObjectMapper objectMapper,
            PluginMarketplaceCatalogVerifier verifier,
            PluginMarketplaceCatalogCacheRepository cacheRepository,
            @ConfigProperty(name = "integrationhub.plugins.marketplace.catalog-cache-ttl-seconds", defaultValue = "300")
            long cacheTtlSeconds) {
        this(objectMapper, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build(), verifier, cacheRepository, Duration.ofSeconds(Math.max(0, cacheTtlSeconds)), Clock.systemUTC());
    }

    HttpPluginMarketplaceCatalogClient(
            ObjectMapper objectMapper,
            HttpClient httpClient,
            PluginMarketplaceCatalogVerifier verifier,
            PluginMarketplaceCatalogCacheRepository cacheRepository,
            Duration cacheTtl,
            Clock clock) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.verifier = verifier;
        this.cacheRepository = cacheRepository;
        this.cacheTtl = cacheTtl == null ? Duration.ZERO : cacheTtl;
        this.clock = clock == null ? Clock.systemUTC() : clock;
    }

    @Override
    @Transactional
    public PluginMarketplaceCatalog fetch(String catalogUrl) {
        var uri = validateCatalogUri(catalogUrl);
        var cached = cache.get(uri.toString());
        if (cached != null && cached.validAt(clock.instant())) {
            return cached.catalog();
        }
        var persisted = persistedCache(uri.toString());
        if (persisted != null) {
            return persisted;
        }
        var request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalArgumentException("Plugin marketplace catalog returned HTTP " + response.statusCode());
            }
            var body = response.body();
            var integrity = response.headers().firstValue(PluginMarketplaceCatalogVerifier.INTEGRITY_HEADER);
            var signature = response.headers().firstValue(PluginMarketplaceCatalogVerifier.SIGNATURE_HEADER);
            verifier.verify(
                    uri.toString(),
                    body,
                    integrity,
                    signature);
            var catalog = objectMapper.readValue(body, PluginMarketplaceCatalog.class);
            rememberVerified(uri.toString(), body, integrity.orElse(""), signature.orElse(""), catalog);
            return catalog;
        } catch (IOException error) {
            rememberFailure(uri.toString(), error.getMessage());
            throw new IllegalArgumentException("Plugin marketplace catalog cannot be parsed", error);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            rememberFailure(uri.toString(), "interrupted");
            throw new IllegalArgumentException("Plugin marketplace catalog request was interrupted", error);
        } catch (RuntimeException error) {
            rememberFailure(uri.toString(), error.getMessage());
            throw error;
        }
    }

    private PluginMarketplaceCatalog persistedCache(String catalogUrl) {
        if (cacheRepository == null || cacheTtl.isZero() || cacheTtl.isNegative()) {
            return null;
        }
        var row = cacheRepository.findByIdOptional(catalogUrl).orElse(null);
        if (row == null || !"VERIFIED".equals(row.status) || row.expiresAt == null) {
            return null;
        }
        if (!row.expiresAt.isAfter(localNow())) {
            return null;
        }
        try {
            var catalog = objectMapper.readValue(row.bodyJson, PluginMarketplaceCatalog.class);
            row.lastUsedAt = localNow();
            cache.put(catalogUrl, new CachedCatalog(catalog, row.expiresAt.atZone(java.time.ZoneId.systemDefault()).toInstant()));
            return catalog;
        } catch (IOException error) {
            row.status = "INVALID";
            row.error = truncate(error.getMessage());
            return null;
        }
    }

    private void rememberVerified(
            String catalogUrl,
            String body,
            String integrity,
            String signature,
            PluginMarketplaceCatalog catalog) {
        var expiresAt = clock.instant().plus(cacheTtl);
        if (!cacheTtl.isZero() && !cacheTtl.isNegative()) {
            cache.put(catalogUrl, new CachedCatalog(catalog, expiresAt));
        }
        if (cacheRepository == null) {
            return;
        }
        var row = cacheRepository.findByIdOptional(catalogUrl).orElseGet(() -> {
            var created = new PluginMarketplaceCatalogCache();
            created.catalogUrl = catalogUrl;
            cacheRepository.persist(created);
            return created;
        });
        row.bodyJson = body;
        row.integrity = integrity;
        row.signature = signature;
        row.status = "VERIFIED";
        row.error = null;
        row.fetchedAt = localNow();
        row.expiresAt = localDateTime(expiresAt);
        row.lastUsedAt = row.fetchedAt;
    }

    private void rememberFailure(String catalogUrl, String message) {
        if (cacheRepository == null) {
            return;
        }
        var row = cacheRepository.findByIdOptional(catalogUrl).orElseGet(() -> {
            var created = new PluginMarketplaceCatalogCache();
            created.catalogUrl = catalogUrl;
            created.bodyJson = "{}";
            created.integrity = "sha256-";
            created.signature = "unknown:";
            created.expiresAt = localNow();
            cacheRepository.persist(created);
            return created;
        });
        row.status = "FAILED";
        row.error = truncate(message);
        row.fetchedAt = localNow();
        row.lastUsedAt = null;
    }

    private static URI validateCatalogUri(String catalogUrl) {
        if (catalogUrl == null || catalogUrl.isBlank()) {
            throw new IllegalArgumentException("Plugin marketplace catalogUrl is required");
        }
        var uri = URI.create(catalogUrl.trim());
        var scheme = uri.getScheme();
        if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) {
            throw new IllegalArgumentException("Plugin marketplace catalogUrl must use http or https");
        }
        if ("http".equalsIgnoreCase(scheme) && !isLocalHost(uri.getHost())) {
            throw new IllegalArgumentException("Plugin marketplace catalogUrl must use HTTPS outside local dev");
        }
        return uri;
    }

    private static boolean isLocalHost(String host) {
        return "localhost".equalsIgnoreCase(host)
                || "127.0.0.1".equals(host)
                || "::1".equals(host)
                || "0:0:0:0:0:0:0:1".equals(host);
    }

    private LocalDateTime localNow() {
        return localDateTime(clock.instant());
    }

    private static LocalDateTime localDateTime(Instant instant) {
        return LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
    }

    private static String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 1000 ? value : value.substring(0, 1000);
    }

    private record CachedCatalog(PluginMarketplaceCatalog catalog, Instant expiresAt) {
        boolean validAt(Instant now) {
            return expiresAt.isAfter(now);
        }
    }
}
