package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import com.integrationhub.platform.entity.PluginDescriptorVersion;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@ApplicationScoped
public class PluginDescriptorCatalogMapper {

    private static final TypeReference<Set<String>> STRING_SET = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public PluginDescriptorCatalogMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Builds a remote descriptor from a stored plugin version (used for canary rollout). */
    public RemotePluginDescriptor toRemoteDescriptor(PluginDescriptorVersion version) {
        if (version == null) {
            throw new IllegalArgumentException("Plugin descriptor version is required");
        }
        var descriptor = new PluginDescriptor();
        descriptor.id = version.pluginId;
        descriptor.version = version.version;
        descriptor.spiVersion = version.spiVersion;
        descriptor.providedTypesJson = version.providedTypesJson;
        descriptor.providedSourceTypesJson = version.providedSourceTypesJson;
        descriptor.providedReaderTypesJson = version.providedReaderTypesJson;
        descriptor.configSchemasJson = version.configSchemasJson;
        descriptor.transport = version.transport;
        descriptor.endpoint = version.endpoint;
        descriptor.trusted = version.trusted;
        descriptor.marketplaceUrl = version.marketplaceUrl;
        descriptor.channel = version.channel;
        descriptor.pinnedVersion = version.pinnedVersion;
        descriptor.pinned = version.pinned;
        return toRemoteDescriptor(descriptor);
    }

    public RemotePluginDescriptor toRemoteDescriptor(PluginDescriptor descriptor) {
        if (descriptor == null) {
            throw new IllegalArgumentException("Plugin descriptor is required");
        }
        var providedTypes = parseProvidedTypes(descriptor);
        var providedSourceTypes = parseTypeSet(descriptor.id, descriptor.providedSourceTypesJson, "providedSourceTypes");
        var providedReaderTypes = parseTypeSet(descriptor.id, descriptor.providedReaderTypesJson, "providedReaderTypes");
        if (providedTypes.isEmpty() && providedSourceTypes.isEmpty() && providedReaderTypes.isEmpty()) {
            throw new IllegalArgumentException("Plugin " + descriptor.id + " does not declare provided capabilities");
        }
        return new RemotePluginDescriptor(
                descriptor.id,
                descriptor.version,
                descriptor.spiVersion,
                providedTypes,
                providedSourceTypes,
                providedReaderTypes,
                descriptor.transport,
                descriptor.endpoint,
                descriptor.trusted,
                descriptor.marketplaceUrl,
                descriptor.channel,
                descriptor.pinnedVersion,
                descriptor.pinned,
                parseConfigSchemas(descriptor.id, descriptor.configSchemasJson)
        );
    }

    /** Parsea el JSON `{ "<type>": { "fields": [...] } }`; vacío si falta o es inválido. */
    private Map<String, PluginConfigSchema> parseConfigSchemas(String pluginId, String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, PluginConfigSchema> parsed =
                    objectMapper.readValue(json, new TypeReference<Map<String, PluginConfigSchema>>() {});
            return parsed == null ? Map.of() : parsed;
        } catch (JsonProcessingException ex) {
            // Un config-schema inválido no debe tumbar el catálogo: se ignora para ese plugin.
            return Map.of();
        }
    }

    private Set<String> parseProvidedTypes(PluginDescriptor descriptor) {
        return parseTypeSet(descriptor.id, descriptor.providedTypesJson, "providedTypes");
    }

    private Set<String> parseTypeSet(String pluginId, String rawJson, String fieldName) {
        try {
            var rawTypes = objectMapper.readValue(rawJson == null || rawJson.isBlank() ? "[]" : rawJson, STRING_SET);
            var normalized = new LinkedHashSet<String>();
            for (var type : rawTypes) {
                if (type != null && !type.isBlank()) {
                    normalized.add(type.trim());
                }
            }
            return normalized;
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException(
                    "Plugin " + pluginId + " has invalid " + fieldName + " JSON", error);
        }
    }
}
