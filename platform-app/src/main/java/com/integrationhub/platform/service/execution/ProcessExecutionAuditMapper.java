package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessExecutionAuditMapper {

    private static final int MAX_SKIP_DETAILS = 10;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    public ProcessExecutionAuditMapper(JsonConfigurationMapper jsonConfigurationMapper) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    public String buildReadDetails(String sourceName,
                                   ReadResult readResult,
                                   List<StreamingPipelineService.BatchSummary> fileSummaries) {
        var lines = new StringBuilder()
                .append("Read completed for source ")
                .append(sourceName)
                .append(" with ")
                .append(readResult.recordCount())
                .append(" valid records and ")
                .append(readResult.skippedCount())
                .append(" skipped");

        if (!fileSummaries.isEmpty()) {
            lines.append("\n\nFiles processed:");
            fileSummaries.forEach(summary -> lines.append("\n- ")
                    .append(summary.fileName())
                    .append(": valid=")
                    .append(summary.recordCount())
                    .append(", skipped=")
                    .append(summary.skippedCount()));
        }

        if (readResult.skippedCount() > 0) {
            lines.append("\n\nSkipped rows:");
            readResult.skippedRows().stream()
                    .limit(MAX_SKIP_DETAILS)
                    .forEach(skip -> lines.append("\n- row ").append(skip.rowNumber()).append(": ").append(skip.reason()));
            if (readResult.skippedCount() > MAX_SKIP_DETAILS) {
                lines.append("\n- ... and ")
                        .append(readResult.skippedCount() - MAX_SKIP_DETAILS)
                        .append(" more");
            }
        }
        return lines.toString();
    }

    public Map<String, Object> buildReadAuditPayload(ProcessExecutionStateService.TaskPlan taskPlan,
                                                      ReadResult readResult,
                                                      List<StreamingPipelineService.BatchSummary> fileSummaries,
                                                      List<SelectedSourceFile> selectedFiles,
                                                      Map<String, String> executionVariables,
                                                      String triggerSource) {
        var skippedRows = readResult.skippedRows().stream()
                .limit(MAX_SKIP_DETAILS)
                .map(skip -> Map.of(
                        "rowNumber", skip.rowNumber(),
                        "reason", skip.reason() == null ? "Row skipped by validation" : skip.reason()
                ))
                .toList();

        var payload = new java.util.LinkedHashMap<String, Object>();
        payload.put("taskType", taskPlan.taskType());
        payload.put("triggerSource", triggerSource);
        payload.put("executionVariables", executionVariables);
        payload.put("sourceDefinitionId", taskPlan.sourceDefinitionId());
        payload.put("sourceName", taskPlan.sourceName());
        payload.put("readerDefinitionId", taskPlan.readerDefinitionId());
        payload.put("readerType", taskPlan.readerType());
        payload.put("recordCount", readResult.recordCount());
        payload.put("skippedCount", readResult.skippedCount());
        payload.put("skippedRows", skippedRows);
        payload.put("skipDetailsTruncated", readResult.skippedCount() > MAX_SKIP_DETAILS);
        payload.put("selectedFiles", selectedFiles.stream().map(SelectedSourceFile::name).toList());
        payload.put("files", fileSummaries.stream().map(summary -> Map.of(
                "fileName", summary.fileName(),
                "recordCount", summary.recordCount(),
                "skippedCount", summary.skippedCount(),
                "writtenCount", summary.writtenCount()
        )).toList());
        payload.put("fileErrorPolicy", resolveFileErrorPolicy(taskPlan));
        return payload;
    }

    public String buildTaskDetails(ProcessExecutionStateService.TaskPlan plan, String customDetails) {
        return customDetails != null ? customDetails : "Task " + plan.taskType() + " (" + plan.taskDefinitionId() + ") completed";
    }

    public Map<String, Object> buildBatchSinkAuditPayload(ProcessExecutionStateService.TaskPlan taskPlan,
                                                          int processedCount,
                                                          int writtenCount,
                                                          List<StreamingPipelineService.BatchSummary> fileSummaries) {
        var taskConfiguration = jsonConfigurationMapper.toMap(taskPlan.configurationJson());
        var payload = new java.util.LinkedHashMap<String, Object>();
        payload.put("taskType", taskPlan.taskType());
        payload.put("processedCount", processedCount);
        payload.put("writtenCount", writtenCount);
        payload.put("mode", String.valueOf(taskConfiguration.getOrDefault("mode", "")));
        if (taskConfiguration.get("targetTable") != null) {
            payload.put("targetTable", String.valueOf(taskConfiguration.get("targetTable")));
        }
        payload.put("files", fileSummaries.stream().map(summary -> Map.of(
                "fileName", summary.fileName(),
                "processedCount", summary.writtenCount()
        )).toList());
        return payload;
    }

    public String buildPipelineFailureDetails(String sourceName,
                                               StreamingPipelineService.StreamingPipelineException failure) {
        var lines = new StringBuilder()
                .append("Read/Sink pipeline failed for source ")
                .append(sourceName)
                .append(" after ")
                .append(failure.completedFiles().size())
                .append(" completed files with ")
                .append(failure.validCount())
                .append(" valid records, ")
                .append(failure.skippedCount())
                .append(" skipped and ")
                .append(failure.writtenCount())
                .append(" written");

        if (!failure.completedFiles().isEmpty()) {
            lines.append("\n\nFiles processed:");
            failure.completedFiles().forEach(summary -> lines.append("\n- ")
                    .append(summary.fileName())
                    .append(": valid=")
                    .append(summary.recordCount())
                    .append(", skipped=")
                    .append(summary.skippedCount()));
        }

        if (!failure.skippedRows().isEmpty()) {
            lines.append("\n\nSkipped rows:");
            failure.skippedRows().stream()
                    .limit(MAX_SKIP_DETAILS)
                    .forEach(skip -> lines.append("\n- row ").append(skip.rowNumber()).append(": ").append(skip.reason()));
            if (failure.skippedRows().size() > MAX_SKIP_DETAILS) {
                lines.append("\n- ... and ")
                        .append(failure.skippedRows().size() - MAX_SKIP_DETAILS)
                        .append(" more");
            }
        }

        if (!failure.failedFiles().isEmpty()) {
            lines.append("\n\nFailed files:");
            failure.failedFiles().forEach(file -> lines.append("\n- ")
                    .append(file.fileName())
                    .append(": ")
                    .append(file.message()));
        } else {
            lines.append("\n\nFailed file:")
                    .append("\n- ")
                    .append(failure.failedFileName())
                    .append(": ")
                    .append(failure.getMessage());
        }

        return lines.toString();
    }

    public Map<String, Object> buildTaskFailurePayload(ProcessExecutionStateService.TaskPlan taskPlan,
                                                        Map<String, String> executionVariables,
                                                        String triggerSource) {
        var payload = new java.util.LinkedHashMap<String, Object>();
        payload.put("taskType", taskPlan.taskType());
        payload.put("triggerSource", triggerSource);
        payload.put("executionVariables", executionVariables);
        if (taskPlan.sourceDefinitionId() != null) {
            payload.put("sourceDefinitionId", taskPlan.sourceDefinitionId());
        }
        if (taskPlan.sourceName() != null && !taskPlan.sourceName().isBlank()) {
            payload.put("sourceName", taskPlan.sourceName());
        }
        if (taskPlan.readerDefinitionId() != null) {
            payload.put("readerDefinitionId", taskPlan.readerDefinitionId());
        }
        if (taskPlan.readerType() != null && !taskPlan.readerType().isBlank()) {
            payload.put("readerType", taskPlan.readerType());
        }
        return payload;
    }

    /**
     * Igual que {@link #buildTaskFailurePayload}, pero conservando el OUTPUT que la tarea alcanzo a producir.
     *
     * <p>Sin esto, al fallar se emitia un payload con solo el plan (taskType/triggerSource/executionVariables) y se
     * DESCARTABA el output, que es justo donde el provider deja el motivo: MT101_PAY publica en {@code errors} la
     * referencia y el {@code lastError} de cada fragmento no despachado. El resultado era que la unica pista de un
     * pago no entregado era el contador {@code invalidated=N}, indiagnosticable a posteriori. Las ramas de exito y
     * de continueOnFailure si conservaban ese output; la de fallo —la que mas lo necesita— no.
     *
     * <p>El plan gana ante colision de claves: describe QUE tarea fallo y no debe quedar pisado por el output.
     */
    public Map<String, Object> buildTaskFailurePayload(ProcessExecutionStateService.TaskPlan taskPlan,
                                                        Map<String, String> executionVariables,
                                                        String triggerSource,
                                                        Object taskOutput) {
        var payload = buildTaskFailurePayload(taskPlan, executionVariables, triggerSource);
        if (taskOutput instanceof Map<?, ?> output) {
            output.forEach((key, value) -> {
                if (key != null) {
                    payload.putIfAbsent(String.valueOf(key), value);
                }
            });
        } else if (taskOutput != null) {
            payload.putIfAbsent("taskOutput", taskOutput);
        }
        return payload;
    }

    public Map<String, Object> buildPipelineFailurePayload(ProcessExecutionStateService.TaskPlan taskPlan,
                                                            StreamingPipelineService.StreamingPipelineException failure,
                                                            Map<String, String> executionVariables,
                                                            String triggerSource,
                                                            String taskType) {
        var skippedRows = failure.skippedRows().stream()
                .limit(MAX_SKIP_DETAILS)
                .map(skip -> Map.of(
                        "rowNumber", skip.rowNumber(),
                        "reason", skip.reason() == null ? "Row skipped by validation" : skip.reason()
                ))
                .toList();

        var payload = new java.util.LinkedHashMap<String, Object>();
        payload.put("taskType", taskType);
        payload.put("triggerSource", triggerSource);
        payload.put("executionVariables", executionVariables);
        payload.put("sourceDefinitionId", taskPlan.sourceDefinitionId());
        payload.put("sourceName", taskPlan.sourceName());
        payload.put("readerDefinitionId", taskPlan.readerDefinitionId());
        payload.put("readerType", taskPlan.readerType());
        payload.put("recordCount", failure.validCount());
        payload.put("skippedCount", failure.skippedCount());
        payload.put("writtenCount", failure.writtenCount());
        payload.put("skippedRows", skippedRows);
        payload.put("skipDetailsTruncated", failure.skippedRows().size() > MAX_SKIP_DETAILS);
        payload.put("selectedFiles", failure.selectedFiles().stream().map(SelectedSourceFile::name).toList());
        payload.put("files", failure.completedFiles().stream().map(summary -> Map.of(
                "fileName", summary.fileName(),
                "recordCount", summary.recordCount(),
                "skippedCount", summary.skippedCount(),
                "writtenCount", summary.writtenCount()
        )).toList());
        payload.put("failed", true);
        payload.put("failedFile", failure.failedFileName());
        payload.put("failedFiles", failure.failedFiles().stream().map(file -> Map.of(
                "fileName", file.fileName(),
                "message", file.message()
        )).toList());
        payload.put("failureMessage", failure.getMessage());
        payload.put("completedFilesCount", failure.completedFiles().size());
        payload.put("pendingFilesCount", Math.max(failure.selectedFiles().size() - failure.completedFiles().size() - failure.failedFiles().size(), 0));
        payload.put("fileErrorPolicy", resolveFileErrorPolicy(taskPlan));
        return payload;
    }

    public String resolveFileErrorPolicy(ProcessExecutionStateService.TaskPlan taskPlan) {
        var sourceConfiguration = jsonConfigurationMapper.toMap(taskPlan.sourceConfigurationJson());
        var raw = sourceConfiguration.get("fileErrorPolicy");
        if (raw == null || String.valueOf(raw).isBlank()) {
            return "failFast";
        }
        return "continue".equalsIgnoreCase(String.valueOf(raw).trim()) ? "continue" : "failFast";
    }
}
