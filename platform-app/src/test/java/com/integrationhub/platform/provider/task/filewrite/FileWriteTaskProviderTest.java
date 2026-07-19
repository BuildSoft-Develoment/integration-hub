package com.integrationhub.platform.provider.task.filewrite;

import com.integrationhub.platform.provider.artifact.LocalTempArtifactStore;
import com.integrationhub.platform.provider.writer.CsvWriter;
import com.integrationhub.platform.service.artifact.ArtifactStoreRegistry;
import com.integrationhub.platform.service.writer.FileFormatWriterRegistry;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileWriteTaskProviderTest {

    private static FileWriteTaskProvider provider() {
        return new FileWriteTaskProvider(
                new FileFormatWriterRegistry(List.of(new CsvWriter())),
                new ArtifactStoreRegistry(List.of(new LocalTempArtifactStore())));
    }

    @Test
    void writesCsvWithHeaderDetailTrailerAndAggregates() throws Exception {
        var context = new TaskContext(123L, 45L);
        context.attributes().put("taskOutputs", Map.of("sp1.records", List.of(
                new ReadRecord(Map.of("dni", "111", "monto", "1000.00")),
                new ReadRecord(Map.of("dni", "222", "monto", "2500.50")))));
        var config = Map.<String, Object>of(
                "format", "CSV",
                "input", Map.of("sourceTaskRef", "sp1", "sourceOutput", "records"),
                "layout", Map.of(
                        "header", List.of(Map.of("value", "H"), Map.of("metadata", "_processExecutionId"), Map.of("aggregate", "count")),
                        "detail", Map.of("delimiter", ",", "columns", List.of(Map.of("field", "dni"), Map.of("field", "monto"))),
                        "trailer", List.of(Map.of("value", "T"), Map.of("aggregate", "sum", "field", "monto"))));

        var result = provider().execute(context, config);

        assertTrue(result.success());
        assertEquals(2, result.outputs().get("recordCount"));

        var path = String.valueOf(result.outputs().get("archivePath"));
        var content = Files.readString(Path.of(path), StandardCharsets.UTF_8);
        // header (constante + metadata + count) / detalle / trailer (constante + sum de monto)
        assertEquals("H,123,2\n111,1000.00\n222,2500.50\nT,3500.50\n", content);

        var files = (List<?>) result.outputs().get("files");
        assertEquals(1, files.size(), "handoff multi-archivo: un elemento en fase 1");

        Files.deleteIfExists(Path.of(path));
    }

    @Test
    void requiresSourceTaskRef() {
        var context = new TaskContext(1L, 1L);
        var config = Map.<String, Object>of(
                "format", "CSV",
                "layout", Map.of("detail", Map.of("columns", List.of(Map.of("field", "a")))));
        assertThrows(IllegalArgumentException.class, () -> provider().execute(context, config));
    }
}
