package com.integrationhub.platform.spi;

import java.util.Map;

public interface ReaderProvider {

    String type();

    ReadResult readInBatches(SourcePayload payload,
                             Map<String, Object> configuration,
                             int batchSize,
                             ReadBatchConsumer consumer);
}
