package com.integrationhub.platform.spi;

import java.util.List;

public record ReadBatch(String fileName, int batchNumber, List<ReadRecord> records) {
}
