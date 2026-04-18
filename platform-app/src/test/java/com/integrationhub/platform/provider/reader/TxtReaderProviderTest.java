package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TxtReaderProviderTest {

    private final TxtReaderProvider provider = new TxtReaderProvider();

    @Test
    void readsTxtWithDelimiterUsingConfiguredColumnPositions() {
        var payload = SourcePayload.fromBytes(
                "cliente.txt",
                """
                dni|nom|total|color
                1|xx1|11|red
                2|xx2|12|red
                3|xx3|13|red
                4|xx4|14|red
                """.getBytes(StandardCharsets.UTF_8),
                "text/plain"
        );

        ReadResult result = read(provider, payload, Map.of(
                "mode", "delimited",
                "delimiter", "|",
                "rowData", 2,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1),
                        Map.of("name", "nombre", "position", 2),
                        Map.of("name", "color", "position", 4)
                )
        ));

        assertEquals(4, result.recordCount());
        assertEquals(0, result.skippedCount());
        assertEquals("1", result.records().get(0).values().get("dni"));
        assertEquals("xx1", result.records().get(0).values().get("nombre"));
        assertEquals("red", result.records().get(3).values().get("color"));
    }

    @Test
    void appliesTxtFieldDefaultsAndScriptAndSkipsInvalidRecords() {
        var payload = SourcePayload.fromBytes(
                "cliente.txt",
                """
                dni|nom|total|fecha
                1|xx1|11|2026-03-26
                2|xx2||2026-03-27
                3||15|2026-03-28
                """.getBytes(StandardCharsets.UTF_8),
                "text/plain"
        );

        ReadResult result = read(provider, payload, Map.of(
                "mode", "delimited",
                "delimiter", "|",
                "rowData", 2,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1, "type", "NUMBER", "required", true),
                        Map.of("name", "nombre", "position", 2, "type", "TEXT", "size", 10,
                                "script", "if (value == null || value == '') { valid = false; } else { value = value.toUpperCase(); }"),
                        Map.of("name", "total", "position", 3, "type", "NUMBER", "defaultValue", "0"),
                        Map.of("name", "fecha", "position", 4, "type", "DATE")
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals(1, result.skippedCount());
        assertEquals(4, result.skippedRows().get(0).rowNumber());
        assertEquals("Field 'nombre' was rejected by script", result.skippedRows().get(0).reason());
        assertEquals(new BigDecimal("1"), result.records().get(0).values().get("dni"));
        assertEquals("XX1", result.records().get(0).values().get("nombre"));
        assertEquals(new BigDecimal("0"), result.records().get(1).values().get("total"));
        assertEquals("2026-03-27", result.records().get(1).values().get("fecha").toString());
    }

    @Test
    void rejectsDelimitedTxtWithoutConfiguredFields() {
        var payload = SourcePayload.fromBytes(
                "cliente.txt",
                """
                1|xx1|11|red
                2|xx2|12|red
                """.getBytes(StandardCharsets.UTF_8),
                "text/plain"
        );

        var error = assertThrows(IllegalArgumentException.class, () -> provider.readInBatches(payload, Map.of(
                "mode", "delimited",
                "delimiter", "|",
                "rowData", 0
        ), 2, batch -> {
        }));

        assertEquals("TXT delimited mode requires field definitions", error.getMessage());
    }

    @Test
    void readsTxtWithoutDelimiterUsingFixedLengthRanges() {
        var payload = SourcePayload.fromBytes(
                "cliente.txt",
                """
                dni     nom    total color
                1       xx1    11  red  
                2       xx2    12  red  
                3       xx3    13  red  
                4       xx4    14  red  
                """.getBytes(StandardCharsets.UTF_8),
                "text/plain"
        );

        ReadResult result = read(provider, payload, Map.of(
                "mode", "fixed-length",
                "rowData", 2,
                "fields", List.of(
                        Map.of("name", "dni", "start", 1, "end", 8),
                        Map.of("name", "nombre", "start", 9, "end", 15),
                        Map.of("name", "color", "start", 20, "end", 24)
                )
        ));

        assertEquals(4, result.recordCount());
        assertEquals(0, result.skippedCount());
        assertEquals("1", result.records().get(0).values().get("dni"));
        assertEquals("xx1", result.records().get(0).values().get("nombre"));
        assertEquals("red", result.records().get(3).values().get("color"));
    }

    @Test
    void treatsRowDataAsOneBasedRowNumber() {
        var payload = SourcePayload.fromBytes(
                "cliente.txt",
                """
                1|xx1|11|red
                2|xx2|12|blue
                """.getBytes(StandardCharsets.UTF_8),
                "text/plain"
        );

        ReadResult result = read(provider, payload, Map.of(
                "mode", "delimited",
                "delimiter", "|",
                "rowData", 1,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1),
                        Map.of("name", "nombre", "position", 2)
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals("1", result.records().get(0).values().get("dni"));
    }

    private ReadResult read(TxtReaderProvider provider, SourcePayload payload, Map<String, Object> configuration) {
        var records = new ArrayList<ReadRecord>();
        var result = provider.readInBatches(payload, configuration, 2, batch -> records.addAll(batch.records()));
        return new ReadResult(List.copyOf(records), result.recordCount(), result.skippedCount(), result.skippedRows());
    }
}
