package com.integrationhub.platform.service.source;

import com.integrationhub.platform.service.artifact.FakeArtifactStaging;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.source.SourceProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.ArtifactReference;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SourceProviderRegistryRemoteTest {

    private static RemotePluginDescriptor sourceDescriptor(String spiVersion) {
        return new RemotePluginDescriptor(
                "acme-source", "1.0.0", spiVersion,
                Set.of(), Set.of("REMOTE_FS"), Set.of(),
                "GRPC", "http://localhost:9000", true);
    }

    /** Invoker-stub que juega el rol del plugin: en OPEN lee la artifactRef del payload y "sube" al fake. */
    @SuppressWarnings("unchecked")
    private static RemotePluginInvoker uploadingInvoker(FakeArtifactStaging staging, byte[] content) {
        return (descriptor, taskType, context, payload) -> {
            if (taskType.startsWith("SOURCE_SELECT")) {
                return TaskResult.success("selected", Map.of(
                        "files", List.of(Map.of(
                                "name", "clientes.csv",
                                "location", "remote://clientes.csv",
                                "mediaType", "text/csv",
                                "size", content.length))));
            }
            var refMap = (Map<String, Object>) payload.get(ArtifactReference.ARTIFACT_REF);
            var reference = ArtifactReference.fromMap(refMap);
            staging.upload(reference.uri(), content); // el plugin sube a la URL presignada
            return TaskResult.success("opened", Map.of("mediaType", "text/csv"));
        };
    }

    @Test
    void resolvesRemoteSourceAndStreamsTheUploadedArtifact() throws Exception {
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(sourceDescriptor("2")); // spiVersion 2: soporta artifactRef
        var staging = new FakeArtifactStaging();
        var content = "a,b\n1,2".getBytes(StandardCharsets.UTF_8);

        var registry = new SourceProviderRegistry(
                sourceProviders(), remotePlugins, remoteInvokers(uploadingInvoker(staging, content)), staging);

        var provider = registry.resolve("remote_fs");
        var files = provider.selectFiles(Map.of());
        var payload = provider.openFile(files.getFirst(), Map.of());

        assertInstanceOf(SourceProvider.class, provider);
        assertEquals("clientes.csv", files.getFirst().name());
        // La plataforma lee por streaming lo que el plugin subió; el close borra el objeto de staging.
        try (var stream = payload.openStream()) {
            assertEquals("a,b\n1,2", new String(stream.readAllBytes(), StandardCharsets.UTF_8));
        }
        assertEquals(1, staging.deleted.size(), "el objeto de staging debe borrarse tras consumir (delete-on-close)");
    }

    @Test
    void failsFastWhenPluginSpiVersionDoesNotSupportArtifactRef() {
        var remotePlugins = new RemotePluginRegistry();
        remotePlugins.register(sourceDescriptor("1")); // spiVersion 1: contrato viejo (contentBase64)
        var staging = new FakeArtifactStaging();

        var registry = new SourceProviderRegistry(
                sourceProviders(), remotePlugins,
                remoteInvokers(uploadingInvoker(staging, "x".getBytes(StandardCharsets.UTF_8))), staging);

        var provider = registry.resolve("remote_fs");
        var files = provider.selectFiles(Map.of());
        var error = assertThrows(IllegalStateException.class, () -> provider.openFile(files.getFirst(), Map.of()));
        assertTrue(error.getMessage().contains("spiVersion"), "el error debe explicar la negociacion de version");
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
