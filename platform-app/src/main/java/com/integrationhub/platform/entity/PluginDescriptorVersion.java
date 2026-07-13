package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "plugin_descriptor_version")
public class PluginDescriptorVersion {

    @Id
    @Column(name = "descriptor_key", length = 180)
    public String descriptorKey;

    @Column(name = "plugin_id", nullable = false, length = 120)
    public String pluginId;

    @Column(nullable = false, length = 40)
    public String version;

    @Column(name = "spi_version", nullable = false, length = 40)
    public String spiVersion;

    @Column(name = "provided_types_json", nullable = false, columnDefinition = "text")
    public String providedTypesJson;

    @Column(name = "provided_source_types_json", nullable = false, columnDefinition = "text")
    public String providedSourceTypesJson = "[]";

    @Column(name = "provided_reader_types_json", nullable = false, columnDefinition = "text")
    public String providedReaderTypesJson = "[]";

    @Column(name = "config_schemas_json", columnDefinition = "text")
    public String configSchemasJson;

    @Column(nullable = false, length = 20)
    public String transport;

    @Column(length = 500)
    public String endpoint;

    @Column(nullable = false)
    public boolean trusted = false;

    @Column(length = 120)
    public String integrity;

    @Column(length = 500)
    public String signature;

    @Column(name = "marketplace_url", length = 500)
    public String marketplaceUrl;

    @Column(length = 80)
    public String channel;

    @Column(name = "pinned_version", length = 40)
    public String pinnedVersion;

    @Column(nullable = false)
    public boolean pinned = false;

    /** Percentage (0-100) of traffic a canary version should receive; null when unset. */
    @Column(name = "canary_weight")
    public Integer canaryWeight;

    @Column(name = "installed_at", nullable = false)
    public LocalDateTime installedAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt = LocalDateTime.now();

    public static String key(String pluginId, String version) {
        if (pluginId == null || pluginId.isBlank() || version == null || version.isBlank()) {
            throw new IllegalArgumentException("Plugin id and version are required");
        }
        return pluginId.trim() + "@" + version.trim();
    }
}
