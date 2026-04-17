package com.integrationhub.platform.service.source;

import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

@ApplicationScoped
public class SourceProviderRegistry {

    private final Instance<SourceProvider> providers;

    public SourceProviderRegistry(Instance<SourceProvider> providers) {
        this.providers = providers;
    }

    public SourceProvider resolve(String type) {
        return providers.stream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported source provider: " + type));
    }
}
