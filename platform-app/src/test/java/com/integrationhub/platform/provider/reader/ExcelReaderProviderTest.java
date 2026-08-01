package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SourcePayload;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

// @covers spec 002-catalogo-readers RF-004 (reingenieria: prueba que cubre el/los RF en produccion)
class ExcelReaderProviderTest {

    private final XlsReaderProvider xlsReaderProvider = new XlsReaderProvider();
    private final XlsxReaderProvider xlsxReaderProvider = new XlsxReaderProvider();

    @Test
    void readsXlsWorkbookByConfiguredFieldPositions() throws IOException {
        SourcePayload payload = SourcePayload.fromBytes("clientes.xls", buildXlsBytes(), "application/vnd.ms-excel");

        ReadResult result = read(xlsReaderProvider, payload, Map.of(
                "sheetIndex", 0,
                "rowData", 2,
                "fields", List.of(
                        Map.of("name", "codigo", "position", 1),
                        Map.of("name", "nombre", "position", 2)
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals(0, result.skippedCount());
        assertEquals("001", result.records().get(0).values().get("codigo"));
        assertEquals("Luis", result.records().get(1).values().get("nombre"));
    }

    @Test
    void readsXlsxWorkbookBySheetIndexAndConfiguredFields() throws IOException {
        SourcePayload payload = SourcePayload.fromBytes(
                "clientes.xlsx",
                buildXlsxBytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        ReadResult result = read(xlsxReaderProvider, payload, Map.of(
                "sheetIndex", 1,
                "rowData", 2,
                "fields", List.of(
                        Map.of("name", "codigo", "position", 1),
                        Map.of("name", "nombre", "position", 2)
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals(0, result.skippedCount());
        assertEquals("101", result.records().get(0).values().get("codigo"));
        assertEquals("Marta", result.records().get(1).values().get("nombre"));
    }

    @Test
    void readsXlsxWorkbookByConfiguredFieldPositions() throws IOException {
        SourcePayload payload = SourcePayload.fromBytes(
                "cliente.xlsx",
                buildCustomerWorkbookBytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        ReadResult result = read(xlsxReaderProvider, payload, Map.of(
                "sheetIndex", 1,
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
        assertEquals("red", result.records().get(0).values().get("color"));
        assertEquals("4", result.records().get(3).values().get("dni"));
    }

    @Test
    void appliesExcelFieldRules() throws IOException {
        SourcePayload payload = SourcePayload.fromBytes(
                "cliente.xlsx",
                buildCustomerWorkbookBytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        ReadResult result = read(xlsxReaderProvider, payload, Map.of(
                "sheetIndex", 0,
                "rowData", 2,
                "fields", List.of(
                        Map.of("name", "dni", "position", 1, "type", "NUMBER", "required", true),
                        Map.of("name", "nombre", "position", 2, "script", "if (value == null || value == '') { valid = false; } else { value = value.toUpperCase(); }"),
                        Map.of("name", "total", "position", 3, "type", "NUMBER")
                )
        ));

        assertEquals(4, result.recordCount());
        assertEquals(0, result.skippedCount());
        assertEquals(new BigDecimal("1"), result.records().get(0).values().get("dni"));
        assertEquals("XX1", result.records().get(0).values().get("nombre"));
        assertEquals(new BigDecimal("14"), result.records().get(3).values().get("total"));
    }

    @Test
    void treatsExcelRowDataAsOneBasedRowNumber() throws IOException {
        SourcePayload payload = SourcePayload.fromBytes(
                "clientes.xlsx",
                buildRowsWithoutHeaderWorkbookBytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        ReadResult result = read(xlsxReaderProvider, payload, Map.of(
                "sheetIndex", 0,
                "rowData", 1,
                "fields", List.of(
                        Map.of("name", "codigo", "position", 1),
                        Map.of("name", "nombre", "position", 2)
                )
        ));

        assertEquals(2, result.recordCount());
        assertEquals("001", result.records().get(0).values().get("codigo"));
    }

    @Test
    void capturesSheetAndPhysicalRowForXlsx() throws IOException {
        // item 2 (B): el reader Excel aporta posición física = hoja + fila 1-based (Excel no tiene "línea" global).
        var payload = SourcePayload.fromBytes("clientes.xlsx", buildXlsxBytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        ReadResult result = read(xlsxReaderProvider, payload, Map.of(
                "sheetIndex", 1, "rowData", 2, // hoja "Hoja 2", salta la cabecera (fila física 1)
                "fields", List.of(Map.of("name", "codigo", "position", 1))));

        assertEquals(2, result.recordCount());
        var pos = result.records().get(0).position();
        assertNotNull(pos, "el reader Excel aporta posición");
        assertEquals("Hoja 2", pos.sheetName(), "hoja seleccionada por sheetIndex");
        assertEquals(2L, pos.sheetRow(), "1er dato = fila física 2 (la 1 es cabecera)");
        assertNull(pos.physicalLine(), "Excel usa hoja+fila, no línea global");
        assertEquals("101", result.records().get(0).values().get("codigo"));
    }

    @Test
    void capturesSheetAndPhysicalRowForXls() throws IOException {
        var payload = SourcePayload.fromBytes("clientes.xls", buildXlsBytes(), "application/vnd.ms-excel");
        ReadResult result = read(xlsReaderProvider, payload, Map.of(
                "rowData", 2, "fields", List.of(Map.of("name", "codigo", "position", 1))));

        var pos = result.records().get(0).position();
        assertNotNull(pos);
        assertEquals("clientes", pos.sheetName());
        assertEquals(2L, pos.sheetRow(), "1er dato = fila física 2 (la 1 es cabecera)");
    }

    private ReadResult read(ReaderProvider provider, SourcePayload payload, Map<String, Object> configuration) {
        var records = new ArrayList<ReadRecord>();
        var result = provider.readInBatches(payload, configuration, 2, batch -> records.addAll(batch.records()));
        return new ReadResult(List.copyOf(records), result.recordCount(), result.skippedCount(), result.skippedRows());
    }

    private byte[] buildXlsBytes() throws IOException {
        try (HSSFWorkbook workbook = new HSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("clientes");
            writeRows(sheet, "001", "Ana", "002", "Luis");
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private byte[] buildXlsxBytes() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet1 = workbook.createSheet("Hoja 1");
            writeRows(sheet1, "001", "Ana", "002", "Luis");
            Sheet sheet2 = workbook.createSheet("Hoja 2");
            writeRows(sheet2, "101", "Carlos", "102", "Marta");
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private byte[] buildCustomerWorkbookBytes() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var sheet1 = workbook.createSheet("Hoja 1");
            writeCustomerRows(sheet1);
            var sheet2 = workbook.createSheet("Hoja 2");
            writeCustomerRows(sheet2);
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private byte[] buildRowsWithoutHeaderWorkbookBytes() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Hoja 1");
            var row1 = sheet.createRow(0);
            row1.createCell(0).setCellValue("001");
            row1.createCell(1).setCellValue("Ana");
            var row2 = sheet.createRow(1);
            row2.createCell(0).setCellValue("002");
            row2.createCell(1).setCellValue("Luis");
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private void writeRows(Sheet sheet, String code1, String name1, String code2, String name2) {
        var header = sheet.createRow(0);
        header.createCell(0).setCellValue("codigo");
        header.createCell(1).setCellValue("nombre");

        var row1 = sheet.createRow(1);
        row1.createCell(0).setCellValue(code1);
        row1.createCell(1).setCellValue(name1);

        var row2 = sheet.createRow(2);
        row2.createCell(0).setCellValue(code2);
        row2.createCell(1).setCellValue(name2);
    }

    private void writeCustomerRows(Sheet sheet) {
        var row0 = sheet.createRow(0);
        row0.createCell(0).setCellValue("dni");
        row0.createCell(1).setCellValue("nom");
        row0.createCell(2).setCellValue("total");
        row0.createCell(3).setCellValue("color");

        writeCustomerRow(sheet.createRow(1), "1", "xx1", "11", "red");
        writeCustomerRow(sheet.createRow(2), "2", "xx2", "12", "red");
        writeCustomerRow(sheet.createRow(3), "3", "xx3", "13", "red");
        writeCustomerRow(sheet.createRow(4), "4", "xx4", "14", "red");
    }

    private void writeCustomerRow(org.apache.poi.ss.usermodel.Row row, String dni, String nom, String total, String color) {
        row.createCell(0).setCellValue(dni);
        row.createCell(1).setCellValue(nom);
        row.createCell(2).setCellValue(total);
        row.createCell(3).setCellValue(color);
    }
}
