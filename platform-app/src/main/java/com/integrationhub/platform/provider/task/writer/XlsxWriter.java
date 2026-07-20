package com.integrationhub.platform.provider.task.writer;

// @trace ADR-016 (salida generica: escritor XLSX sobre POI SXSSF - streaming + celdas TIPADAS)

import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigOption;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.writer.FileFormatWriter;
import com.integrationhub.platform.spi.task.writer.FileWriteSession;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ADR-016: escritor XLSX sobre <b>Apache POI SXSSF</b> ({@code streaming}) — mantiene solo una ventana de filas en
 * memoria y vuelca el resto a disco, asi escala a cientos de miles de filas sin OOM (a diferencia de {@code XSSF}, que
 * arma el workbook entero en heap). A diferencia de CSV/TXT (que emiten TEXTO), XLSX escribe celdas <b>tipadas</b>:
 * una columna {@code NUMBER} va como celda numerica (con el patron como formato de celda de Excel) y {@code DATE} como
 * celda de fecha, de modo que Excel las trata como numero/fecha reales (ordenables, sumables), no como texto.
 *
 * <p>Casuisticas configurables (sub-bloque {@code xlsx}): nombre de hoja, cabecera en negrita, congelar la cabecera,
 * autofiltro y auto-ancho de columnas. Cabecera/trailer se escriben como texto (las celdas ya vienen resueltas por la
 * tarea). Excel topa en {@value #EXCEL_MAX_ROWS} filas por hoja: si se excede, se falla ruidoso (usar CSV/TXT para >1M).</p>
 */
@ApplicationScoped
public class XlsxWriter implements FileFormatWriter {

    /** Ventana de filas en RAM antes de volcar a disco (SXSSF). Chico = menos heap. */
    private static final int STREAM_WINDOW = 100;
    /** Limite de filas por hoja del formato XLSX (Excel). */
    private static final int EXCEL_MAX_ROWS = 1_048_576;

    @Override
    public String format() {
        return "XLSX";
    }

    @Override
    public PluginConfigSchema configSchema() {
        return PluginConfigSchema.of(
                PluginConfigField.text("xlsx.sheetName", "writers.xlsx.sheetName", false),
                PluginConfigField.select("xlsx.headerStyle", "writers.xlsx.headerStyle", false, List.of(
                        PluginConfigOption.of("BOLD", "BOLD"),
                        PluginConfigOption.of("PLAIN", "PLAIN"))),
                PluginConfigField.select("xlsx.freezeHeader", "writers.xlsx.freezeHeader", false, List.of(
                        PluginConfigOption.of("true", "true"),
                        PluginConfigOption.of("false", "false"))),
                PluginConfigField.select("xlsx.autoFilter", "writers.xlsx.autoFilter", false, List.of(
                        PluginConfigOption.of("true", "true"),
                        PluginConfigOption.of("false", "false"))),
                PluginConfigField.select("xlsx.autoSizeColumns", "writers.xlsx.autoSizeColumns", false, List.of(
                        PluginConfigOption.of("true", "true"),
                        PluginConfigOption.of("false", "false"))));
    }

    @Override
    public void validateConfiguration(Map<String, Object> configuration) {
        if (detailColumns(configuration).isEmpty()) {
            throw new IllegalArgumentException("XLSX writer requires layout.detail.columns");
        }
    }

    @Override
    public FileWriteSession open(OutputStream out, Map<String, Object> configuration) throws IOException {
        var xlsx = mapValue(configuration.get("xlsx"));
        return new XlsxWriteSession(
                out,
                detailColumns(configuration),
                stringValue(xlsx.get("sheetName"), "Sheet1"),
                !"PLAIN".equalsIgnoreCase(stringValue(xlsx.get("headerStyle"), "BOLD")),
                boolValue(xlsx.get("freezeHeader"), true),
                boolValue(xlsx.get("autoFilter"), false),
                boolValue(xlsx.get("autoSizeColumns"), false));
    }

    // --- parsing de config (layout.detail.columns) ---

    @SuppressWarnings("unchecked")
    private static Map<String, Object> detail(Map<String, Object> configuration) {
        var layout = configuration.get("layout");
        if (!(layout instanceof Map<?, ?> layoutMap)) {
            return Map.of();
        }
        var detail = layoutMap.get("detail");
        return detail instanceof Map<?, ?> detailMap ? (Map<String, Object>) detailMap : Map.of();
    }

    private static List<DetailColumn> detailColumns(Map<String, Object> configuration) {
        var columns = detail(configuration).get("columns");
        if (!(columns instanceof List<?> list)) {
            return List.of();
        }
        var result = new ArrayList<DetailColumn>(list.size());
        for (var raw : list) {
            if (raw instanceof Map<?, ?> column) {
                var field = column.get("field");
                if (field != null && !String.valueOf(field).isBlank()) {
                    result.add(new DetailColumn(String.valueOf(field),
                            column.get("type") == null ? null : String.valueOf(column.get("type")),
                            column.get("format") == null ? null : String.valueOf(column.get("format"))));
                }
            } else if (raw != null && !String.valueOf(raw).isBlank()) {
                result.add(new DetailColumn(String.valueOf(raw), null, null));
            }
        }
        return List.copyOf(result);
    }

    private record DetailColumn(String field, String type, String format) {
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object raw) {
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, Object>();
        rawMap.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }

    private static String stringValue(Object raw, String fallback) {
        if (raw == null) {
            return fallback;
        }
        var value = String.valueOf(raw).trim();
        return value.isEmpty() ? fallback : value;
    }

    private static boolean boolValue(Object raw, boolean fallback) {
        return raw == null || String.valueOf(raw).isBlank() ? fallback : Boolean.parseBoolean(String.valueOf(raw));
    }

    /** Sesion streaming de XLSX (SXSSF). Una sola hoja; falla ruidoso al pasar el limite de Excel. */
    private static final class XlsxWriteSession implements FileWriteSession {

        private final OutputStream out;
        private final List<DetailColumn> columns;
        private final SXSSFWorkbook workbook;
        private final SXSSFSheet sheet;
        private final DataFormat dataFormat;
        private final CellStyle headerStyle;
        // Cache de estilos por (patron NUMBER / patron DATE) — POI limita la cantidad de CellStyle por workbook.
        private final Map<String, CellStyle> numberStyles = new HashMap<>();
        private final Map<String, CellStyle> dateStyles = new HashMap<>();
        private final boolean freezeHeader;
        private final boolean autoFilter;
        private final boolean autoSize;

        private int rowIndex = 0;
        private int maxColumns = 0;
        private boolean headerWritten = false;

        private XlsxWriteSession(OutputStream out, List<DetailColumn> columns, String sheetName, boolean headerBold,
                                 boolean freezeHeader, boolean autoFilter, boolean autoSize) {
            this.out = out;
            this.columns = columns;
            this.freezeHeader = freezeHeader;
            this.autoFilter = autoFilter;
            this.autoSize = autoSize;
            this.workbook = new SXSSFWorkbook(STREAM_WINDOW);
            this.sheet = this.workbook.createSheet(sheetName == null || sheetName.isBlank() ? "Sheet1" : sheetName);
            if (autoSize) {
                this.sheet.trackAllColumnsForAutoSizing();
            }
            this.dataFormat = this.workbook.createDataFormat();
            if (headerBold) {
                var style = this.workbook.createCellStyle();
                var font = this.workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                this.headerStyle = style;
            } else {
                this.headerStyle = null;
            }
        }

        @Override
        public void writeHeader(List<Object> headerCells) {
            var row = newRow();
            for (int i = 0; i < headerCells.size(); i++) {
                var cell = row.createCell(i);
                cell.setCellValue(headerCells.get(i) == null ? "" : String.valueOf(headerCells.get(i)));
                if (headerStyle != null) {
                    cell.setCellStyle(headerStyle);
                }
            }
            trackColumns(headerCells.size());
            headerWritten = true;
            if (freezeHeader) {
                sheet.createFreezePane(0, 1);
            }
        }

        @Override
        public void writeDetail(List<ReadRecord> batch) {
            for (var record : batch) {
                var values = record.values();
                var row = newRow();
                for (int i = 0; i < columns.size(); i++) {
                    writeTypedCell(row.createCell(i), values.get(columns.get(i).field()), columns.get(i));
                }
                trackColumns(columns.size());
            }
        }

        @Override
        public void writeTrailer(List<Object> trailerCells) {
            var row = newRow();
            for (int i = 0; i < trailerCells.size(); i++) {
                row.createCell(i).setCellValue(trailerCells.get(i) == null ? "" : String.valueOf(trailerCells.get(i)));
            }
            trackColumns(trailerCells.size());
        }

        @Override
        public void close() throws IOException {
            // Finalizacion (se conocen ya el total de filas/columnas): autofiltro sobre la cabecera + auto-ancho.
            if (autoFilter && headerWritten && maxColumns > 0 && rowIndex > 1) {
                sheet.setAutoFilter(new CellRangeAddress(0, rowIndex - 1, 0, maxColumns - 1));
            }
            if (autoSize) {
                for (int c = 0; c < maxColumns; c++) {
                    sheet.autoSizeColumn(c);
                }
            }
            try {
                workbook.write(out); // NO cierra out (su dueno es el WritableArtifact)
            } finally {
                workbook.dispose(); // borra los temporales del streaming
                workbook.close();
            }
        }

        private Row newRow() {
            if (rowIndex >= EXCEL_MAX_ROWS) {
                throw new IllegalStateException("XLSX exceeds Excel's per-sheet row limit (" + EXCEL_MAX_ROWS
                        + "); use CSV or TXT for datasets above ~1M rows");
            }
            return sheet.createRow(rowIndex++);
        }

        private void trackColumns(int count) {
            if (count > maxColumns) {
                maxColumns = count;
            }
        }

        /** Escribe una celda con el tipo nativo de Excel segun el {@code type} de la columna. */
        private void writeTypedCell(Cell cell, Object value, DetailColumn column) {
            var type = column.type() == null ? "STRING" : column.type().toUpperCase(java.util.Locale.ROOT);
            if ("NUMBER".equals(type)) {
                var number = toBigDecimal(value);
                if (number != null) {
                    cell.setCellValue(number.doubleValue());
                    var style = numberStyle(column.format());
                    if (style != null) {
                        cell.setCellStyle(style);
                    }
                    return;
                }
            } else if ("DATE".equals(type)) {
                var date = toLocalDate(value, column.format());
                if (date != null) {
                    cell.setCellValue(date);
                    cell.setCellStyle(dateStyle(column.format()));
                    return;
                }
            }
            cell.setCellValue(value == null ? "" : String.valueOf(value));
        }

        private CellStyle numberStyle(String pattern) {
            if (pattern == null || pattern.isBlank()) {
                return null;
            }
            return numberStyles.computeIfAbsent(pattern, p -> {
                var style = workbook.createCellStyle();
                style.setDataFormat(dataFormat.getFormat(p));
                return style;
            });
        }

        private CellStyle dateStyle(String pattern) {
            // El patron es de DateTimeFormatter (Java); Excel usa 'm'=mes/minuto y 'h'=hora en minusculas.
            var excelPattern = (pattern == null || pattern.isBlank() ? "yyyy-mm-dd" : pattern.replace('M', 'm').replace('H', 'h'));
            return dateStyles.computeIfAbsent(excelPattern, p -> {
                var style = workbook.createCellStyle();
                style.setDataFormat(dataFormat.getFormat(p));
                return style;
            });
        }

        private static BigDecimal toBigDecimal(Object value) {
            if (value instanceof Number number) {
                return new BigDecimal(number.toString());
            }
            if (value == null) {
                return null;
            }
            try {
                return new BigDecimal(String.valueOf(value).trim());
            } catch (NumberFormatException notNumeric) {
                return null;
            }
        }

        private static LocalDate toLocalDate(Object value, String pattern) {
            if (value instanceof LocalDate localDate) {
                return localDate;
            }
            if (value instanceof LocalDateTime localDateTime) {
                return localDateTime.toLocalDate();
            }
            if (value instanceof java.sql.Date sqlDate) {
                return sqlDate.toLocalDate();
            }
            if (value instanceof java.util.Date date) {
                return new java.sql.Date(date.getTime()).toLocalDate();
            }
            if (value == null) {
                return null;
            }
            var text = String.valueOf(value).trim();
            if (text.isEmpty()) {
                return null;
            }
            if (pattern != null && !pattern.isBlank()) {
                try {
                    return LocalDate.parse(text, DateTimeFormatter.ofPattern(pattern));
                } catch (RuntimeException ignored) {
                    // cae al parseo ISO
                }
            }
            try {
                return LocalDate.parse(text);
            } catch (RuntimeException notADate) {
                return null;
            }
        }
    }
}
