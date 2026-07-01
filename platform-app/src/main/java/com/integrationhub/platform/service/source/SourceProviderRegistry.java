package com.integrationhub.platform.service.source;

import com.integrationhub.platform.provider.source.RemoteSourceProvider;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.source.SourceProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Stream;

@ApplicationScoped
public class SourceProviderRegistry {

    private final Instance<SourceProvider> providers;
    private final RemotePluginRegistry remotePlugins;
    private final Supplier<Optional<RemotePluginInvoker>> remoteInvoker;

    @Inject
    public SourceProviderRegistry(Instance<SourceProvider> providers,
                                  RemotePluginRegistry remotePlugins,
                                  Instance<RemotePluginInvoker> remoteInvokers) {
        this.providers = providers;
        this.remotePlugins = remotePlugins;
        this.remoteInvoker = () -> remoteInvokers.isResolvable()
                ? Optional.of(remoteInvokers.get())
                : Optional.empty();
    }

    public SourceProviderRegistry(Instance<SourceProvider> providers) {
        this.providers = providers;
        this.remotePlugins = new RemotePluginRegistry();
        this.remoteInvoker = Optional::empty;
    }

    public SourceProvider resolve(String type) {
        var local = providerStream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst();
        if (local.isPresent()) {
            return local.get();
        }
        var remote = remotePlugins.descriptorForSource(type);
        if (remote.isPresent()) {
            var invoker = remoteInvoker.get().orElseThrow(() -> new IllegalStateException(
                    "Remote source provider " + type + " is registered by plugin "
                            + remote.get().id() + " but no RemotePluginInvoker is configured"
            ));
            return new RemoteSourceProvider(type, remote.get(), invoker, remotePlugins);
        }
        throw new IllegalArgumentException("Unsupported source provider: " + type);
    }

    private Stream<SourceProvider> providerStream() {
        return providers == null ? Stream.empty() : providers.stream();
    }
}
