package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReadSkip;
import com.integrationhub.platform.spi.source.SourcePayload;
import org.apache.poi.hssf.eventusermodel.FormatTrackingHSSFListener;
import org.apache.poi.hssf.eventusermodel.HSSFEventFactory;
import org.apache.poi.hssf.eventusermodel.HSSFListener;
import org.apache.poi.hssf.eventusermodel.HSSFRequest;
import org.apache.poi.hssf.eventusermodel.MissingRecordAwareHSSFListener;
import org.apache.poi.hssf.eventusermodel.dummyrecord.LastCellOfRowDummyRecord;
import org.apache.poi.hssf.eventusermodel.dummyrecord.MissingCellDummyRecord;
import org.apache.poi.hssf.record.BOFRecord;
import org.apache.poi.hssf.record.BlankRecord;
import org.apache.poi.hssf.record.BoolErrRecord;
import org.apache.poi.hssf.record.BoundSheetRecord;
import org.apache.poi.hssf.record.FormulaRecord;
import org.apache.poi.hssf.record.LabelRecord;
import org.apache.poi.hssf.record.LabelSSTRecord;
import org.apache.poi.hssf.record.NumberRecord;
import org.apache.poi.hssf.record.RKRecord;
import org.apache.poi.hssf.record.Record;
import org.apache.poi.hssf.record.SSTRecord;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class XlsStreamingReaderSupport {

    private XlsStreamingReaderSupport() {
    }

    static ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        var configuredFields = ReaderFieldSupport.configuredFields(configuration.get("fields"), "Excel");
        if (configuredFields.isEmpty()) {
            throw new IllegalArgumentException("Excel reader requires fields with positions");
        }

        var sheetIndex = optionalInt(configuration, "sheetIndex", 0);
        var dataStartRowIndex = optionalInt(configuration, "rowData", 1);
        var trimValues = Boolean.parseBoolean(String.valueOf(configuration.getOrDefault("trimValues", true)));
        var context = new StreamingContext(payload.name(), configuredFields, dataStartRowIndex, trimValues, Math.max(batchSize, 1), consumer);

        try (var inputStream = payload.openStream(); var filesystem = new POIFSFileSystem(inputStream)) {
            var listener = new SheetListener(context, sheetIndex);
            var missingAware = new MissingRecordAwareHSSFListener(listener);
            listener.setFormatListener(new FormatTrackingHSSFListener(missingAware));
            var request = new HSSFRequest();
            request.addListenerForAllRecords(missingAware);
            new HSSFEventFactory().processWorkbookEvents(request, filesystem);
            listener.finish();
            context.flush();
            return new ReadResult(List.of(), context.totalRecords, context.skippedRows.size(), List.copyOf(context.skippedRows));
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid XLS payload", e);
        }
    }

    private static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        var value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private static final class StreamingContext {
        private final String fileName;
        private final List<ReaderFieldSupport.ConfiguredField> configuredFields;
        private final int dataStartRowIndex;
        private final boolean trimValues;
        private final int batchSize;
        private final ReadBatchConsumer consumer;
        private final List<ReadRecord> batchRecords = new ArrayList<>();
        private final List<ReadSkip> skippedRows = new ArrayList<>();
        private int totalRecords;
        private int batchNumber = 1;

        private StreamingContext(String fileName,
                                 List<ReaderFieldSupport.ConfiguredField> configuredFields,
                                 int dataStartRowIndex,
                                 boolean trimValues,
                                 int batchSize,
                                 ReadBatchConsumer consumer) {
            this.fileName = fileName;
            this.configuredFields = configuredFields;
            this.dataStartRowIndex = dataStartRowIndex;
            this.trimValues = trimValues;
            this.batchSize = batchSize;
            this.consumer = consumer;
        }

        private void processRow(int rowIndex, Map<Integer, String> rowValues) {
            if (rowIndex < dataStartRowIndex || rowValues.isEmpty()) {
                return;
            }
            var rowResult = ReaderFieldSupport.processPositionalRow(configuredFields, field -> {
                var position = field.position();
                if (position == null || position <= 0) {
                    return "";
                }
                var value = rowValues.getOrDefault(position - 1, "");
                return trimValues ? value.trim() : value;
            });
            if (!rowResult.skipped()) {
                batchRecords.add(new ReadRecord(rowResult.values()));
                totalRecords++;
                if (batchRecords.size() >= batchSize) {
                    flush();
                }
            } else {
                skippedRows.add(new ReadSkip(rowIndex + 1, rowResult.reason() == null ? "Row skipped by validation" : rowResult.reason()));
            }
        }

        private void flush() {
            if (consumer == null || batchRecords.isEmpty()) {
                batchRecords.clear();
                return;
            }
            consumer.accept(new ReadBatch(fileName, batchNumber++, List.copyOf(batchRecords)));
            batchRecords.clear();
        }
    }

    private static final class SheetListener implements HSSFListener {
        private final StreamingContext context;
        private final int targetSheetIndex;
        private final Map<Integer, String> rowValues = new HashMap<>();
        private FormatTrackingHSSFListener formatListener;
        private SSTRecord sharedStrings;
        private int currentSheetIndex = -1;
        private int currentRow = -1;
        private boolean inTargetSheet;
        private Integer pendingFormulaRow;
        private Integer pendingFormulaColumn;

        private SheetListener(StreamingContext context, int targetSheetIndex) {
            this.context = context;
            this.targetSheetIndex = targetSheetIndex;
        }

        private void setFormatListener(FormatTrackingHSSFListener formatListener) {
            this.formatListener = formatListener;
        }

        @Override
        public void processRecord(Record record) {
            if (record instanceof BoundSheetRecord) {
                return;
            }
            if (record instanceof SSTRecord sstRecord) {
                sharedStrings = sstRecord;
                return;
            }
            if (record instanceof BOFRecord bofRecord && bofRecord.getType() == BOFRecord.TYPE_WORKSHEET) {
                flushCurrentRow();
                currentSheetIndex++;
                inTargetSheet = currentSheetIndex == targetSheetIndex;
                currentRow = -1;
                return;
            }
            if (!inTargetSheet) {
                return;
            }
            if (record instanceof FormulaRecord formulaRecord) {
                if (Double.isNaN(formulaRecord.getValue())) {
                    pendingFormulaRow = Integer.valueOf(formulaRecord.getRow());
                    pendingFormulaColumn = Integer.valueOf(formulaRecord.getColumn());
                } else {
                    putCell(formulaRecord.getRow(), formulaRecord.getColumn(), formatListener.formatNumberDateCell(formulaRecord));
                }
                return;
            }
            if (pendingFormulaRow != null && record instanceof org.apache.poi.hssf.record.StringRecord stringRecord) {
                putCell(pendingFormulaRow, pendingFormulaColumn, stringRecord.getString());
                pendingFormulaRow = null;
                pendingFormulaColumn = null;
                return;
            }
            if (record instanceof LabelSSTRecord labelSSTRecord) {
                var value = sharedStrings == null ? "" : sharedStrings.getString(labelSSTRecord.getSSTIndex()).toString();
                putCell(labelSSTRecord.getRow(), labelSSTRecord.getColumn(), value);
                return;
            }
            if (record instanceof LabelRecord labelRecord) {
                putCell(labelRecord.getRow(), labelRecord.getColumn(), labelRecord.getValue());
                return;
            }
            if (record instanceof NumberRecord numberRecord) {
                putCell(numberRecord.getRow(), numberRecord.getColumn(), formatListener.formatNumberDateCell(numberRecord));
                return;
            }
            if (record instanceof RKRecord rkRecord) {
                putCell(rkRecord.getRow(), rkRecord.getColumn(), formatListener.formatNumberDateCell(rkRecord));
                return;
            }
            if (record instanceof BlankRecord blankRecord) {
                putCell(blankRecord.getRow(), blankRecord.getColumn(), "");
                return;
            }
            if (record instanceof BoolErrRecord boolErrRecord) {
                var value = boolErrRecord.isBoolean() ? String.valueOf(boolErrRecord.getBooleanValue()) : "";
                putCell(boolErrRecord.getRow(), boolErrRecord.getColumn(), value);
                return;
            }
            if (record instanceof MissingCellDummyRecord missingCellDummyRecord) {
                putCell(missingCellDummyRecord.getRow(), missingCellDummyRecord.getColumn(), "");
                return;
            }
            if (record instanceof LastCellOfRowDummyRecord lastCellOfRowDummyRecord) {
                flushRow(lastCellOfRowDummyRecord.getRow());
            }
        }

        private void putCell(int rowIndex, int columnIndex, String value) {
            if (currentRow != rowIndex && currentRow != -1) {
                flushRow(currentRow);
            }
            currentRow = rowIndex;
            rowValues.put(columnIndex, value == null ? "" : value);
        }

        private void flushRow(int rowIndex) {
            context.processRow(rowIndex, rowValues);
            rowValues.clear();
            currentRow = -1;
        }

        private void flushCurrentRow() {
            if (currentRow >= 0) {
                flushRow(currentRow);
            }
        }

        private void finish() {
            flushCurrentRow();
            if (currentSheetIndex < targetSheetIndex) {
                throw new IllegalArgumentException("Invalid sheetIndex: " + targetSheetIndex);
            }
        }
    }
}
