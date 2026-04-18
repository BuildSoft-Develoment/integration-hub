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

class CsvReaderProviderTest {

    private final CsvReaderProvider provider = new CsvReaderProvider();

    @Test
    void readsCsvUsingConfiguredColumnPositionsAndRowData() {
        var payload = SourcePayload.fromBytes(
                "clientes.csv",
                """
                dni;nom;total;color
                1;xx1;11;red
                2;xx2;12;blue
                """.getBytes(StandardCharsets.UTF_8),
                "text/csv"
        );

        ReadResult result = read(provider, payload, Map.of(
                "delimiter", ";",
                "rowData", 2,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1),
                        Map.of("name", "nombre", "position", 2),
                        Map.of("name", "color", "position", 4)
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals(0, result.skippedCount());
        assertEquals("1", result.records().get(0).values().get("dni"));
        assertEquals("xx1", result.records().get(0).values().get("nombre"));
        assertEquals("blue", result.records().get(1).values().get("color"));
    }

    @Test
    void appliesCsvFieldRulesAndSkipsInvalidRows() {
        var payload = SourcePayload.fromBytes(
                "clientes.csv",
                """
                1;ana;12
                2;luis;
                3;;10
                """.getBytes(StandardCharsets.UTF_8),
                "text/csv"
        );

        ReadResult result = read(provider, payload, Map.of(
                "delimiter", ";",
                "rowData", 1,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1, "type", "NUMBER", "required", true),
                        Map.of("name", "nombre", "position", 2, "size", 10,
                                "script", "if (value == null || value == '') { valid = false; } else { value = value.toUpperCase(); }"),
                        Map.of("name", "total", "position", 3, "type", "NUMBER", "defaultValue", "0")
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals(1, result.skippedCount());
        assertEquals(3, result.skippedRows().get(0).rowNumber());
        assertEquals("Field 'nombre' was rejected by script", result.skippedRows().get(0).reason());
        assertEquals(new BigDecimal("2"), result.records().get(1).values().get("dni"));
        assertEquals("LUIS", result.records().get(1).values().get("nombre"));
        assertEquals(new BigDecimal("0"), result.records().get(1).values().get("total"));
    }

    @Test
    void readsCsvUsingConfiguredColumnPositionsWithoutHeaderRow() {
        var payload = SourcePayload.fromBytes(
                "clientes.csv",
                """
                1;xx1;11;red
                2;xx2;12;blue
                """.getBytes(StandardCharsets.UTF_8),
                "text/csv"
        );

        ReadResult result = read(provider, payload, Map.of(
                "delimiter", ";",
                "rowData", 1,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1),
                        Map.of("name", "nombre", "position", 2),
                        Map.of("name", "color", "position", 4)
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals(0, result.skippedCount());
        assertEquals("1", result.records().get(0).values().get("dni"));
        assertEquals("blue", result.records().get(1).values().get("color"));
    }

    @Test
    void rejectsCsvWithoutConfiguredFields() {
        var payload = SourcePayload.fromBytes(
                "clientes.csv",
                """
                001;Ana
                002;Luis
                """.getBytes(StandardCharsets.UTF_8),
                "text/csv"
        );

        var error = assertThrows(IllegalArgumentException.class, () -> provider.readInBatches(payload, Map.of(
                "delimiter", ";",
                "rowData", 1
        ), 2, batch -> {
        }));

        assertEquals("CSV requires field definitions", error.getMessage());
    }

    @Test
    void treatsCsvRowDataAsOneBasedRowNumber() {
        var payload = SourcePayload.fromBytes(
                "clientes.csv",
                """
                1;xx1;11;red
                2;xx2;12;blue
                """.getBytes(StandardCharsets.UTF_8),
                "text/csv"
        );

        ReadResult result = read(provider, payload, Map.of(
                "delimiter", ";",
                "rowData", 1,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1),
                        Map.of("name", "nombre", "position", 2)
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals("1", result.records().get(0).values().get("dni"));
    }

    private ReadResult read(CsvReaderProvider provider, SourcePayload payload, Map<String, Object> configuration) {
        var records = new ArrayList<ReadRecord>();
        var result = provider.readInBatches(payload, configuration, 2, batch -> records.addAll(batch.records()));
        return new ReadResult(List.copyOf(records), result.recordCount(), result.skippedCount(), result.skippedRows());
    }
}
