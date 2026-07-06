package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.service.artifact.FakeArtifactStaging;
import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.ArtifactReference;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Proyecto #3 Fase 3a: el reader remoto envía el input por REFERENCIA (la plataforma stagea el archivo y presigna un
 * GET; el plugin lo descarga), no como Base64. Negocia por spiVersion (fail-fast). Retira el guard v58 de tamaño.
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
            assertEquals(ArtifactReference.GET, reference.method(), "el reader debe pasar una referencia GET");
            downloadedByPlugin.set(staging.download(reference.uri())); // el plugin descarga el input staged
            return TaskResult.success("ok", Map.of("records", List.of(Map.of("a", "1"), Map.of("a", "2"))));
        };

        var provider = new RemoteReaderProvider("MY_READER", descriptor("2"), invoker, new RemotePluginRegistry(), staging);
        var input = "a\n1\n2\n".getBytes(StandardCharsets.UTF_8);
        var payload = SourcePayload.fromBytes("small.csv", input, "text/csv");

        var result = provider.readInBatches(payload, Map.of(), 10, batch -> { });

        // 3b: records() del ReadResult es VACÍO (se streamea por el consumer); el total va en recordCount().
        assertEquals(0, result.records().size(), "el reader remoto streamea por el consumer, no por records()");
        assertEquals(2, result.recordCount());
        assertArrayEquals(input, downloadedByPlugin.get(), "el plugin recibio el input por referencia (descargo el staged)");
        assertEquals(1, staging.deleted.size(), "el input staged se limpia tras el READ");
    }

    @Test
    void paginatesRecordsAcrossPagesUntilCursorIsEmpty() {
        var staging = new FakeArtifactStaging();
        // El plugin devuelve 2 páginas: la primera con nextCursor, la segunda sin él (fin).
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

        assertEquals(3, result.recordCount(), "acumula el total de todas las páginas");
        assertEquals(List.of(2, 1), batchSizes, "el consumer recibe una página por invocación (streaming)");
        assertEquals(1, staging.deleted.size(), "el input staged se limpia tras el loop");
    }

    @Test
    void failsWhenTheCursorDoesNotAdvance() {
        var staging = new FakeArtifactStaging();
        // El plugin devuelve SIEMPRE el mismo nextCursor -> no avanza (posible loop).
        RemotePluginInvoker invoker = (desc, taskType, context, payload) ->
                TaskResult.success("stuck", Map.of("records", List.of(Map.of("r", "x")), "nextCursor", "stuck-cursor"));
        var provider = new RemoteReaderProvider("MY_READER", descriptor("2"), invoker, new RemotePluginRegistry(), staging);
        var payload = SourcePayload.fromBytes("loop.csv", "data".getBytes(StandardCharsets.UTF_8), "text/csv");

        var error = assertThrows(IllegalStateException.class,
                () -> provider.readInBatches(payload, Map.of(), 10, batch -> { }));
        assertTrue(error.getMessage().contains("no avanza"), "guard de no-progreso del cursor");
        assertEquals(1, staging.deleted.size(), "el input staged se limpia aun al cortar por no-progreso");
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
        assertTrue(error.getMessage().contains("spiVersion"), "el error debe explicar la negociacion de version");
    }
}
