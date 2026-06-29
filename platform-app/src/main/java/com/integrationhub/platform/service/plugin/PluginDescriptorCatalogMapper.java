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
        if (providedTypes.isEmpty()) {
            throw new IllegalArgumentException("Plugin " + descriptor.id + " does not declare provided types");
        }
        return new RemotePluginDescriptor(
                descriptor.id,
                descriptor.version,
                descriptor.spiVersion,
                providedTypes,
                descriptor.transport,
                descriptor.endpoint,
                descriptor.trusted
        );
    }

    private Set<String> parseProvidedTypes(PluginDescriptor descriptor) {
        try {
            var rawTypes = objectMapper.readValue(descriptor.providedTypesJson, STRING_SET);
            var normalized = new LinkedHashSet<String>();
            for (var type : rawTypes) {
                if (type != null && !type.isBlank()) {
                    normalized.add(type.trim());
                }
            }
            return normalized;
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException(
                    "Plugin " + descriptor.id + " has invalid providedTypes JSON", error);
        }
    }
}
