package com.integrationhub.platform.provider.reader;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.ReadBatch;
import com.integrationhub.platform.spi.ReadBatchConsumer;
import com.integrationhub.platform.spi.ReadRecord;
import com.integrationhub.platform.spi.ReadResult;
import com.integrationhub.platform.spi.ReaderProvider;
import com.integrationhub.platform.spi.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class JsonReaderProvider implements ReaderProvider {

    @Inject
    ObjectMapper objectMapper;

    @Override
    public String type() {
        return "JSON";
    }

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        try (var inputStream = payload.openStream()) {
            var rows = objectMapper.readValue(inputStream, new TypeReference<List<Map<String, Object>>>() {
            });
            var records = rows.stream().map(ReadRecord::new).toList();
            emitBatches(payload.name(), records, batchSize, consumer);
            return new ReadResult(List.of(), records.size(), 0, List.of());
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid JSON payload", e);
        }
    }

    private void emitBatches(String fileName,
                             List<ReadRecord> records,
                             int batchSize,
                             ReadBatchConsumer consumer) {
        if (consumer == null || records.isEmpty()) {
            return;
        }
        var effectiveBatchSize = Math.max(batchSize, 1);
        var batchNumber = 1;
        for (var index = 0; index < records.size(); index += effectiveBatchSize) {
            var until = Math.min(records.size(), index + effectiveBatchSize);
            consumer.accept(new ReadBatch(fileName, batchNumber++, List.copyOf(new ArrayList<>(records.subList(index, until)))));
        }
    }
}
