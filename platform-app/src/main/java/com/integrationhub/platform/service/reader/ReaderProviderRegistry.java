package com.integrationhub.platform.service.reader;

import com.integrationhub.platform.provider.reader.RemoteReaderProvider;
import com.integrationhub.platform.service.artifact.ArtifactStaging;
import com.integrationhub.platform.service.artifact.UnconfiguredArtifactStaging;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.reader.ReaderProvider;
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
public class ReaderProviderRegistry {

    private final Instance<ReaderProvider> providers;
    private final RemotePluginRegistry remotePlugins;
    private final Supplier<Optional<RemotePluginInvoker>> remoteInvoker;
    // Proyecto #3 Fase 3a: el reader remoto envía el input por referencia (staging + presign GET), no como Base64 por
    // gRPC → el guard v58 de tamaño (max-content-bytes) se retira.
    private final ArtifactStaging staging;

    @Inject
    public ReaderProviderRegistry(Instance<ReaderProvider> providers,
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

    /** Compat: firma previa (sin staging) → usa el null-object (source/reader remoto por referencia falla-fast). */
    public ReaderProviderRegistry(Instance<ReaderProvider> providers,
                                  RemotePluginRegistry remotePlugins,
                                  Instance<RemotePluginInvoker> remoteInvokers) {
        this(providers, remotePlugins, remoteInvokers, new UnconfiguredArtifactStaging());
    }

    public ReaderProviderRegistry(Instance<ReaderProvider> providers) {
        this.providers = providers;
        this.remotePlugins = new RemotePluginRegistry();
        this.remoteInvoker = Optional::empty;
        this.staging = new UnconfiguredArtifactStaging();
    }

    public ReaderProvider resolve(String type) {
        var local = providerStream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst();
        if (local.isPresent()) {
            return local.get();
        }
        var remote = remotePlugins.descriptorForReaderInvocation(type);
        if (remote.isPresent()) {
            var invoker = remoteInvoker.get().orElseThrow(() -> new IllegalStateException(
                    "Remote reader provider " + type + " is registered by plugin "
                            + remote.get().id() + " but no RemotePluginInvoker is configured"
            ));
            return new RemoteReaderProvider(type, remote.get(), invoker, remotePlugins, staging);
        }
        throw new IllegalArgumentException("Unsupported reader provider: " + type);
    }

    /** Tipos de reader locales (type -> nombre del provider), para el catalogo de tipos. */
    public Map<String, String> localReaderTypeProviders() {
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

    private Stream<ReaderProvider> providerStream() {
        return providers == null ? Stream.empty() : providers.stream();
    }
}
