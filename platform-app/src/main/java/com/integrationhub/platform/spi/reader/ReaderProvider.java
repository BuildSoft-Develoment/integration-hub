package com.integrationhub.platform.spi.reader;

import com.integrationhub.platform.spi.source.SourcePayload;

import java.util.Map;

public interface ReaderProvider {

    String type();

    ReadResult readInBatches(SourcePayload payload,
                             Map<String, Object> configuration,
                             int batchSize,
                             ReadBatchConsumer consumer);
}
