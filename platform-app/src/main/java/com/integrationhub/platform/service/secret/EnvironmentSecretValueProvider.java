package com.integrationhub.platform.service.secret;

import io.quarkus.arc.DefaultBean;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.Config;

import java.util.Optional;

@ApplicationScoped
@DefaultBean
public class EnvironmentSecretValueProvider implements SecretValueProvider {

    private final Config config;

    @Inject
    public EnvironmentSecretValueProvider(Config config) {
        this.config = config;
    }

    EnvironmentSecretValueProvider(Config config, boolean ignored) {
        this.config = config;
    }

    @Override
    public boolean supports(String source) {
        return "env".equalsIgnoreCase(source);
    }

    @Override
    public Optional<String> resolve(String reference) {
        return config.getOptionalValue(reference, String.class)
                .or(() -> config.getOptionalValue(normalizeEnvKey(reference), String.class));
    }

    private String normalizeEnvKey(String key) {
        return key.replace('.', '_').replace('-', '_').toUpperCase();
    }
}
