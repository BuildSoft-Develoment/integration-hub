package com.integrationhub.platform.provider.task.writer;

import com.integrationhub.platform.spi.reader.ReadRecord;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CsvWriterTest {

    private static Map<String, Object> configWithColumns() {
        return Map.of(
                "encoding", "UTF-8",
                "layout", Map.of("detail", Map.of(
                        "delimiter", ",",
                        "columns", List.of(Map.of("field", "dni"), Map.of("field", "monto")))));
    }

    @Test
    void appliesFieldTypeFormatting() throws Exception {
        var config = Map.<String, Object>of("layout", Map.of("detail", Map.of(
                "delimiter", ",",
                "columns", List.of(
                        Map.of("field", "monto", "type", "NUMBER", "format", "0.00"),
                        Map.of("field", "fecha", "type", "DATE", "format", "yyyyMMdd")))));
        var out = new ByteArrayOutputStream();
        try (var session = new CsvWriter().open(out, config)) {
            session.writeDetail(List.of(new ReadRecord(Map.of("monto", "1000.5", "fecha", "2026-07-19"))));
        }
        // monto -> 2 decimales; fecha -> yyyyMMdd
        assertEquals("1000.50,20260719\n", out.toString(StandardCharsets.UTF_8));
    }

    @Test
    void numberFormattingRoundsHalfUp() throws Exception {
        var config = Map.<String, Object>of("layout", Map.of("detail", Map.of(
                "columns", List.of(Map.of("field", "monto", "type", "NUMBER", "format", "0.00")))));
        var out = new ByteArrayOutputStream();
        try (var session = new CsvWriter().open(out, config)) {
            // 1000.505 -> HALF_UP redondea a 1000.51 (HALF_EVEN daria 1000.50 por el '0' par previo).
            session.writeDetail(List.of(new ReadRecord(Map.of("monto", "1000.505"))));
        }
        assertEquals("1000.51\n", out.toString(StandardCharsets.UTF_8));
    }

    @Test
    void numberFormattingHonorsConfiguredRoundingMode() throws Exception {
        var config = Map.<String, Object>of("layout", Map.of("detail", Map.of(
                "columns", List.of(Map.of("field", "monto", "type", "NUMBER", "format", "0.00", "rounding", "HALF_EVEN")))));
        var out = new ByteArrayOutputStream();
        try (var session = new CsvWriter().open(out, config)) {
            // 1000.505 con HALF_EVEN -> 1000.50 (el '0' previo es par); con el HALF_UP default daria 1000.51.
            session.writeDetail(List.of(new ReadRecord(Map.of("monto", "1000.505"))));
        }
        assertEquals("1000.50\n", out.toString(StandardCharsets.UTF_8));
    }

    @Test
    void numberFormattingFailsSafeOnUnnecessaryRounding() throws Exception {
        var config = Map.<String, Object>of("layout", Map.of("detail", Map.of(
                "columns", List.of(Map.of("field", "monto", "type", "NUMBER", "format", "0.00", "rounding", "UNNECESSARY")))));
        var out = new ByteArrayOutputStream();
        try (var session = new CsvWriter().open(out, config)) {
            // UNNECESSARY sobre un valor que requiere redondeo lanza ArithmeticException en DecimalFormat;
            // el formatter es fail-safe -> cae al valor crudo (1000.505), nunca aborta la escritura del archivo.
            session.writeDetail(List.of(new ReadRecord(Map.of("monto", "1000.505"))));
        }
        assertEquals("1000.505\n", out.toString(StandardCharsets.UTF_8));
    }

    @Test
    void writesHeaderDetailTrailerWithRfc4180Quoting() throws Exception {
        var out = new ByteArrayOutputStream();
        var writer = new CsvWriter();
        try (var session = writer.open(out, configWithColumns())) {
            session.writeHeader(List.of("H", "20260718", 2));
            session.writeDetail(List.of(
                    new ReadRecord(Map.of("dni", "111", "monto", "1000.00")),
                    // el dni trae el delimitador -> debe entrecomillarse (RFC-4180)
                    new ReadRecord(Map.of("dni", "222, S.A.", "monto", "2500.50"))));
            session.writeTrailer(List.of("T", "3500.50"));
        }

        var csv = out.toString(StandardCharsets.UTF_8);
        assertEquals("H,20260718,2\n111,1000.00\n\"222, S.A.\",2500.50\nT,3500.50\n", csv);
    }

    @Test
    void streamsMultipleDetailBatchesInOrder() throws Exception {
        var out = new ByteArrayOutputStream();
        var writer = new CsvWriter();
        try (var session = writer.open(out, configWithColumns())) {
            session.writeDetail(List.of(new ReadRecord(Map.of("dni", "1", "monto", "10"))));
            session.writeDetail(List.of(new ReadRecord(Map.of("dni", "2", "monto", "20"))));
        }
        assertEquals("1,10\n2,20\n", out.toString(StandardCharsets.UTF_8));
    }

    @Test
    void crlfLineEndingWhenConfigured() throws Exception {
        var config = Map.<String, Object>of("layout", Map.of("detail", Map.of(
                "delimiter", ",", "lineEnding", "CRLF",
                "columns", List.of(Map.of("field", "a")))));
        var out = new ByteArrayOutputStream();
        try (var session = new CsvWriter().open(out, config)) {
            session.writeDetail(List.of(new ReadRecord(Map.of("a", "1")), new ReadRecord(Map.of("a", "2"))));
        }
        assertEquals("1\r\n2\r\n", out.toString(StandardCharsets.UTF_8));
    }

    @Test
    void sessionCloseFlushesButDoesNotCloseTheArtifactStream() throws Exception {
        var closed = new boolean[]{false};
        var out = new ByteArrayOutputStream() {
            @Override
            public void close() {
                closed[0] = true;
            }
        };
        try (var session = new CsvWriter().open(out, configWithColumns())) {
            session.writeDetail(List.of(new ReadRecord(Map.of("dni", "1", "monto", "10"))));
        }
        // el dueno del stream (WritableArtifact) es quien cierra; el session solo flushea
        assertEquals("1,10\n", out.toString(StandardCharsets.UTF_8));
        org.junit.jupiter.api.Assertions.assertFalse(closed[0], "el session no debe cerrar el stream del artefacto");
    }

    @Test
    void validateRejectsMissingColumns() {
        var writer = new CsvWriter();
        assertThrows(IllegalArgumentException.class, () -> writer.validateConfiguration(Map.of()));
    }
}
