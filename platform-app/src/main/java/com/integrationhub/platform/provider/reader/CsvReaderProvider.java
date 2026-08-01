package com.integrationhub.platform.provider.reader;

// @trace spec 002-catalogo-readers RF-001 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.reader.SourcePosition;
import com.integrationhub.platform.spi.config.PluginConfigField;
import com.integrationhub.platform.spi.config.PluginConfigOption;
import com.integrationhub.platform.spi.config.PluginConfigSchema;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@ApplicationScoped
public class CsvReaderProvider implements ReaderProvider {

    @Override
    public String type() {
        return "CSV";
    }

    @Override
    public boolean supportsStreamingPipeline() {
        return true;
    }

    /** Schema de config del reader CSV: ejemplo real de config dirigida por schema para readers. */
    @Override
    public PluginConfigSchema configSchema() {
        return PluginConfigSchema.of(
                PluginConfigField.text("delimiter", "readers.csv.delimiter", false),
                PluginConfigField.select("encoding", "readers.csv.encoding", false, List.of(
                        PluginConfigOption.of("UTF-8", "UTF-8"),
                        PluginConfigOption.of("ISO-8859-1", "ISO-8859-1"),
                        PluginConfigOption.of("US-ASCII", "US-ASCII"))));
    }

    /**
     * #5: valida al CREAR/ACTUALIZAR la definición que el CSV traiga campos posicionales, para fallar claro (400) en la
     * consola en vez de aceptar la config y reventar recién al leer el archivo. Reusa exactamente la misma comprobación
     * que {@link #readInBatches} (una sola fuente de verdad, sin duplicar la regla).
     */
    @Override
    public void validateConfiguration(Map<String, Object> configuration) {
        requireFields(configuration);
    }

    /** Campos posicionales configurados; obligatorios para el CSV (un CSV sin campos no sabe qué leer). */
    private List<ReaderFieldSupport.ConfiguredField> requireFields(Map<String, Object> configuration) {
        var configuredFields = ReaderFieldSupport.configuredFields(configuration.get("fields"), "CSV");
        if (configuredFields.isEmpty()) {
            throw new IllegalArgumentException("CSV requires field definitions");
        }
        return configuredFields;
    }

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        var rawDelimiter = String.valueOf(configuration.getOrDefault("delimiter", ","));
        var delimiter = "\\t".equals(rawDelimiter) ? "\t" : rawDelimiter;
        var encoding = String.valueOf(configuration.getOrDefault("encoding", "UTF-8"));
        var dataStartRowIndex = ReaderRowSupport.dataStartRowIndex(configuration, 1);
        var configuredFields = requireFields(configuration);

        var records = new ArrayList<ReadRecord>();
        var skippedRows = new ArrayList<ReadSkip>();
        var totalRecords = 0;
        var rowIndex = 0;
        var batchNumber = 1;
        var effectiveBatchSize = Math.max(batchSize, 1);

        try (var reader = new BufferedReader(new InputStreamReader(payload.openStream(), Charset.forName(encoding)))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank() || rowIndex < dataStartRowIndex) {
                    rowIndex++;
                    continue;
                }
                var values = line.split(Pattern.quote(delimiter), -1);
                var rowResult = ReaderFieldSupport.processPositionalRow(configuredFields, field -> {
                    var position = field.position();
                    if (position == null || position <= 0) {
                        return "";
                    }
                    var index = position - 1;
                    return index < values.length ? values[index].trim() : "";
                });
                if (!rowResult.skipped()) {
                    // item 2: rowIndex es 0-based por LÍNEA física (cuenta cabeceras/blancos) -> línea física 1-based.
                    records.add(new ReadRecord(rowResult.values(), SourcePosition.line(rowIndex + 1L)));
                    totalRecords++;
                    if (records.size() >= effectiveBatchSize) {
                        flushBatch(payload, records, batchNumber++, consumer);
                    }
                } else {
                    skippedRows.add(new ReadSkip(rowIndex + 1, rowResult.reason() == null ? "Row skipped by validation" : rowResult.reason()));
                }
                rowIndex++;
            }
            flushBatch(payload, records, batchNumber, consumer);
            return new ReadResult(List.of(), totalRecords, skippedRows.size(), List.copyOf(skippedRows));
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read CSV payload " + payload.name(), e);
        }
    }

    private void flushBatch(SourcePayload payload,
                            List<ReadRecord> records,
                            int batchNumber,
                            ReadBatchConsumer consumer) {
        if (consumer == null || records.isEmpty()) {
            return;
        }
        consumer.accept(new ReadBatch(payload.name(), batchNumber, List.copyOf(records)));
        records.clear();
    }
}


