package com.integrationhub.platform.service.reader;

import com.integrationhub.platform.service.artifact.FakeArtifactStaging;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.ArtifactReference;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReaderProviderRegistryRemoteTest {

    @Test
    void resolvesRemoteReaderProviderWhenNoLocalProviderExists() {
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(new RemotePluginDescriptor(
                "acme-reader",
                "1.0.0",
                "2", // spiVersion 2: soporta el input por artifactRef
                Set.of(),
                Set.of(),
                Set.of("REMOTE_CSV"),
                "GRPC",
                "http://localhost:9000",
                true));
        var staging = new FakeArtifactStaging();
        // El plugin: lee la referencia GET del payload, descarga el input staged, y devuelve records.
        RemotePluginInvoker invoker = (descriptor, taskType, context, payload) -> {
            @SuppressWarnings("unchecked")
            var refMap = (Map<String, Object>) payload.get(ArtifactReference.ARTIFACT_REF);
            var reference = ArtifactReference.fromMap(refMap);
            staging.download(reference.uri()); // el plugin descarga el input por referencia
            return TaskResult.success("read", Map.of(
                    "records", List.of(
                            Map.of("id", "1", "name", "Ada"),
                            Map.of("id", "2", "name", "Grace")),
                    "skippedRows", List.of()));
        };
        var registry = new ReaderProviderRegistry(readerProviders(), remotePlugins, remoteInvokers(invoker), staging);
        var batches = new ArrayList<Integer>();

        var provider = registry.resolve("remote_csv");
        var result = provider.readInBatches(
                SourcePayload.fromBytes("clientes.csv", "id,name".getBytes(StandardCharsets.UTF_8), "text/csv"),
                Map.of(),
                1,
                batch -> batches.add(batch.records().size()));

        assertInstanceOf(ReaderProvider.class, provider);
        assertEquals(2, result.recordCount());
        assertEquals(List.of(1, 1), batches);
    }

    @SuppressWarnings("unchecked")
    private Instance<ReaderProvider> readerProviders() {
        var providers = (Instance<ReaderProvider>) mock(Instance.class);
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
