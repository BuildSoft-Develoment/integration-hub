package com.integrationhub.platform.service;

import com.integrationhub.platform.provider.task.remote.RemoteTaskProvider;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.task.TaskProvider;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import java.util.function.Supplier;

@ApplicationScoped
public class TaskProviderRegistry {

    private static final Logger LOG = Logger.getLogger(TaskProviderRegistry.class);

    private final Iterable<TaskProvider> providers;
    private final RemotePluginRegistry remotePlugins;
    private final Supplier<Optional<RemotePluginInvoker>> remoteInvoker;

    public TaskProviderRegistry(Instance<TaskProvider> providers) {
        this(
                providers == null ? List.of() : providers,
                new RemotePluginRegistry(),
                Optional::empty
        );
    }

    @Inject
    public TaskProviderRegistry(Instance<TaskProvider> providers,
                                RemotePluginRegistry remotePlugins,
                                Instance<RemotePluginInvoker> remoteInvokers) {
        this(
                providers,
                remotePlugins,
                () -> remoteInvokers.isResolvable()
                        ? Optional.of(remoteInvokers.get())
                        : Optional.empty()
        );
    }

    TaskProviderRegistry(Iterable<TaskProvider> providers,
                         RemotePluginRegistry remotePlugins,
                         Supplier<Optional<RemotePluginInvoker>> remoteInvoker) {
        this.providers = providers;
        this.remotePlugins = remotePlugins;
        this.remoteInvoker = remoteInvoker;
    }

    void logProviders(@Observes StartupEvent event) {
        LOG.infof("Task providers registered: %s", availableProviders());
    }

    public TaskProvider resolve(String type) {
        var local = providerStream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst();
        if (local.isPresent()) {
            return local.get();
        }

        var remote = remotePlugins.descriptorFor(type);
        if (remote.isPresent()) {
            var invoker = remoteInvoker.get().orElseThrow(() -> new IllegalStateException(
                    "Remote task provider " + type + " is registered by plugin "
                            + remote.get().id() + " but no RemotePluginInvoker is configured"
            ));
            return new RemoteTaskProvider(type, remote.get(), invoker, remotePlugins);
        }

        throw new IllegalArgumentException(
                "Unsupported task provider: " + type + ". Available providers: " + availableProviders()
        );
    }

    /**
     * Conjunto de tipos de tarea cubiertos por los providers registrados.
     * Usado por {@code TaskTypeRegistry} para componer el catalogo completo
     * (M-1a / T-015 spec 003).
     */
    public Set<String> availableTaskTypes() {
        var types = new LinkedHashSet<String>();
        providers.forEach(provider -> types.add(provider.type()));
        types.addAll(remotePlugins.availableTaskTypes());
        return types;
    }

    private String availableProviders() {
        var localProviders = providerStream()
                .map(provider -> provider.type() + "(" + provider.getClass().getSimpleName() + ")")
                .sorted()
                .collect(Collectors.joining(", "));
        var remoteProviders = remotePlugins.descriptors().stream()
                .flatMap(descriptor -> descriptor.providedTypes().stream()
                        .map(type -> type + "(" + descriptor.id() + ":remote)"))
                .sorted()
                .collect(Collectors.joining(", "));
        if (localProviders.isBlank()) {
            return remoteProviders;
        }
        if (remoteProviders.isBlank()) {
            return localProviders;
        }
        return localProviders + ", " + remoteProviders;
    }

    private java.util.stream.Stream<TaskProvider> providerStream() {
        return StreamSupport.stream(providers.spliterator(), false);
    }
}
