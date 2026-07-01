package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.PluginDescriptor;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.LinkedHashSet;
import java.util.Set;

@ApplicationScoped
public class PluginDescriptorCatalogMapper {

    private static final TypeReference<Set<String>> STRING_SET = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public PluginDescriptorCatalogMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
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
                descriptor.pinned
        );
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
