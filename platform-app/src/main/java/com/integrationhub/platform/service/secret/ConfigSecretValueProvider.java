package com.integrationhub.platform.service.secret;

import io.quarkus.arc.DefaultBean;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.Config;

import java.util.Optional;

@ApplicationScoped
@DefaultBean
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
    public boolean supports(String source) {
        return "config".equalsIgnoreCase(source);
    }

    @Override
    public Optional<String> resolve(String reference) {
        return config.getOptionalValue(reference, String.class);
    }
}
