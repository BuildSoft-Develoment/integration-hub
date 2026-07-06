package com.integrationhub.platform.service.reader;

import com.integrationhub.platform.provider.reader.RemoteReaderProvider;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Stream;

@ApplicationScoped
public class ReaderProviderRegistry {

    private final Instance<ReaderProvider> providers;
    private final RemotePluginRegistry remotePlugins;
    private final Supplier<Optional<RemotePluginInvoker>> remoteInvoker;
    // v58-fix: umbral del contenido que el reader remoto puede empujar (guard de tamano, ver RemoteReaderProvider).
    private final long remoteReaderMaxContentBytes;

    @Inject
    public ReaderProviderRegistry(Instance<ReaderProvider> providers,
                                  RemotePluginRegistry remotePlugins,
                                  Instance<RemotePluginInvoker> remoteInvokers,
                                  @ConfigProperty(name = "integrationhub.plugin.remote.reader.max-content-bytes",
                                          defaultValue = "4194304") long remoteReaderMaxContentBytes) {
        this.providers = providers;
        this.remotePlugins = remotePlugins;
        this.remoteInvoker = () -> remoteInvokers.isResolvable()
                ? Optional.of(remoteInvokers.get())
                : Optional.empty();
        this.remoteReaderMaxContentBytes = remoteReaderMaxContentBytes;
    }

    /** Compat: firma previa (sin el umbral de contenido) → usa el default. */
    public ReaderProviderRegistry(Instance<ReaderProvider> providers,
                                  RemotePluginRegistry remotePlugins,
                                  Instance<RemotePluginInvoker> remoteInvokers) {
        this(providers, remotePlugins, remoteInvokers, RemoteReaderProvider.DEFAULT_MAX_CONTENT_BYTES);
    }

    public ReaderProviderRegistry(Instance<ReaderProvider> providers) {
        this.providers = providers;
        this.remotePlugins = new RemotePluginRegistry();
        this.remoteInvoker = Optional::empty;
        this.remoteReaderMaxContentBytes = RemoteReaderProvider.DEFAULT_MAX_CONTENT_BYTES;
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
            return new RemoteReaderProvider(type, remote.get(), invoker, remotePlugins, remoteReaderMaxContentBytes);
        }
        throw new IllegalArgumentException("Unsupported reader provider: " + type);
    }

    private Stream<ReaderProvider> providerStream() {
        return providers == null ? Stream.empty() : providers.stream();
    }
}
