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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Collections;
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

        var remote = remotePlugins.descriptorForInvocation(type);
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
        types.addAll(localTaskTypeProviders().keySet());
        types.addAll(remotePlugins.availableTaskTypes());
        return types;
    }

    /**
     * ADR-021: tipos de tarea que MUEVEN DINERO, declarados por sus providers
     * ({@link TaskProvider#movesMoney()}).
     *
     * <p>Lo consume la recuperacion de ejecuciones huerfanas: si una ejecucion con lease vencido ya
     * arranco alguno de estos tipos, no se re-encola. Antes el motor traia el literal
     * {@code "MT101_PAY"}, de modo que el fail-safe cubria a UN vertical; ahora cubre a todos los que
     * declaren la capacidad.</p>
     *
     * <p>Solo providers CDI locales: un plugin remoto no puede auto-declararse como movedor de dinero
     * —seria una decision de seguridad tomada por codigo de terceros—.</p>
     */
    public Set<String> moneyMovementTaskTypes() {
        var types = new LinkedHashSet<String>();
        providers.forEach(provider -> {
            if (provider.movesMoney() && provider.type() != null && !provider.type().isBlank()) {
                types.add(provider.type());
            }
        });
        return types;
    }

    /**
     * ADR-021: ¿el tipo publica un output {@code records} que las tareas siguientes consumen?
     * Declarado por el provider ({@link TaskProvider#producesConsumableRecords()}).
     *
     * <p>Un tipo desconocido responde {@code false}: es el mismo comportamiento que tenia la lista de
     * literales, que solo nombraba lo que si producia records. Se consulta el stream local y no
     * {@code resolve}, que lanza ante un tipo desconocido y ademas materializaria un invoker remoto
     * solo para preguntar una capacidad.</p>
     */
    public boolean producesConsumableRecords(String type) {
        if (type == null || type.isBlank()) {
            return false;
        }
        return providerStream()
                .filter(provider -> type.equalsIgnoreCase(provider.type()))
                .findFirst()
                .map(TaskProvider::producesConsumableRecords)
                .orElse(false);
    }

    /**
     * Tipos aportados por providers CDI locales y la clase que los publica.
     * No incluye plugins remotos; se usa para diagnostico y para detectar shadowing.
     */
    public Map<String, String> localTaskTypeProviders() {
        var types = new LinkedHashMap<String, String>();
        providers.forEach(provider -> {
            var type = provider.type();
            if (type != null && !type.isBlank()) {
                types.putIfAbsent(type, provider.getClass().getSimpleName());
            }
        });
        return Collections.unmodifiableMap(types);
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
