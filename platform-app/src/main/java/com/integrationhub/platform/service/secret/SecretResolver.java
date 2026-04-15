package com.integrationhub.platform.service.secret;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class SecretResolver {

    private final List<SecretValueProvider> providers;

    @Inject
    public SecretResolver(Instance<SecretValueProvider> providers) {
        this.providers = providers.stream().toList();
    }

    public SecretResolver(List<SecretValueProvider> providers) {
        this.providers = List.copyOf(new ArrayList<>(providers));
    }

    public Optional<String> resolve(String source, String reference) {
        return providers.stream()
                .filter(provider -> provider.supports(source))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported secret source: " + source))
                .resolve(reference);
    }
}

