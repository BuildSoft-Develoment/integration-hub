package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;

import java.util.ArrayList;
import java.util.Map;

final class ExcelReaderSupport {

    private static final DataFormatter DATA_FORMATTER = new DataFormatter();

    private ExcelReaderSupport() {
    }

    static ReadResult readWorkbook(Workbook workbook, Map<String, Object> configuration) {
        var sheet = resolveSheet(workbook, configuration);
        var trimValues = Boolean.parseBoolean(String.valueOf(configuration.getOrDefault("trimValues", true)));
        var configuredFields = ReaderFieldSupport.configuredFields(configuration.get("fields"), "Excel");
        if (configuredFields.isEmpty()) {
            throw new IllegalArgumentException("Excel reader requires fields with positions");
        }
        return readWithConfiguredFields(sheet, configuration, trimValues, configuredFields);
    }

    private static Sheet resolveSheet(Workbook workbook, Map<String, Object> configuration) {
        var sheetIndex = optionalInt(configuration, "sheetIndex", 0);
        if (sheetIndex < 0 || sheetIndex >= workbook.getNumberOfSheets()) {
            throw new IllegalArgumentException("Invalid sheetIndex: " + sheetIndex);
        }
        return workbook.getSheetAt(sheetIndex);
    }

    private static ReadResult readWithConfiguredFields(
            Sheet sheet,
            Map<String, Object> configuration,
            boolean trimValues,
            java.util.List<ReaderFieldSupport.ConfiguredField> configuredFields
    ) {
        var dataStartRowIndex = optionalInt(configuration, "rowData", 1);
        var records = new ArrayList<ReadRecord>();
        var skippedRows = new ArrayList<ReadSkip>();
        for (var rowIndex = dataStartRowIndex; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            var row = sheet.getRow(rowIndex);
            if (row == null || isRowEmpty(row)) {
                continue;
            }

            var rowResult = ReaderFieldSupport.processPositionalRow(configuredFields, field -> {
                var position = field.position();
                if (position == null || position <= 0) {
                    return "";
                }
                var cell = row.getCell(position - 1, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                var value = cell == null ? "" : DATA_FORMATTER.formatCellValue(cell);
                return trimValues ? value.trim() : value;
            });
            if (!rowResult.skipped()) {
                records.add(new ReadRecord(rowResult.values()));
            } else {
                skippedRows.add(new ReadSkip(rowIndex + 1, rowResult.reason() == null ? "Row skipped by validation" : rowResult.reason()));
            }
        }
        return ReadResult.withSkips(records, skippedRows);
    }

    private static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        var value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private static boolean isRowEmpty(Row row) {
        for (var cellIndex = row.getFirstCellNum(); cellIndex < row.getLastCellNum(); cellIndex++) {
            if (cellIndex < 0) {
                continue;
            }
            Cell cell = row.getCell(cellIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell != null && cell.getCellType() != CellType.BLANK && !DATA_FORMATTER.formatCellValue(cell).isBlank()) {
                return false;
            }
        }
        return true;
    }
}
