package com.integrationhub.platform.spi;

import java.util.List;

public record ReadResult(List<ReadRecord> records, int recordCount, int skippedCount, List<ReadSkip> skippedRows) {

    public ReadResult(List<ReadRecord> records, int recordCount) {
        this(records, recordCount, 0, List.of());
    }

    public static ReadResult withSkips(List<ReadRecord> records, List<ReadSkip> skippedRows) {
        var normalizedSkips = skippedRows == null ? List.<ReadSkip>of() : List.copyOf(skippedRows);
        return new ReadResult(records, records.size(), normalizedSkips.size(), normalizedSkips);
    }
}
