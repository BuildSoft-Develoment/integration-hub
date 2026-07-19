package com.integrationhub.platform.provider.task.writer;

import com.integrationhub.platform.spi.reader.ReadRecord;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TxtWriterTest {

    @Test
    void writesFixedWidthHeaderDetailTrailer() throws Exception {
        var config = Map.<String, Object>of(
                "encoding", "UTF-8",
                "layout", Map.of(
                        "header", List.of(Map.of("value", "H", "length", 5), Map.of("value", "20260719", "length", 8)),
                        "detail", Map.of("columns", List.of(
                                Map.of("field", "dni", "length", 8),
                                Map.of("field", "monto", "length", 10, "align", "right", "pad", "0"))),
                        "trailer", List.of(Map.of("value", "T", "length", 5), Map.of("length", 6, "align", "right", "pad", "0"))));
        var out = new ByteArrayOutputStream();
        try (var session = new TxtWriter().open(out, config)) {
            session.writeHeader(List.of("H", "20260719"));
            session.writeDetail(List.of(new ReadRecord(Map.of("dni", "111", "monto", "1000.00"))));
            session.writeTrailer(List.of("T", "2"));
        }
        // header: 'H' left-pad a 5 + '20260719' (8) ; detalle: 'dni' left a 8 + monto right-pad '0' a 10
        assertEquals("H    20260719\n111     0001000.00\nT    000002\n", out.toString(StandardCharsets.UTF_8));
    }

    @Test
    void crlfLineEnding() throws Exception {
        var config = Map.<String, Object>of("layout", Map.of(
                "detail", Map.of("lineEnding", "CRLF", "columns", List.of(Map.of("field", "a", "length", 3)))));
        var out = new ByteArrayOutputStream();
        try (var session = new TxtWriter().open(out, config)) {
            session.writeDetail(List.of(new ReadRecord(Map.of("a", "1")), new ReadRecord(Map.of("a", "22"))));
        }
        assertEquals("1  \r\n22 \r\n", out.toString(StandardCharsets.UTF_8));
    }

    @Test
    void failsWhenValueExceedsWidth() throws Exception {
        var config = Map.<String, Object>of("layout", Map.of(
                "detail", Map.of("columns", List.of(Map.of("field", "dni", "length", 2)))));
        var out = new ByteArrayOutputStream();
        var session = new TxtWriter().open(out, config);
        assertThrows(IllegalArgumentException.class,
                () -> session.writeDetail(List.of(new ReadRecord(Map.of("dni", "12345")))));
        session.close();
    }

    @Test
    void validateRejectsMissingColumns() {
        assertThrows(IllegalArgumentException.class, () -> new TxtWriter().validateConfiguration(Map.of()));
    }

    @Test
    void validateRejectsColumnWithoutLength() {
        var config = Map.<String, Object>of("layout", Map.of(
                "detail", Map.of("columns", List.of(Map.of("field", "dni")))));
        assertThrows(IllegalArgumentException.class, () -> new TxtWriter().validateConfiguration(config));
    }
}
