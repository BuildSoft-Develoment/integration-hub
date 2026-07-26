package com.integrationhub.platform.service.payments.swift;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-020 (C2): el parseo de la planilla de correccion (dueno del formato). Valida el header-driven, el split
 * identidad ({@code _}) vs editable, la coercion de {@code _stagingId}/{@code _version}, y el fail-loud de tamano.
 */
class Mt101CorrectionSheetServiceTest {

    private final Mt101CorrectionSheetService service =
            new Mt101CorrectionSheetService(null, null, null, null, null);

    @Test
    void parseSplitsIdentityFromEditableAndCoercesNumbers() throws Exception {
        var xlsx = sheet(
                new String[] {"_stagingId", "_version", "_sendersReference", "bic", "monto"},
                new String[] {"1001", "3", "P27-1", "BCPLPEPLXXX", "237.50"});

        var rows = service.parseSheet(new ByteArrayInputStream(xlsx));

        assertEquals(1, rows.size());
        var row = rows.get(0);
        assertEquals(1001L, row.longValue(Mt101CorrectionSheetService.COL_STAGING_ID));
        assertEquals(3L, row.longValue(Mt101CorrectionSheetService.COL_VERSION));
        assertEquals("P27-1", row.stringValue(Mt101CorrectionSheetService.COL_SENDERS_REFERENCE));
        // Solo bic/monto son editables; las _-prefijadas quedan afuera.
        assertEquals(java.util.Set.of("bic", "monto"), row.editableKeys());
        assertEquals("BCPLPEPLXXX", row.stringValue("bic"));
    }

    @Test
    void blankCellsBecomeNullAndUnknownColumnIsNull() throws Exception {
        var xlsx = sheet(
                new String[] {"_stagingId", "bic"},
                new String[] {"", ""});

        var row = service.parseSheet(new ByteArrayInputStream(xlsx)).get(0);

        assertNull(row.longValue(Mt101CorrectionSheetService.COL_STAGING_ID));
        assertNull(row.stringValue("bic"));
        assertNull(row.stringValue("noExiste"));
    }

    @Test
    void emptySheetIsRejected() throws Exception {
        var xlsx = new byte[0];
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.parseSheet(new ByteArrayInputStream(xlsx)));
        assertTrue(error.getMessage().toLowerCase().contains("empty"));
    }

    // Construye un XLSX en memoria (header + N filas de datos) con POI.
    private byte[] sheet(String[] header, String[]... dataRows) throws Exception {
        try (var workbook = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Correccion");
            var headerRow = sheet.createRow(0);
            for (var c = 0; c < header.length; c++) {
                headerRow.createCell(c).setCellValue(header[c]);
            }
            var r = 1;
            for (var data : dataRows) {
                var dataRow = sheet.createRow(r++);
                for (var c = 0; c < data.length; c++) {
                    dataRow.createCell(c).setCellValue(data[c]);
                }
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Test
    void editableKeysExcludeAllUnderscorePrefixedColumns() {
        var row = new Mt101CorrectionSheetService.SheetRow(java.util.Map.of(
                "_stagingId", "1", "_ruleCode", "BIC", "bic", "X", "monto", "1.00"));
        assertEquals(List.of("bic", "monto"), List.copyOf(new java.util.TreeSet<>(row.editableKeys())));
    }
}
