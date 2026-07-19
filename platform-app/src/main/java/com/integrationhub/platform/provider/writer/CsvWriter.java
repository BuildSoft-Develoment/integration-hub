package com.integrationhub.platform.provider.writer;

// @trace ADR-016 (salida generica: escritor de formato CSV, espejo del CsvReaderProvider)

import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigOption;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.writer.FileFormatWriter;
import com.integrationhub.platform.spi.writer.FileWriteSession;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ADR-016: escritor CSV streaming (espejo de {@code CsvReaderProvider}). Serializa cada fila (cabecera/detalle/trailer)
 * con comillado RFC-4180, linea a linea, sin materializar el archivo en memoria. El detalle mapea columnas
 * configuradas (`layout.detail.columns[].field`) sobre los valores de cada {@link ReadRecord}.
 */
@ApplicationScoped
public class CsvWriter implements FileFormatWriter {

    @Override
    public String format() {
        return "CSV";
    }

    @Override
    public PluginConfigSchema configSchema() {
        return PluginConfigSchema.of(
                PluginConfigField.text("layout.detail.delimiter", "writers.csv.delimiter", false),
                PluginConfigField.select("encoding", "writers.csv.encoding", false, List.of(
                        PluginConfigOption.of("UTF-8", "UTF-8"),
                        PluginConfigOption.of("ISO-8859-1", "ISO-8859-1"),
                        PluginConfigOption.of("Windows-1252", "Windows-1252"),
                        PluginConfigOption.of("US-ASCII", "US-ASCII"))));
    }

    @Override
    public void validateConfiguration(Map<String, Object> configuration) {
        if (detailColumns(configuration).isEmpty()) {
            throw new IllegalArgumentException("CSV writer requires layout.detail.columns");
        }
    }

    @Override
    public FileWriteSession open(OutputStream out, Map<String, Object> configuration) throws IOException {
        var encoding = String.valueOf(configuration.getOrDefault("encoding", "UTF-8"));
        var rawDelimiter = detailString(configuration, "delimiter", ",");
        var delimiter = "\\t".equals(rawDelimiter) ? "\t" : rawDelimiter;
        var columns = detailColumns(configuration);
        var writer = new BufferedWriter(new OutputStreamWriter(out, Charset.forName(encoding)));
        return new CsvWriteSession(writer, delimiter, columns);
    }

    // --- parsing de config (layout.detail.*) ---

    @SuppressWarnings("unchecked")
    private static Map<String, Object> detail(Map<String, Object> configuration) {
        var layout = configuration.get("layout");
        if (!(layout instanceof Map<?, ?> layoutMap)) {
            return Map.of();
        }
        var detail = layoutMap.get("detail");
        return detail instanceof Map<?, ?> detailMap ? (Map<String, Object>) detailMap : Map.of();
    }

    private static String detailString(Map<String, Object> configuration, String key, String fallback) {
        var value = detail(configuration).get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private static List<String> detailColumns(Map<String, Object> configuration) {
        var columns = detail(configuration).get("columns");
        if (!(columns instanceof List<?> list)) {
            return List.of();
        }
        var fields = new ArrayList<String>(list.size());
        for (var raw : list) {
            if (raw instanceof Map<?, ?> column) {
                var field = column.get("field");
                if (field != null && !String.valueOf(field).isBlank()) {
                    fields.add(String.valueOf(field));
                }
            } else if (raw != null && !String.valueOf(raw).isBlank()) {
                fields.add(String.valueOf(raw));
            }
        }
        return List.copyOf(fields);
    }

    /** Sesion streaming: un {@link Writer} sobre el OutputStream + el delimitador + las columnas del detalle. */
    private static final class CsvWriteSession implements FileWriteSession {

        private final Writer writer;
        private final String delimiter;
        private final List<String> columns;

        private CsvWriteSession(Writer writer, String delimiter, List<String> columns) {
            this.writer = writer;
            this.delimiter = delimiter;
            this.columns = columns;
        }

        @Override
        public void writeHeader(List<Object> headerCells) throws IOException {
            writeRow(headerCells);
        }

        @Override
        public void writeDetail(List<ReadRecord> batch) throws IOException {
            for (var record : batch) {
                var values = record.values();
                var row = new ArrayList<Object>(columns.size());
                for (var column : columns) {
                    row.add(values.get(column));
                }
                writeRow(row);
            }
        }

        @Override
        public void writeTrailer(List<Object> trailerCells) throws IOException {
            writeRow(trailerCells);
        }

        @Override
        public void close() throws IOException {
            writer.flush();
            writer.close();
        }

        private void writeRow(List<Object> cells) throws IOException {
            for (var i = 0; i < cells.size(); i++) {
                if (i > 0) {
                    writer.write(delimiter);
                }
                writer.write(escape(cells.get(i)));
            }
            writer.write('\n');
        }

        /** Comillado RFC-4180: entrecomilla si el valor tiene el delimitador, comilla, CR o LF; duplica comillas. */
        private String escape(Object value) {
            var text = value == null ? "" : String.valueOf(value);
            var needsQuote = text.contains(delimiter) || text.contains("\"") || text.contains("\n") || text.contains("\r");
            if (!needsQuote) {
                return text;
            }
            return '"' + text.replace("\"", "\"\"") + '"';
        }
    }
}
