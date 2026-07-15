package com.integrationhub.platform.service.secret;

import io.quarkus.arc.All;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class SecretResolver {

    private final List<SecretValueProvider> providers;

    // @All List<> inyecta TODOS los beans del tipo ORDENADOS por @Priority (descendente): la selección de
    // provider por supports(source) es determinista. En producción cada source lo cubre un único provider, así
    // que el orden es irrelevante; sólo importa en test, donde TestConfigBackedSecretValueProvider (con @Priority
    // alta) debe ganar a FileVaultSecretValueProvider para la source "secret". Antes, con Instance + findFirst,
    // el orden de descubrimiento era arbitrario y dos providers de "secret" competían de forma no determinista.
    // Los callers manuales (JsonConfigurationMapper, tests) usan este mismo constructor con una List explícita:
    // la anotación @All sólo la interpreta CDI, no afecta al `new`.
    @Inject
    public SecretResolver(@All List<SecretValueProvider> providers) {
        this.providers = List.copyOf(providers);
    }

    public Optional<String> resolve(String source, String reference) {
        return providers.stream()
                .filter(provider -> provider.supports(source))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported secret source: " + source))
                .resolve(reference);
    }
}

