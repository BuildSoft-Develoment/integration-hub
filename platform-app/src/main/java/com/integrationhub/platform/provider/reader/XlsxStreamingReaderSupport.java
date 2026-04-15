package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.ReadBatch;
import com.integrationhub.platform.spi.ReadBatchConsumer;
import com.integrationhub.platform.spi.ReadRecord;
import com.integrationhub.platform.spi.ReadResult;
import com.integrationhub.platform.spi.ReadSkip;
import com.integrationhub.platform.spi.SourcePayload;
import org.apache.poi.ooxml.util.SAXHelper;
import org.apache.poi.openxml4j.exceptions.OpenXML4JException;
import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.eventusermodel.XSSFSheetXMLHandler;
import org.apache.poi.xssf.usermodel.XSSFComment;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class XlsxStreamingReaderSupport {

    private XlsxStreamingReaderSupport() {
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

        try (var inputStream = payload.openStream(); var pkg = OPCPackage.open(inputStream)) {
            var reader = new XSSFReader(pkg);
            var styles = reader.getStylesTable();
            var sharedStrings = reader.getSharedStringsTable();
            var sheets = (XSSFReader.SheetIterator) reader.getSheetsData();
            var currentSheetIndex = 0;
            var foundSheet = false;

            while (sheets.hasNext()) {
                try (var sheetStream = sheets.next()) {
                    if (currentSheetIndex != sheetIndex) {
                        currentSheetIndex++;
                        continue;
                    }
                    foundSheet = true;
                    var parser = SAXHelper.newXMLReader();
                    var handler = new XSSFSheetXMLHandler(styles, null, sharedStrings, new SheetHandler(context), new DataFormatter(), false);
                    parser.setContentHandler(handler);
                    parser.parse(new InputSource(sheetStream));
                    break;
                }
            }

            if (!foundSheet) {
                throw new IllegalArgumentException("Invalid sheetIndex: " + sheetIndex);
            }

            context.flush();
            return new ReadResult(List.of(), context.totalRecords, context.skippedRows.size(), List.copyOf(context.skippedRows));
        } catch (OpenXML4JException | SAXException | IOException | ParserConfigurationException e) {
            throw new IllegalArgumentException("Invalid XLSX payload", e);
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

    private static final class SheetHandler implements XSSFSheetXMLHandler.SheetContentsHandler {
        private final StreamingContext context;
        private final Map<Integer, String> rowValues = new HashMap<>();
        private int currentRow = -1;

        private SheetHandler(StreamingContext context) {
            this.context = context;
        }

        @Override
        public void startRow(int rowNum) {
            currentRow = rowNum;
            rowValues.clear();
        }

        @Override
        public void endRow(int rowNum) {
            context.processRow(rowNum, rowValues);
            rowValues.clear();
        }

        @Override
        public void cell(String cellReference, String formattedValue, XSSFComment comment) {
            if (cellReference == null) {
                return;
            }
            var columnIndex = Integer.valueOf(new org.apache.poi.ss.util.CellReference(cellReference).getCol());
            rowValues.put(columnIndex, formattedValue == null ? "" : formattedValue);
        }

        @Override
        public void headerFooter(String text, boolean isHeader, String tagName) {
        }
    }
}