package com.integrationhub.platform.spi.reader;

@FunctionalInterface
public interface ReadBatchConsumer {

    void accept(ReadBatch batch);
}
