package com.integrationhub.platform.service.source;

import com.integrationhub.platform.provider.source.RemoteSourceProvider;
import com.integrationhub.platform.service.artifact.ArtifactStaging;
import com.integrationhub.platform.service.artifact.UnconfiguredArtifactStaging;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Stream;

@ApplicationScoped
public class SourceProviderRegistry {

    private final Instance<SourceProvider> providers;
    private final RemotePluginRegistry remotePlugins;
    private final Supplier<Optional<RemotePluginInvoker>> remoteInvoker;
    private final ArtifactStaging staging;

    @Inject
    public SourceProviderRegistry(Instance<SourceProvider> providers,
                                  RemotePluginRegistry remotePlugins,
                                  Instance<RemotePluginInvoker> remoteInvokers,
                                  ArtifactStaging staging) {
        this.providers = providers;
        this.remotePlugins = remotePlugins;
        this.remoteInvoker = () -> remoteInvokers.isResolvable()
                ? Optional.of(remoteInvokers.get())
                : Optional.empty();
        this.staging = staging;
    }

    public SourceProviderRegistry(Instance<SourceProvider> providers) {
        this.providers = providers;
        this.remotePlugins = new RemotePluginRegistry();
        this.remoteInvoker = Optional::empty;
        this.staging = new UnconfiguredArtifactStaging();
    }

    public SourceProvider resolve(String type) {
        var local = providerStream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst();
        if (local.isPresent()) {
            return local.get();
        }
        var remote = remotePlugins.descriptorForSourceInvocation(type);
        if (remote.isPresent()) {
            var invoker = remoteInvoker.get().orElseThrow(() -> new IllegalStateException(
                    "Remote source provider " + type + " is registered by plugin "
                            + remote.get().id() + " but no RemotePluginInvoker is configured"
            ));
            return new RemoteSourceProvider(type, remote.get(), invoker, remotePlugins, staging);
        }
        throw new IllegalArgumentException("Unsupported source provider: " + type);
    }

    /** Tipos de source locales (registrados en el build) → nombre del provider, para el catalogo. */
    public Map<String, String> localSourceTypeProviders() {
        var types = new LinkedHashMap<String, String>();
        providerStream().forEach(provider -> {
            var type = provider.type();
            if (type != null && !type.isBlank()) {
                types.putIfAbsent(type, provider.getClass().getSimpleName());
            }
        });
        return Collections.unmodifiableMap(types);
    }

    /** Schema de configuracion declarado por el provider (local o remoto) de {@code type}, o vacio. */
    public com.integrationhub.platform.spi.config.PluginConfigSchema configSchema(String type) {
        return resolve(type).configSchema();
    }

    private Stream<SourceProvider> providerStream() {
        return providers == null ? Stream.empty() : providers.stream();
    }
}
