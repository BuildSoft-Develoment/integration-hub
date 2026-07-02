package com.integrationhub.platform.service.plugin;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PluginMarketplaceCatalogTest {

    @Test
    void selectsPinnedVersionWhenRequested() {
        var catalog = catalog(
                entry("acme", "1.0.0", "stable"),
                entry("acme", "1.2.0", "stable"));

        var selected = catalog.select(new PluginMarketplaceInstallCommand(
                "https://plugins.example.com/catalog.json",
                "acme",
                "1.0.0",
                "stable",
                true));

        assertEquals("1.0.0", selected.version());
    }

    @Test
    void selectsHighestSemanticVersionWhenNoPinnedVersionIsRequested() {
        var catalog = catalog(
                entry("acme", "1.0.0", "stable"),
                entry("acme", "1.10.0", "stable"),
                entry("acme", "1.2.0", "stable"));

        var selected = catalog.select(new PluginMarketplaceInstallCommand(
                "https://plugins.example.com/catalog.json",
                "acme",
                null,
                "stable",
                true));

        assertEquals("1.10.0", selected.version());
    }

    @Test
    void prefersReleaseOverPreReleaseForSameVersion() {
        var catalog = catalog(
                entry("acme", "2.0.0-rc1", "stable"),
                entry("acme", "2.0.0", "stable"));

        var selected = catalog.select(new PluginMarketplaceInstallCommand(
                "https://plugins.example.com/catalog.json",
                "acme",
                null,
                "stable",
                true));

        assertEquals("2.0.0", selected.version());
    }

    private static PluginMarketplaceCatalog catalog(PluginMarketplaceCatalog.PluginMarketplaceEntry... entries) {
        return new PluginMarketplaceCatalog(List.of(entries));
    }

    private static PluginMarketplaceCatalog.PluginMarketplaceEntry entry(String id, String version, String channel) {
        return new PluginMarketplaceCatalog.PluginMarketplaceEntry(
                id,
                version,
                "1",
                Set.of("ACME_DO"),
                Set.of(),
                Set.of(),
                "KAFKA",
                null,
                false,
                null,
                null,
                null,
                channel,
                null,
                false);
    }
}
