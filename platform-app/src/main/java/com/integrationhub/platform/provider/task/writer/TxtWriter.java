package com.integrationhub.platform.provider.task.writer;

// @trace ADR-016 (salida generica: escritor TXT ancho-fijo, espejo del TxtReaderProvider)

import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigOption;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.writer.FileFormatWriter;
import com.integrationhub.platform.spi.task.writer.FileWriteSession;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.BufferedWriter;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ADR-016: escritor TXT de <b>ancho fijo</b> (espejo del reader fixed-length). Cada celda ocupa un ancho fijo
 * ({@code length}) con relleno ({@code pad}, por defecto espacio) y alineacion ({@code align}: {@code left}/{@code right}).
 * Header/detalle/trailer se emiten como registros de ancho fijo. Fail-loud si un valor excede su ancho (dato invalido
 * para un archivo de ancho fijo). Streaming, sin materializar el archivo en memoria.
 */
@ApplicationScoped
public class TxtWriter implements FileFormatWriter {

    @Override
    public String format() {
        return "TXT";
    }

    @Override
    public PluginConfigSchema configSchema() {
        return PluginConfigSchema.of(
                PluginConfigField.select("encoding", "writers.txt.encoding", false, List.of(
                        PluginConfigOption.of("UTF-8", "UTF-8"),
                        PluginConfigOption.of("ISO-8859-1", "ISO-8859-1"),
                        PluginConfigOption.of("Windows-1252", "Windows-1252"),
                        PluginConfigOption.of("US-ASCII", "US-ASCII"))),
                PluginConfigField.select("lineEnding", "writers.txt.lineEnding", false, List.of(
                        PluginConfigOption.of("LF", "LF"),
                        PluginConfigOption.of("CRLF", "CRLF"))));
    }

    @Override
    public void validateConfiguration(Map<String, Object> configuration) {
        var columns = detailColumns(configuration);
        if (columns.isEmpty()) {
            throw new IllegalArgumentException("TXT writer requires layout.detail.columns");
        }
        // spec() valida length > 0 por columna (fail-fast al crear/actualizar).
        columns.forEach(DetailColumn::spec);
    }

    @Override
    public FileWriteSession open(OutputStream out, Map<String, Object> configuration) throws IOException {
        var encoding = String.valueOf(configuration.getOrDefault("encoding", "UTF-8"));
        var lineEnding = "CRLF".equalsIgnoreCase(detailOrLayoutString(configuration, "lineEnding", "LF")) ? "\r\n" : "\n";
        var detail = detailColumns(configuration);
        var headerSpecs = specsOf(layoutList(configuration, "header"));
        var trailerSpecs = specsOf(layoutList(configuration, "trailer"));
        var writer = new BufferedWriter(new OutputStreamWriter(nonClosing(out), Charset.forName(encoding)));
        return new TxtWriteSession(writer, lineEnding, detail, headerSpecs, trailerSpecs);
    }

    /** Filtro que hace flush pero NO cierra el delegate (el {@code WritableArtifact} es el dueno del stream). */
    private static OutputStream nonClosing(OutputStream delegate) {
        return new FilterOutputStream(delegate) {
            @Override
            public void write(byte[] bytes, int off, int len) throws IOException {
                out.write(bytes, off, len);
            }

            @Override
            public void close() throws IOException {
                flush();
            }
        };
    }

    // --- parsing de layout ---

    @SuppressWarnings("unchecked")
    private static Map<String, Object> detail(Map<String, Object> configuration) {
        var layout = configuration.get("layout");
        if (!(layout instanceof Map<?, ?> layoutMap)) {
            return Map.of();
        }
        var detail = layoutMap.get("detail");
        return detail instanceof Map<?, ?> detailMap ? (Map<String, Object>) detailMap : Map.of();
    }

    private static String detailOrLayoutString(Map<String, Object> configuration, String key, String fallback) {
        var value = detail(configuration).get(key);
        if (value != null) {
            return String.valueOf(value);
        }
        var top = configuration.get(key);
        return top == null ? fallback : String.valueOf(top);
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> layoutList(Map<String, Object> configuration, String section) {
        var layout = configuration.get("layout");
        if (!(layout instanceof Map<?, ?> layoutMap)) {
            return List.of();
        }
        var raw = layoutMap.get(section);
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        var cells = new ArrayList<Map<String, Object>>(list.size());
        for (var item : list) {
            if (item instanceof Map<?, ?> map) {
                cells.add((Map<String, Object>) map);
            }
        }
        return cells;
    }

    @SuppressWarnings("unchecked")
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
                    result.add(new DetailColumn(String.valueOf(field), (Map<String, Object>) column));
                }
            }
        }
        return result;
    }

    private static List<ColumnSpec> specsOf(List<Map<String, Object>> cells) {
        var specs = new ArrayList<ColumnSpec>(cells.size());
        for (var cell : cells) {
            specs.add(ColumnSpec.of(cell));
        }
        return specs;
    }

    /** Formatea un valor a ancho fijo (pad/align), fail-loud si excede el ancho. */
    private static String fixed(Object value, ColumnSpec spec) {
        var text = value == null ? "" : String.valueOf(value);
        if (text.length() > spec.length()) {
            throw new IllegalArgumentException("TXT fixed-length: value '" + text + "' (" + text.length()
                    + " chars) exceeds column width " + spec.length());
        }
        var padding = String.valueOf(spec.pad()).repeat(spec.length() - text.length());
        return spec.rightAlign() ? padding + text : text + padding;
    }

    private static int intValue(Object raw, int defaultValue) {
        if (raw == null || String.valueOf(raw).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(raw).trim());
    }

    private record ColumnSpec(int length, boolean rightAlign, char pad) {
        static ColumnSpec of(Map<String, Object> cell) {
            var length = intValue(cell.get("length"), 0);
            if (length <= 0) {
                throw new IllegalArgumentException("TXT fixed-length requires a positive 'length' per cell");
            }
            var rightAlign = "right".equalsIgnoreCase(String.valueOf(cell.getOrDefault("align", "left")));
            var padRaw = String.valueOf(cell.getOrDefault("pad", " "));
            var pad = padRaw.isEmpty() ? ' ' : padRaw.charAt(0);
            return new ColumnSpec(length, rightAlign, pad);
        }
    }

    private record DetailColumn(String field, Map<String, Object> cell) {
        ColumnSpec spec() {
            return ColumnSpec.of(cell);
        }
    }

    /** Sesion streaming de ancho fijo. */
    private static final class TxtWriteSession implements FileWriteSession {

        private final Writer writer;
        private final String lineEnding;
        private final List<DetailColumn> detail;
        private final List<ColumnSpec> headerSpecs;
        private final List<ColumnSpec> trailerSpecs;

        private TxtWriteSession(Writer writer, String lineEnding, List<DetailColumn> detail,
                               List<ColumnSpec> headerSpecs, List<ColumnSpec> trailerSpecs) {
            this.writer = writer;
            this.lineEnding = lineEnding;
            this.detail = detail;
            this.headerSpecs = headerSpecs;
            this.trailerSpecs = trailerSpecs;
        }

        @Override
        public void writeHeader(List<Object> headerCells) throws IOException {
            writeFixedRow(headerCells, headerSpecs);
        }

        @Override
        public void writeDetail(List<ReadRecord> batch) throws IOException {
            for (var record : batch) {
                var values = record.values();
                var line = new StringBuilder();
                for (var column : detail) {
                    line.append(fixed(values.get(column.field()), column.spec()));
                }
                writer.write(line.toString());
                writer.write(lineEnding);
            }
        }

        @Override
        public void writeTrailer(List<Object> trailerCells) throws IOException {
            writeFixedRow(trailerCells, trailerSpecs);
        }

        @Override
        public void close() throws IOException {
            writer.flush();
            writer.close();
        }

        private void writeFixedRow(List<Object> cells, List<ColumnSpec> specs) throws IOException {
            var line = new StringBuilder();
            for (var i = 0; i < specs.size(); i++) {
                var value = i < cells.size() ? cells.get(i) : "";
                line.append(fixed(value, specs.get(i)));
            }
            writer.write(line.toString());
            writer.write(lineEnding);
        }
    }
}
