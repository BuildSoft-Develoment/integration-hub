package com.integrationhub.platform.provider.task.writer;

import com.integrationhub.platform.spi.reader.ReadRecord;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-016: XlsxWriter (POI SXSSF). Verifica byte-level (escribe -> lee de vuelta con POI) que las celdas salen
 * TIPADAS: NUMBER como numero real (no texto), DATE como fecha; cabecera en negrita + congelada.
 */
// @covers ADR-016
class XlsxWriterTest {

    private final XlsxWriter writer = new XlsxWriter();

    private Map<String, Object> config(Map<String, Object> xlsx) {
        var columns = List.of(
                Map.of("field", "ref", "type", "STRING"),
                Map.of("field", "monto", "type", "NUMBER", "format", "0.00"),
                Map.of("field", "fecha", "type", "DATE", "format", "yyyy-MM-dd"));
        var config = new LinkedHashMap<String, Object>();
        config.put("layout", Map.of("detail", Map.of("columns", columns)));
        if (xlsx != null) {
            config.put("xlsx", xlsx);
        }
        return config;
    }

    private ReadRecord record(String ref, String monto, String fecha) {
        var values = new LinkedHashMap<String, Object>();
        values.put("ref", ref);
        values.put("monto", monto);
        values.put("fecha", fecha);
        return new ReadRecord(values);
    }

    private byte[] write(Map<String, Object> xlsx, List<ReadRecord> detail, List<Object> header, List<Object> trailer)
            throws Exception {
        var bos = new ByteArrayOutputStream();
        try (var session = writer.open(bos, config(xlsx))) {
            if (header != null) {
                session.writeHeader(header);
            }
            session.writeDetail(detail);
            if (trailer != null) {
                session.writeTrailer(trailer);
            }
        }
        return bos.toByteArray();
    }

    @Test
    void writesTypedCellsNumberAndDate() throws Exception {
        var bytes = write(Map.of("sheetName", "Export"),
                List.of(record("TX-001", "1000.51", "2026-07-19")),
                List.of("Referencia", "Monto", "Fecha"), null);

        try (var wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            var sheet = wb.getSheet("Export");
            assertNotNull(sheet, "la hoja 'Export' debe existir");
            // cabecera
            assertEquals("Referencia", sheet.getRow(0).getCell(0).getStringCellValue());
            // detalle: STRING, NUMBER (numerico real), DATE (fecha real)
            var row = sheet.getRow(1);
            assertEquals(CellType.STRING, row.getCell(0).getCellType());
            assertEquals("TX-001", row.getCell(0).getStringCellValue());
            assertEquals(CellType.NUMERIC, row.getCell(1).getCellType());
            assertEquals(1000.51, row.getCell(1).getNumericCellValue(), 0.0001);
            assertEquals(CellType.NUMERIC, row.getCell(2).getCellType());
            assertTrue(DateUtil.isCellDateFormatted(row.getCell(2)), "la columna fecha debe ser una celda de fecha");
            assertEquals(LocalDate.of(2026, 7, 19), row.getCell(2).getLocalDateTimeCellValue().toLocalDate());
        }
    }

    @Test
    void headerIsBoldAndFrozenByDefault() throws Exception {
        var bytes = write(null, List.of(record("A", "1", "2026-01-01")), List.of("H1", "H2", "H3"), null);

        try (var wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            var sheet = wb.getSheetAt(0);
            var headerCell = sheet.getRow(0).getCell(0);
            assertTrue(headerCell.getCellStyle().getFont().getBold(), "la cabecera debe estar en negrita por default");
            var pane = sheet.getPaneInformation();
            assertNotNull(pane, "debe haber freeze pane");
            assertTrue(pane.isFreezePane() && pane.getHorizontalSplitPosition() == 1,
                    "la cabecera (fila 1) debe quedar congelada");
        }
    }

    @Test
    void plainHeaderWhenConfigured() throws Exception {
        var bytes = write(Map.of("headerStyle", "PLAIN", "freezeHeader", "false"),
                List.of(record("A", "1", "2026-01-01")), List.of("H1"), null);

        try (var wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            var sheet = wb.getSheetAt(0);
            assertTrue(!sheet.getRow(0).getCell(0).getCellStyle().getFont().getBold(), "PLAIN -> sin negrita");
            assertEquals(null, sheet.getPaneInformation(), "freezeHeader=false -> sin freeze pane");
        }
    }

    @Test
    void nonNumericValueInNumberColumnFallsBackToString() throws Exception {
        var bytes = write(Map.of(), List.of(record("A", "N/A", "2026-01-01")), null, null);

        try (var wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            // fila 0 = detalle (no hay cabecera). monto='N/A' no parsea -> celda de texto (fail-safe).
            var cell = wb.getSheetAt(0).getRow(0).getCell(1);
            assertEquals(CellType.STRING, cell.getCellType());
            assertEquals("N/A", cell.getStringCellValue());
        }
    }

    @Test
    void validateConfigurationRequiresColumns() {
        assertThrows(IllegalArgumentException.class, () -> writer.validateConfiguration(Map.of()));
    }

    @Test
    void formatIsXlsx() {
        assertEquals("XLSX", writer.format());
    }
}
