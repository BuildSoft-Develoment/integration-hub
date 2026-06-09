package com.integrationhub.platform.service;

import com.integrationhub.platform.spi.task.TaskProvider;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Instance;
import org.jboss.logging.Logger;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class TaskProviderRegistry {

    private static final Logger LOG = Logger.getLogger(TaskProviderRegistry.class);

    private final Instance<TaskProvider> providers;

    public TaskProviderRegistry(Instance<TaskProvider> providers) {
        this.providers = providers;
    }

    void logProviders(@Observes StartupEvent event) {
        LOG.infof("Task providers registered: %s", availableProviders());
    }

    public TaskProvider resolve(String type) {
        return providers.stream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unsupported task provider: " + type + ". Available providers: " + availableProviders()
                ));
    }

    /**
     * Conjunto de tipos de tarea cubiertos por los providers registrados.
     * Usado por {@code TaskTypeRegistry} para componer el catalogo completo
     * (M-1a / T-015 spec 003).
     */
    public Set<String> availableTaskTypes() {
        var types = new LinkedHashSet<String>();
        providers.forEach(provider -> types.add(provider.type()));
        return types;
    }

    private String availableProviders() {
        return providers.stream()
                .map(provider -> provider.type() + "(" + provider.getClass().getSimpleName() + ")")
                .sorted()
                .collect(Collectors.joining(", "));
    }
}
