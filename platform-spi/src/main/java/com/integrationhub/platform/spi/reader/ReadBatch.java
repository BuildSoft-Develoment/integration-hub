package com.integrationhub.platform.spi.reader;

import java.util.List;

public record ReadBatch(String fileName, int batchNumber, List<ReadRecord> records) {
}
