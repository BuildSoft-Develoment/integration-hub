package com.integrationhub.platform.service.reader;

import com.integrationhub.platform.spi.reader.ReaderProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;

@ApplicationScoped
public class ReaderProviderRegistry {

    private final Instance<ReaderProvider> providers;

    public ReaderProviderRegistry(Instance<ReaderProvider> providers) {
        this.providers = providers;
    }

    public ReaderProvider resolve(String type) {
        return providers.stream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported reader provider: " + type));
    }
}
