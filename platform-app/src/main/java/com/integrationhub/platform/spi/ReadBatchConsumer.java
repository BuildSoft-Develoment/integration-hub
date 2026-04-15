package com.integrationhub.platform.spi;

@FunctionalInterface
public interface ReadBatchConsumer {

    void accept(ReadBatch batch);
}
