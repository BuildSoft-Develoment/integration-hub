package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@ApplicationScoped
public class FileReadRuntimeSupport {

    private final JsonConfigurationMapper jsonConfigurationMapper;

    public FileReadRuntimeSupport(JsonConfigurationMapper jsonConfigurationMapper) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    public Map<String, Object> sourceConfiguration(String sourceConfigurationJson,
                                                   String taskConfigurationJson,
                                                   Map<String, String> executionVariables) {
        var sourceConfiguration = new LinkedHashMap<>(jsonConfigurationMapper.toMap(sourceConfigurationJson));
        var taskConfiguration = jsonConfigurationMapper.toMap(taskConfigurationJson);
        mergeTemplateVariables(sourceConfiguration, taskConfiguration, executionVariables);
        return sourceConfiguration;
    }

    public Map<String, Object> configuration(String configurationJson) {
        return jsonConfigurationMapper.toMap(configurationJson);
    }

    public List<SelectedSourceFile> filterSelectedFiles(List<SelectedSourceFile> selectedFiles,
                                                        List<String> selectedFileReferences) {
        if (selectedFileReferences == null || selectedFileReferences.isEmpty()) {
            return selectedFiles;
        }
        var requested = selectedFileReferences.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(java.util.stream.Collectors.toSet());
        return selectedFiles.stream()
                .filter(file -> requested.contains(file.location()) || requested.contains(file.name()))
                .toList();
    }

    public ReadResult collectReadResult(ReaderProvider readerProvider,
                                        SourcePayload payload,
                                        Map<String, Object> configuration) {
        var records = new ArrayList<ReadRecord>();
        var result = readerProvider.readInBatches(
                payload,
                configuration,
                Integer.MAX_VALUE,
                batch -> records.addAll(enrichRecordsWithSourceMetadata(batch.records(), payload))
        );
        return new ReadResult(List.copyOf(records), result.recordCount(), result.skippedCount(), result.skippedRows());
    }

    public List<ReadRecord> enrichRecordsWithSourceMetadata(List<ReadRecord> records, SourcePayload payload) {
        if (records == null || records.isEmpty() || payload == null) {
            return records == null ? List.of() : records;
        }
        var sourceFile = payload.file();
        return records.stream()
                .filter(Objects::nonNull)
                .map(record -> enrichRecordWithSourceMetadata(record, payload, sourceFile))
                .toList();
    }

    public int batchSize(Map<String, Object> configuration) {
        var value = configuration.get("batchSize");
        if (value == null || String.valueOf(value).isBlank()) {
            return 500;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    public String normalizeFileErrorPolicy(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return "failFast";
        }
        var normalized = String.valueOf(value).trim();
        return "continue".equalsIgnoreCase(normalized) ? "continue" : "failFast";
    }

    public boolean isParallelEnabled(Map<String, Object> configuration) {
        var value = configuration.get("parallel");
        if (value == null) return false;
        if (value instanceof Boolean b) return b;
        return "true".equalsIgnoreCase(String.valueOf(value).trim());
    }

    public int maxConcurrency(Map<String, Object> configuration) {
        var value = configuration.get("maxConcurrency");
        if (value == null || String.valueOf(value).isBlank()) {
            return 0; // 0 means use default pool size
        }
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private void mergeTemplateVariables(Map<String, Object> sourceConfiguration,
                                        Map<String, Object> taskConfiguration,
                                        Map<String, String> executionVariables) {
        var mergedVariables = new LinkedHashMap<String, String>();
        mergedVariables.putAll(stringMap(sourceConfiguration.get("templateVariables")));
        mergedVariables.putAll(stringMap(taskConfiguration.get("sourceVariables")));
        if (executionVariables != null) {
            executionVariables.forEach((key, value) -> {
                if (key != null && !key.isBlank() && value != null && !value.isBlank()) {
                    mergedVariables.put(key.trim(), value.trim());
                }
            });
        }
        if (!mergedVariables.isEmpty()) {
            sourceConfiguration.put("templateVariables", mergedVariables);
        }
    }

    private ReadRecord enrichRecordWithSourceMetadata(ReadRecord record,
                                                      SourcePayload payload,
                                                      SelectedSourceFile sourceFile) {
        var values = new LinkedHashMap<String, Object>();
        if (record.values() != null) {
            values.putAll(record.values());
        }
        values.put("_sourceFileName", payload.name());
        values.put("_sourceFilePath", payload.location());
        values.put("_sourceMediaType", payload.mediaType());
        if (sourceFile != null) {
            values.put("_sourceFileSize", sourceFile.size());
            values.put("_sourceLastModified", sourceFile.lastModified());
        }
        return new ReadRecord(values);
    }

    private Map<String, String> stringMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var result = new LinkedHashMap<String, String>();
        rawMap.forEach((key, nestedValue) -> {
            var normalizedKey = key == null ? "" : String.valueOf(key).trim();
            var normalizedValue = nestedValue == null ? "" : String.valueOf(nestedValue).trim();
            if (!normalizedKey.isBlank() && !normalizedValue.isBlank()) {
                result.put(normalizedKey, normalizedValue);
            }
        });
        return result;
    }
}
