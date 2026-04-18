package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
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
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        var rawDelimiter = String.valueOf(configuration.getOrDefault("delimiter", ","));
        var delimiter = "\\t".equals(rawDelimiter) ? "\t" : rawDelimiter;
        var encoding = String.valueOf(configuration.getOrDefault("encoding", "UTF-8"));
        var dataStartRowIndex = ReaderRowSupport.dataStartRowIndex(configuration, 1);
        var configuredFields = ReaderFieldSupport.configuredFields(configuration.get("fields"), "CSV");
        if (configuredFields.isEmpty()) {
            throw new IllegalArgumentException("CSV requires field definitions");
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
                    records.add(new ReadRecord(rowResult.values()));
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


