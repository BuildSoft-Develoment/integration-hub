package com.integrationhub.platform.service.reader;

import com.integrationhub.platform.provider.reader.RemoteReaderProvider;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Stream;

@ApplicationScoped
public class ReaderProviderRegistry {

    private final Instance<ReaderProvider> providers;
    private final RemotePluginRegistry remotePlugins;
    private final Supplier<Optional<RemotePluginInvoker>> remoteInvoker;

    @Inject
    public ReaderProviderRegistry(Instance<ReaderProvider> providers,
                                  RemotePluginRegistry remotePlugins,
                                  Instance<RemotePluginInvoker> remoteInvokers) {
        this.providers = providers;
        this.remotePlugins = remotePlugins;
        this.remoteInvoker = () -> remoteInvokers.isResolvable()
                ? Optional.of(remoteInvokers.get())
                : Optional.empty();
    }

    public ReaderProviderRegistry(Instance<ReaderProvider> providers) {
        this.providers = providers;
        this.remotePlugins = new RemotePluginRegistry();
        this.remoteInvoker = Optional::empty;
    }

    public ReaderProvider resolve(String type) {
        var local = providerStream()
                .filter(provider -> provider.type().equalsIgnoreCase(type))
                .findFirst();
        if (local.isPresent()) {
            return local.get();
        }
        var remote = remotePlugins.descriptorForReader(type);
        if (remote.isPresent()) {
            var invoker = remoteInvoker.get().orElseThrow(() -> new IllegalStateException(
                    "Remote reader provider " + type + " is registered by plugin "
                            + remote.get().id() + " but no RemotePluginInvoker is configured"
            ));
            return new RemoteReaderProvider(type, remote.get(), invoker, remotePlugins);
        }
        throw new IllegalArgumentException("Unsupported reader provider: " + type);
    }

    private Stream<ReaderProvider> providerStream() {
        return providers == null ? Stream.empty() : providers.stream();
    }
}
