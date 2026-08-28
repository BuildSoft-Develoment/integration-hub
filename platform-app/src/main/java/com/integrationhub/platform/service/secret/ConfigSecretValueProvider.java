package com.integrationhub.platform.service.secret;

import java.util.Set;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.Config;

import java.util.Optional;

// Sin @DefaultBean: ver FileVaultSecretValueProvider. El bean quedaba fuera del
// Instance<SecretValueProvider> y ${config:...} era irresoluble en runtime.
@ApplicationScoped
public class ConfigSecretValueProvider implements SecretValueProvider {

    private final Config config;

    @Inject
    public ConfigSecretValueProvider(Config config) {
        this.config = config;
    }

    ConfigSecretValueProvider(Config config, boolean ignored) {
        this.config = config;
    }

    @Override
    public Set<String> sources() {
        return Set.of("config");
    }

    @Override
    public Optional<String> resolve(String reference) {
        return config.getOptionalValue(reference, String.class);
    }
}
