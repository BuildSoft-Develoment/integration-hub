package com.integrationhub.platform.api.resource.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.UiPluginCatalogEntry;
import com.integrationhub.platform.repository.UiPluginCatalogEntryRepository;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UiPluginCatalogResourceTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void listParsesStoredManifestJson() throws Exception {
        var repository = mock(UiPluginCatalogEntryRepository.class);
        var entry = new UiPluginCatalogEntry();
        entry.pluginId = "sample-plugin";
        entry.manifestJson = "{\"id\":\"sample-plugin\",\"version\":\"1.0.0\"}";
        when(repository.listOrdered()).thenReturn(List.of(entry));
        var resource = new UiPluginCatalogResource(repository, mapper);

        var response = resource.list();

        assertEquals(1, response.manifests().size());
        assertEquals("sample-plugin", response.manifests().getFirst().get("id").asText());
    }

    @Test
    void upsertPersistsANewManifestKeyedById() throws Exception {
        var repository = mock(UiPluginCatalogEntryRepository.class);
        when(repository.findById("sample-plugin")).thenReturn(null);
        when(repository.listOrdered()).thenReturn(List.of());
        var resource = new UiPluginCatalogResource(repository, mapper);
        var manifest = mapper.readTree("{\"id\":\"sample-plugin\",\"version\":\"1.0.0\"}");

        resource.upsert(manifest);

        verify(repository).persist(any(UiPluginCatalogEntry.class));
    }

    @Test
    void upsertRejectsAManifestWithoutId() throws Exception {
        var repository = mock(UiPluginCatalogEntryRepository.class);
        var resource = new UiPluginCatalogResource(repository, mapper);
        var manifest = mapper.readTree("{\"version\":\"1.0.0\"}");

        assertThrows(BadRequestException.class, () -> resource.upsert(manifest));
    }

    @Test
    void removeDelegatesToRepository() {
        var repository = mock(UiPluginCatalogEntryRepository.class);
        when(repository.deleteById("sample-plugin")).thenReturn(true);
        when(repository.listOrdered()).thenReturn(List.of());
        var resource = new UiPluginCatalogResource(repository, mapper);

        resource.remove("sample-plugin");

        verify(repository).deleteById("sample-plugin");
    }
}
