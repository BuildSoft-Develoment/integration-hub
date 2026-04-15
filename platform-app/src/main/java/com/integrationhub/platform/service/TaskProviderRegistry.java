package com.integrationhub.platform.service;

import com.integrationhub.platform.provider.task.StoredProcedureTaskProvider;
import com.integrationhub.platform.spi.TaskProvider;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Instance;
import org.jboss.logging.Logger;

import java.util.stream.Collectors;
import java.util.stream.Stream;

@ApplicationScoped
public class TaskProviderRegistry {

    private static final Logger LOG = Logger.getLogger(TaskProviderRegistry.class);

    private final Instance<TaskProvider> providers;
    private final StoredProcedureTaskProvider storedProcedureTaskProvider;

    public TaskProviderRegistry(Instance<TaskProvider> providers,
                                StoredProcedureTaskProvider storedProcedureTaskProvider) {
        this.providers = providers;
        this.storedProcedureTaskProvider = storedProcedureTaskProvider;
    }

    void logProviders(@Observes StartupEvent event) {
        LOG.infof("Task providers registered: %s", availableProviders());
    }

    public TaskProvider resolve(String type) {
        return providerStream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unsupported task provider: " + type + ". Available providers: " + availableProviders()
                ));
    }

    private String availableProviders() {
        return providerStream()
                .map(provider -> provider.type() + "(" + provider.getClass().getSimpleName() + ")")
                .sorted()
                .collect(Collectors.joining(", "));
    }

    private Stream<TaskProvider> providerStream() {
        return Stream.concat(providers.stream(), Stream.of(storedProcedureTaskProvider)).distinct();
    }
}