package com.integrationhub.platform.provider.task.filewrite;

import com.integrationhub.platform.provider.task.artifact.LocalTempArtifactStore;
import com.integrationhub.platform.provider.task.writer.CsvWriter;
import com.integrationhub.platform.repository.TaskInputRepository;
import com.integrationhub.platform.service.task.artifact.ArtifactStoreRegistry;
import com.integrationhub.platform.service.task.writer.FileFormatWriterRegistry;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FileWriteTaskProviderTest {

    private static FileWriteTaskProvider recordsProvider() {
        return new FileWriteTaskProvider(
                new FileFormatWriterRegistry(List.of(new CsvWriter())),
                new ArtifactStoreRegistry(List.of(new LocalTempArtifactStore())));
    }

    private static ReadRecord row(long id, String dni, String monto) {
        var values = new LinkedHashMap<String, Object>();
        values.put("id", id);
        values.put("dni", dni);
        values.put("monto", monto);
        return new ReadRecord(values);
    }

    @Test
    void writesCsvFromRecordsWithHeaderDetailTrailerAndAggregates() throws Exception {
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

        var result = recordsProvider().execute(context, config);

        assertTrue(result.success());
        assertEquals(2L, ((Number) result.outputs().get("recordCount")).longValue());

        var path = String.valueOf(result.outputs().get("archivePath"));
        assertEquals("H,123,2\n111,1000.00\n222,2500.50\nT,3500.50\n",
                Files.readString(Path.of(path), StandardCharsets.UTF_8));
        assertEquals(1, ((List<?>) result.outputs().get("files")).size());
        Files.deleteIfExists(Path.of(path));
    }

    @Test
    void resolvesHeaderTrailerCellBoundToSummaryOutputOfAPreviousTask() throws Exception {
        // ADR-004: una celda de cabecera/trailer puede ligarse a un output AGREGADO (summary/out) de una tarea
        // previa; se lee del Map publicado en taskOutputs bajo ref.<output>. Es el lugar natural de estos origenes
        // (no son un stream de filas para el detalle).
        var context = new TaskContext(9L, 1L);
        var taskOutputs = new LinkedHashMap<String, Object>();
        taskOutputs.put("sp1.records", List.of(new ReadRecord(Map.of("dni", "111"))));
        taskOutputs.put("sp1.summary", Map.of("processedCount", 42, "targetTable", "pagos"));
        context.attributes().put("taskOutputs", taskOutputs);
        var config = Map.<String, Object>of(
                "format", "CSV",
                "input", Map.of("sourceTaskRef", "sp1", "sourceOutput", "records"),
                "layout", Map.of(
                        "header", List.of(Map.of("sourceOutput", "summary", "sourceTaskRef", "sp1", "sourceKey", "processedCount")),
                        "detail", Map.of("columns", List.of(Map.of("field", "dni"))),
                        "trailer", List.of(Map.of("sourceOutput", "summary", "sourceTaskRef", "sp1", "sourceKey", "targetTable"))));

        var result = recordsProvider().execute(context, config);

        var path = String.valueOf(result.outputs().get("archivePath"));
        // Cabecera = summary.processedCount (42); detalle = dni; trailer = summary.targetTable (pagos).
        assertEquals("42\n111\npagos\n", Files.readString(Path.of(path), StandardCharsets.UTF_8));
        Files.deleteIfExists(Path.of(path));
    }

    @Test
    void unresolvedSummaryBindingRendersEmptyCell() throws Exception {
        var context = new TaskContext(9L, 1L);
        context.attributes().put("taskOutputs", Map.of("sp1.records", List.of(new ReadRecord(Map.of("dni", "111")))));
        var config = Map.<String, Object>of(
                "format", "CSV",
                "input", Map.of("sourceTaskRef", "sp1", "sourceOutput", "records"),
                "layout", Map.of(
                        "detail", Map.of("columns", List.of(Map.of("field", "dni"))),
                        // Clave inexistente en el summary (o summary ausente) -> celda vacia (consistente con metadata/aggregate).
                        "trailer", List.of(Map.of("sourceOutput", "summary", "sourceTaskRef", "sp1", "sourceKey", "nope"))));

        var result = recordsProvider().execute(context, config);

        var path = String.valueOf(result.outputs().get("archivePath"));
        assertEquals("111\n\n", Files.readString(Path.of(path), StandardCharsets.UTF_8));
        Files.deleteIfExists(Path.of(path));
    }

    @Test
    void writesCsvFromTableWithKeysetPagingAndTrailerAggregates() throws Exception {
        var repository = mock(TaskInputRepository.class);
        var dataSource = mock(DataSource.class);
        // batchSize=2: pagina 1 (llena) -> pagina 2 (corta, corta el loop)
        when(repository.readBatch(eq(dataSource), eq("ventas"), eq("id"), anyMap(), isNull(), eq(2)))
                .thenReturn(List.of(row(1, "111", "1000.00"), row(2, "222", "2000.00")));
        when(repository.readBatch(eq(dataSource), eq("ventas"), eq("id"), anyMap(), eq(2L), eq(2)))
                .thenReturn(List.of(row(3, "333", "500.50")));
        when(repository.count(eq(dataSource), eq("ventas"), anyMap())).thenReturn(3L);

        var provider = new FileWriteTaskProvider(
                new FileFormatWriterRegistry(List.of(new CsvWriter())),
                new ArtifactStoreRegistry(List.of(new LocalTempArtifactStore())),
                repository, dataSource, null);

        var context = new TaskContext(7L, 8L);
        var config = Map.<String, Object>of(
                "format", "CSV",
                "input", Map.of("sourceOutput", "table", "table", "ventas",
                        "cursor", Map.of("orderBy", "id"), "batchSize", 2),
                "layout", Map.of(
                        "header", List.of(Map.of("value", "H"), Map.of("aggregate", "count")),
                        "detail", Map.of("delimiter", ",", "columns", List.of(Map.of("field", "dni"), Map.of("field", "monto"))),
                        "trailer", List.of(Map.of("value", "T"), Map.of("aggregate", "count"), Map.of("aggregate", "sum", "field", "monto"))));

        var result = provider.execute(context, config);

        assertTrue(result.success());
        assertEquals(3L, ((Number) result.outputs().get("recordCount")).longValue());

        var path = String.valueOf(result.outputs().get("archivePath"));
        // header count por pre-query = 3; trailer count acumulado = 3; trailer sum = 3500.50
        assertEquals("H,3\n111,1000.00\n222,2000.00\n333,500.50\nT,3,3500.50\n",
                Files.readString(Path.of(path), StandardCharsets.UTF_8));
        Files.deleteIfExists(Path.of(path));
    }

    @Test
    void tableSourceRejectsHeaderSum() {
        var repository = mock(TaskInputRepository.class);
        var provider = new FileWriteTaskProvider(
                new FileFormatWriterRegistry(List.of(new CsvWriter())),
                new ArtifactStoreRegistry(List.of(new LocalTempArtifactStore())),
                repository, mock(DataSource.class), null);
        var config = Map.<String, Object>of(
                "format", "CSV",
                "input", Map.of("sourceOutput", "table", "table", "ventas", "cursor", Map.of("orderBy", "id")),
                "layout", Map.of(
                        "header", List.of(Map.of("aggregate", "sum", "field", "monto")),
                        "detail", Map.of("columns", List.of(Map.of("field", "dni")))));
        assertThrows(IllegalArgumentException.class, () -> provider.execute(new TaskContext(1L, 1L), config));
    }

    @Test
    void tableSourceFailsOnNullCursor() {
        var repository = mock(TaskInputRepository.class);
        var dataSource = mock(DataSource.class);
        // fila sin columna 'id' -> cursorValue null -> guard fail-loud (evita el re-leer la primera pagina)
        var rowWithoutId = new ReadRecord(new LinkedHashMap<>(Map.of("dni", "1")));
        when(repository.readBatch(eq(dataSource), eq("t"), eq("id"), anyMap(), isNull(), eq(5000)))
                .thenReturn(List.of(rowWithoutId));
        var provider = new FileWriteTaskProvider(
                new FileFormatWriterRegistry(List.of(new CsvWriter())),
                new ArtifactStoreRegistry(List.of(new LocalTempArtifactStore())),
                repository, dataSource, null);
        var config = Map.<String, Object>of(
                "format", "CSV",
                "input", Map.of("sourceOutput", "table", "table", "t", "cursor", Map.of("orderBy", "id")),
                "layout", Map.of("detail", Map.of("columns", List.of(Map.of("field", "dni")))));
        assertThrows(IllegalStateException.class, () -> provider.execute(new TaskContext(1L, 1L), config));
    }

    @Test
    void tableSourceRequiresOrderBy() {
        var provider = new FileWriteTaskProvider(
                new FileFormatWriterRegistry(List.of(new CsvWriter())),
                new ArtifactStoreRegistry(List.of(new LocalTempArtifactStore())),
                mock(TaskInputRepository.class), mock(DataSource.class), null);
        var config = Map.<String, Object>of(
                "format", "CSV",
                "input", Map.of("sourceOutput", "table", "table", "ventas"),
                "layout", Map.of("detail", Map.of("columns", List.of(Map.of("field", "dni")))));
        assertThrows(IllegalArgumentException.class, () -> provider.execute(new TaskContext(1L, 1L), config));
    }

    @Test
    void requiresSourceTaskRef() {
        var config = Map.<String, Object>of(
                "format", "CSV",
                "layout", Map.of("detail", Map.of("columns", List.of(Map.of("field", "a")))));
        assertThrows(IllegalArgumentException.class, () -> recordsProvider().execute(new TaskContext(1L, 1L), config));
    }
}
