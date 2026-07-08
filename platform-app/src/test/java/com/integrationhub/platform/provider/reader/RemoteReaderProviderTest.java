package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.artifact.FakeArtifactStaging;
import com.integrationhub.platform.service.execution.FileReadRuntimeSupport;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.ArtifactReference;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

/**
 * Remote reader input travels by artifact reference. The plugin downloads the staged object and returns pages of
 * records through the control channel; the platform must not materialize a remote reader through collectReadResult.
 */
class RemoteReaderProviderTest {

    private RemotePluginDescriptor descriptor(String spiVersion) {
        return new RemotePluginDescriptor("plugin-x", "1.0", spiVersion, Set.of("MY_READER"), "GRPC", true);
    }

    @Test
    void stagesInputByReferenceThenReadsRecordsAndCleansUp() {
        var staging = new FakeArtifactStaging();
        var downloadedByPlugin = new AtomicReference<byte[]>();

        RemotePluginInvoker invoker = (desc, taskType, context, payload) -> {
            @SuppressWarnings("unchecked")
            var refMap = (Map<String, Object>) payload.get(ArtifactReference.ARTIFACT_REF);
            var reference = ArtifactReference.fromMap(refMap);
            assertEquals(ArtifactReference.GET, reference.method(), "reader must pass a GET artifact reference");
            downloadedByPlugin.set(staging.download(reference.uri()));
            return TaskResult.success("ok", Map.of("records", List.of(Map.of("a", "1"), Map.of("a", "2"))));
        };

        var provider = new RemoteReaderProvider("MY_READER", descriptor("2"), invoker, new RemotePluginRegistry(), staging);
        var input = "a\n1\n2\n".getBytes(StandardCharsets.UTF_8);
        var payload = SourcePayload.fromBytes("small.csv", input, "text/csv");

        var result = provider.readInBatches(payload, Map.of(), 10, batch -> { });

        assertEquals(0, result.records().size(), "remote reader streams through the consumer, not records()");
        assertEquals(2, result.recordCount());
        assertArrayEquals(input, downloadedByPlugin.get(), "plugin downloaded the staged input by reference");
        assertEquals(1, staging.deleted.size(), "staged input is cleaned after READ");
    }

    @Test
    void paginatesRecordsAcrossPagesUntilCursorIsEmpty() {
        var staging = new FakeArtifactStaging();
        RemotePluginInvoker invoker = (desc, taskType, context, payload) -> {
            var cursor = payload.get("cursor");
            if (cursor == null) {
                return TaskResult.success("p1", Map.of(
                        "records", List.of(Map.of("r", "1"), Map.of("r", "2")),
                        "nextCursor", "offset-2"));
            }
            return TaskResult.success("p2", Map.of("records", List.of(Map.of("r", "3"))));
        };
        var provider = new RemoteReaderProvider("MY_READER", descriptor("2"), invoker, new RemotePluginRegistry(), staging);
        var payload = SourcePayload.fromBytes("big.csv", "data".getBytes(StandardCharsets.UTF_8), "text/csv");

        var batchSizes = new java.util.ArrayList<Integer>();
        var result = provider.readInBatches(payload, Map.of(), 10, batch -> batchSizes.add(batch.records().size()));

        assertEquals(3, result.recordCount(), "total includes all pages");
        assertEquals(List.of(2, 1), batchSizes, "consumer receives one page per invocation");
        assertEquals(1, staging.deleted.size(), "staged input is cleaned after the loop");
    }

    @Test
    void collectReadResultRejectsRemoteReaderBecauseItRequiresStreamingPipeline() {
        var staging = new FakeArtifactStaging();
        RemotePluginInvoker invoker = (desc, taskType, context, payload) ->
                TaskResult.success("p1", Map.of("records", List.of(Map.of("r", "1"))));
        var reader = new RemoteReaderProvider("MY_READER", descriptor("2"), invoker, new RemotePluginRegistry(), staging);
        var payload = SourcePayload.fromBytes("big.csv", "data".getBytes(StandardCharsets.UTF_8), "text/csv");
        var support = new FileReadRuntimeSupport(mock(JsonConfigurationMapper.class));

        var error = assertThrows(IllegalStateException.class, () -> support.collectReadResult(reader, payload, Map.of()));

        assertTrue(error.getMessage().contains("streaming FILE_READ pipeline"));
    }

    @Test
    void failsWhenTheCursorDoesNotAdvance() {
        var staging = new FakeArtifactStaging();
        RemotePluginInvoker invoker = (desc, taskType, context, payload) ->
                TaskResult.success("stuck", Map.of("records", List.of(Map.of("r", "x")), "nextCursor", "stuck-cursor"));
        var provider = new RemoteReaderProvider("MY_READER", descriptor("2"), invoker, new RemotePluginRegistry(), staging);
        var payload = SourcePayload.fromBytes("loop.csv", "data".getBytes(StandardCharsets.UTF_8), "text/csv");

        var error = assertThrows(IllegalStateException.class,
                () -> provider.readInBatches(payload, Map.of(), 10, batch -> { }));
        assertTrue(error.getMessage().contains("no avanza"), "cursor progress guard");
        assertEquals(1, staging.deleted.size(), "staged input is cleaned even when the guard trips");
    }

    @Test
    void failsGracefullyWhenSourceHasNoKnownContentLength() {
        // Regresión de comportamiento (S3ArtifactStaging): una fuente SIN content-length (file().size()==null) ya no se
        // materializa a ciegas (riesgo OOM en memoria acotada) -> el staging lanza y el reader lo DEGRADA limpio. Como
        // stageForDownload lanza ANTES de subir, no queda objeto huérfano que limpiar. El fake ahora replica el throw.
        var staging = new FakeArtifactStaging();
        RemotePluginInvoker invoker = (desc, taskType, context, payload) ->
                TaskResult.success("ok", Map.of("records", List.of()));
        var provider = new RemoteReaderProvider("MY_READER", descriptor("2"), invoker, new RemotePluginRegistry(), staging);
        var payload = new SourcePayload(
                new SelectedSourceFile("unknown.csv", "unknown.csv", "text/csv", null, Instant.now()),
                () -> new ByteArrayInputStream("data".getBytes(StandardCharsets.UTF_8)));

        var error = assertThrows(IllegalStateException.class,
                () -> provider.readInBatches(payload, Map.of(), 10, batch -> { }));
        assertTrue(error.getMessage().contains("content length") || error.getMessage().contains("stagear"),
                "debe degradar por content-length desconocido: " + error.getMessage());
        assertEquals(0, staging.deleted.size(), "nada se stageó (throw antes del upload) -> nada huérfano que limpiar");
    }

    @Test
    void failsFastWhenSpiVersionDoesNotSupportArtifactRef() {
        RemotePluginInvoker invoker = (desc, taskType, context, payload) ->
                TaskResult.success("ok", Map.of("records", List.of()));
        var provider = new RemoteReaderProvider("MY_READER", descriptor("1"), invoker,
                new RemotePluginRegistry(), new FakeArtifactStaging());
        var payload = SourcePayload.fromBytes("x.csv", new byte[10], "text/csv");

        var error = assertThrows(IllegalStateException.class,
                () -> provider.readInBatches(payload, Map.of(), 10, batch -> { }));
        assertTrue(error.getMessage().contains("spiVersion"), "error must explain version negotiation");
    }
}
