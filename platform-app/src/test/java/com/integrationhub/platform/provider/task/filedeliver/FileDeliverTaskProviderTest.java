package com.integrationhub.platform.provider.task.filedeliver;

import com.integrationhub.platform.provider.task.artifact.LocalTempArtifactStore;
import com.integrationhub.platform.provider.task.sink.FilesystemSink;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.task.artifact.ArtifactStoreRegistry;
import com.integrationhub.platform.service.task.sink.OutputSinkRegistry;
import com.integrationhub.platform.service.task.sink.SinkDefinitionService;
import com.integrationhub.platform.service.task.sink.SinkDefinitionService.SinkDefinition;
import com.integrationhub.platform.spi.task.artifact.StoredArtifact;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FileDeliverTaskProviderTest {

    private static StoredArtifact writeTempFile(String name, String content) throws Exception {
        var store = new LocalTempArtifactStore();
        try (var artifact = store.create(name)) {
            artifact.outputStream().write(content.getBytes(StandardCharsets.UTF_8));
            return artifact.finish();
        }
    }

    private static Map<String, Object> fileRef(StoredArtifact artifact) {
        return Map.of("path", artifact.location(), "name", artifact.name(), "size", artifact.size(), "store", artifact.store());
    }

    private static FileDeliverTaskProvider provider(SinkDefinitionService sinkDefs, JsonConfigurationMapper mapper) {
        return new FileDeliverTaskProvider(
                new OutputSinkRegistry(List.of(new FilesystemSink())),
                new ArtifactStoreRegistry(List.of(new LocalTempArtifactStore())),
                sinkDefs, mapper);
    }

    private static void deleteRecursively(Path dir) throws IOException {
        try (var walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // best-effort
                }
            });
        }
    }

    @Test
    void deliversFilesToFilesystemSink() throws Exception {
        var dir = Files.createTempDirectory("ih-deliver-");
        try {
            var sinkDefs = mock(SinkDefinitionService.class);
            when(sinkDefs.resolve(7L)).thenReturn(new SinkDefinition(7L, "Salida FS QA", "FILESYSTEM", "{}", "OUTPUT"));
            var mapper = mock(JsonConfigurationMapper.class);
            when(mapper.toMap(anyString())).thenReturn(Map.of("path", dir.toString()));

            var f1 = writeTempFile("export.csv", "AAA");
            var context = new TaskContext(9L, 1L);
            context.attributes().put("taskOutputs", Map.of("z1.summary.files", List.of(fileRef(f1))));
            var config = Map.<String, Object>of(
                    "sinkRef", 7,
                    "dropPathTemplate", "out/${originalName}",
                    "input", Map.of("sourceTaskRef", "z1"));

            var result = provider(sinkDefs, mapper).execute(context, config);

            assertTrue(result.success());
            assertEquals(1, ((Number) result.outputs().get("deliveredCount")).intValue());
            assertEquals("AAA", Files.readString(dir.resolve("out/export.csv"), StandardCharsets.UTF_8));

            Files.deleteIfExists(Path.of(f1.location()));
        } finally {
            deleteRecursively(dir);
        }
    }

    @Test
    void rejectsNonOutputSink() {
        var sinkDefs = mock(SinkDefinitionService.class);
        when(sinkDefs.resolve(7L)).thenReturn(new SinkDefinition(7L, "Entrada", "FILESYSTEM", "{}", "INPUT"));
        var config = Map.<String, Object>of("sinkRef", 7, "input", Map.of("sourceTaskRef", "z1"));
        assertThrows(IllegalArgumentException.class,
                () -> provider(sinkDefs, mock(JsonConfigurationMapper.class)).execute(new TaskContext(1L, 1L), config));
    }

    @Test
    void requiresSinkRef() {
        var provider = provider(mock(SinkDefinitionService.class), mock(JsonConfigurationMapper.class));
        assertThrows(IllegalArgumentException.class, () -> provider.execute(new TaskContext(1L, 1L), Map.of()));
    }
}
