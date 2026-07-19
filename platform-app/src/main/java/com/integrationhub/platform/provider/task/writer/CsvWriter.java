package com.integrationhub.platform.provider.task.writer;

// @trace ADR-016 (salida generica: escritor CSV sobre FastCSV - RFC-4180 robusto + formateo por tipo)

import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigOption;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.writer.FileFormatWriter;
import com.integrationhub.platform.spi.task.writer.FileWriteSession;
import de.siegmar.fastcsv.writer.LineDelimiter;
import de.siegmar.fastcsv.writer.QuoteStrategies;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ADR-016: escritor CSV sobre <b>FastCSV</b> ({@code de.siegmar.fastcsv}) — RFC-4180 robusto (quoting, newlines
 * embebidos) con {@code quoteStrategy} configurable. El detalle mapea las columnas configuradas y aplica
 * {@link FieldValueFormatter} (type/format: NUMBER con patron decimal, DATE con patron) antes de escribir. Streaming.
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
        var separator = delimiter.isEmpty() ? ',' : delimiter.charAt(0);
        var lineDelimiter = "CRLF".equalsIgnoreCase(detailString(configuration, "lineEnding", "LF"))
                ? LineDelimiter.CRLF : LineDelimiter.LF;
        var quoteAll = "ALWAYS".equalsIgnoreCase(detailString(configuration, "quoteStrategy", "REQUIRED"));
        var columns = detailColumns(configuration);

        // nonClosing: el csv.close() cierra su Writer (encoder flush) pero NO el OutputStream del artefacto (su dueno).
        var writer = new OutputStreamWriter(nonClosing(out), Charset.forName(encoding));
        // El default de FastCSV es quoting "requerido" (RFC-4180); ALWAYS entrecomilla todo (opt-in).
        var builder = de.siegmar.fastcsv.writer.CsvWriter.builder()
                .fieldSeparator(separator)
                .lineDelimiter(lineDelimiter);
        if (quoteAll) {
            builder = builder.quoteStrategy(QuoteStrategies.ALWAYS);
        }
        return new CsvWriteSession(builder.build(writer), columns);
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

    private static List<DetailColumn> detailColumns(Map<String, Object> configuration) {
        var columns = detail(configuration).get("columns");
        if (!(columns instanceof List<?> list)) {
            return List.of();
        }
        var fields = new ArrayList<DetailColumn>(list.size());
        for (var raw : list) {
            if (raw instanceof Map<?, ?> column) {
                var field = column.get("field");
                if (field != null && !String.valueOf(field).isBlank()) {
                    fields.add(new DetailColumn(
                            String.valueOf(field),
                            column.get("type") == null ? null : String.valueOf(column.get("type")),
                            column.get("format") == null ? null : String.valueOf(column.get("format")),
                            column.get("rounding") == null ? null : String.valueOf(column.get("rounding"))));
                }
            } else if (raw != null && !String.valueOf(raw).isBlank()) {
                fields.add(new DetailColumn(String.valueOf(raw), null, null, null));
            }
        }
        return List.copyOf(fields);
    }

    /** Columna de detalle: campo + type/format/rounding opcionales para {@link FieldValueFormatter}. */
    private record DetailColumn(String field, String type, String format, String rounding) {
    }

    /** Sesion streaming sobre el CsvWriter de FastCSV. */
    private static final class CsvWriteSession implements FileWriteSession {

        private final de.siegmar.fastcsv.writer.CsvWriter csv;
        private final List<DetailColumn> columns;

        private CsvWriteSession(de.siegmar.fastcsv.writer.CsvWriter csv, List<DetailColumn> columns) {
            this.csv = csv;
            this.columns = columns;
        }

        @Override
        public void writeHeader(List<Object> headerCells) {
            csv.writeRecord(toStrings(headerCells));
        }

        @Override
        public void writeDetail(List<ReadRecord> batch) {
            for (var record : batch) {
                var values = record.values();
                var row = new ArrayList<String>(columns.size());
                for (var column : columns) {
                    row.add(FieldValueFormatter.format(values.get(column.field()), column.type(), column.format(), column.rounding()));
                }
                csv.writeRecord(row);
            }
        }

        @Override
        public void writeTrailer(List<Object> trailerCells) {
            csv.writeRecord(toStrings(trailerCells));
        }

        @Override
        public void close() throws IOException {
            csv.close();
        }

        private static List<String> toStrings(List<Object> cells) {
            var strings = new ArrayList<String>(cells.size());
            for (var cell : cells) {
                strings.add(cell == null ? "" : String.valueOf(cell));
            }
            return strings;
        }
    }
}
