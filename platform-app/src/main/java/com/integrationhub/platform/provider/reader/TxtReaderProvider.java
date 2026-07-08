package com.integrationhub.platform.provider.reader;

// @trace RF-003 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.reader.SourcePosition;
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
public class TxtReaderProvider implements ReaderProvider {

    @Override
    public String type() {
        return "TXT";
    }

    @Override
    public boolean supportsStreamingPipeline() {
        return true;
    }

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        var mode = String.valueOf(configuration.getOrDefault("mode", "delimited"));
        return switch (mode.toLowerCase()) {
            case "fixed-length" -> readFixedLength(payload, configuration, batchSize, consumer);
            case "delimited" -> readDelimited(payload, configuration, batchSize, consumer);
            default -> throw new IllegalArgumentException("Unsupported TXT mode: " + mode);
        };
    }

    private ReadResult readDelimited(SourcePayload payload,
                                     Map<String, Object> configuration,
                                     int batchSize,
                                     ReadBatchConsumer consumer) {
        var rawDelimiter = String.valueOf(configuration.getOrDefault("delimiter", ","));
        var delimiter = "\\t".equals(rawDelimiter) ? "\t" : rawDelimiter;
        var encoding = String.valueOf(configuration.getOrDefault("encoding", "UTF-8"));
        var dataStartRowIndex = ReaderRowSupport.dataStartRowIndex(configuration, 1);
        var configuredFields = ReaderFieldSupport.configuredFields(configuration.get("fields"), "TXT");
        if (configuredFields.isEmpty()) {
            throw new IllegalArgumentException("TXT delimited mode requires field definitions");
        }

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
                    // item 2: rowIndex 0-based por línea física (cuenta cabeceras/blancos) -> línea física 1-based.
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
            throw new IllegalStateException("Cannot read TXT payload " + payload.name(), e);
        }
    }

    private ReadResult readFixedLength(SourcePayload payload,
                                       Map<String, Object> configuration,
                                       int batchSize,
                                       ReadBatchConsumer consumer) {
        var encoding = String.valueOf(configuration.getOrDefault("encoding", "UTF-8"));
        var dataStartRowIndex = ReaderRowSupport.dataStartRowIndex(configuration, 1);
        var configuredFields = ReaderFieldSupport.configuredFields(configuration.get("fields"), "TXT");
        if (configuredFields.isEmpty()) {
            throw new IllegalArgumentException("TXT fixed-length mode requires field definitions");
        }

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
                var currentLine = line;
                var rowResult = ReaderFieldSupport.processPositionalRow(configuredFields, field -> {
                    var start = field.start();
                    var end = field.end();
                    if (start == null && end == null) {
                        return "";
                    }
                    if (start == null || end == null || end < start) {
                        throw new IllegalArgumentException("Invalid TXT fixed-length range for field " + field.name());
                    }
                    var fromIndex = Math.max(0, start - 1);
                    var toIndex = Math.min(currentLine.length(), end);
                    return fromIndex >= currentLine.length() ? "" : currentLine.substring(fromIndex, toIndex).trim();
                });
                if (!rowResult.skipped()) {
                    // item 2: rowIndex 0-based por línea física (cuenta cabeceras/blancos) -> línea física 1-based.
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
            throw new IllegalStateException("Cannot read TXT payload " + payload.name(), e);
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


