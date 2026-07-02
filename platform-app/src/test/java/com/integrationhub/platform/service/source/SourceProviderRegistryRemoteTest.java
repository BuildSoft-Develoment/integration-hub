package com.integrationhub.platform.service.source;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.source.SourceProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SourceProviderRegistryRemoteTest {

    @Test
    void resolvesRemoteSourceProviderWhenNoLocalProviderExists() throws Exception {
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor(
                "acme-source",
                "1.0.0",
                "1",
                Set.of(),
                Set.of("REMOTE_FS"),
                Set.of(),
                "GRPC",
                "http://localhost:9000",
                true));
        RemotePluginInvoker invoker = (descriptor, taskType, context, configuration) -> {
            if (taskType.startsWith("SOURCE_SELECT")) {
                return TaskResult.success("selected", Map.of(
                        "files", List.of(Map.of(
                                "name", "clientes.csv",
                                "location", "remote://clientes.csv",
                                "mediaType", "text/csv",
                                "size", 7))));
            }
            return TaskResult.success("opened", Map.of(
                    "contentBase64", Base64.getEncoder().encodeToString("a,b\n1,2".getBytes(StandardCharsets.UTF_8)),
                    "mediaType", "text/csv"));
        };
        var registry = new SourceProviderRegistry(sourceProviders(), remotePlugins, remoteInvokers(invoker));

        var provider = registry.resolve("remote_fs");
        var files = provider.selectFiles(Map.of());
        var payload = provider.openFile(files.getFirst(), Map.of());

        assertInstanceOf(SourceProvider.class, provider);
        assertEquals("clientes.csv", files.getFirst().name());
        assertEquals("a,b\n1,2", new String(payload.openStream().readAllBytes(), StandardCharsets.UTF_8));
    }

    @SuppressWarnings("unchecked")
    private Instance<SourceProvider> sourceProviders() {
        var providers = (Instance<SourceProvider>) mock(Instance.class);
        when(providers.stream()).thenReturn(Stream.empty());
        return providers;
    }

    @SuppressWarnings("unchecked")
    private Instance<RemotePluginInvoker> remoteInvokers(RemotePluginInvoker invoker) {
        var invokers = (Instance<RemotePluginInvoker>) mock(Instance.class);
        when(invokers.isResolvable()).thenReturn(true);
        when(invokers.get()).thenReturn(invoker);
        return invokers;
    }
}
