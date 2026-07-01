package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginMarketplaceCatalogCache;
import com.integrationhub.platform.repository.PluginMarketplaceCatalogCacheRepository;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HttpPluginMarketplaceCatalogClientTest {

    @Test
    void readsVerifiedCatalogFromPersistentCacheWhenStillValid() throws Exception {
        var repository = mock(PluginMarketplaceCatalogCacheRepository.class);
        var httpClient = mock(HttpClient.class);
        var row = new PluginMarketplaceCatalogCache();
        row.catalogUrl = "https://plugins.example.com/catalog.json";
        row.bodyJson = "{\"plugins\":[{\"id\":\"acme\",\"version\":\"1.0.0\",\"spiVersion\":\"1\",\"transport\":\"KAFKA\"}]}";
        row.integrity = "sha256-abc";
        row.signature = "key:sig";
        row.status = "VERIFIED";
        row.expiresAt = LocalDateTime.ofInstant(Instant.parse("2026-07-01T00:00:00Z"), ZoneOffset.UTC);
        when(repository.findByIdOptional(row.catalogUrl)).thenReturn(Optional.of(row));
        var client = new HttpPluginMarketplaceCatalogClient(
                new ObjectMapper(),
                httpClient,
                mock(PluginMarketplaceCatalogVerifier.class),
                repository,
                Duration.ofMinutes(5),
                Clock.fixed(Instant.parse("2026-06-30T20:00:00Z"), ZoneOffset.UTC));

        var catalog = client.fetch(row.catalogUrl);

        assertEquals("acme", catalog.plugins().getFirst().id());
        assertNotNull(row.lastUsedAt);
        verify(httpClient, never()).send(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }
}
