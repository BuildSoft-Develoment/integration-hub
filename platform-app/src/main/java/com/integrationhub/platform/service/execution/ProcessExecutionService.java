package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessExecutionService {

    private static final int MAX_SKIP_DETAILS = 10;

    private final ProcessExecutionStateService processExecutionStateService;
    private final ProcessTaskRuntimeService processTaskRuntimeService;
    private final FileReadDbWritePipelineService fileReadDbWritePipelineService;
    private final ProcessedSourceFileService processedSourceFileService;
    private final JsonConfigurationMapper jsonConfigurationMapper;
    private final Tracer tracer;

    public ProcessExecutionService(
            ProcessExecutionStateService processExecutionStateService,
            ProcessTaskRuntimeService processTaskRuntimeService,
            FileReadDbWritePipelineService fileReadDbWritePipelineService,
            ProcessedSourceFileService processedSourceFileService,
            JsonConfigurationMapper jsonConfigurationMapper,
            Tracer tracer
    ) {
        this.processExecutionStateService = processExecutionStateService;
        this.processTaskRuntimeService = processTaskRuntimeService;
        this.fileReadDbWritePipelineService = fileReadDbWritePipelineService;
        this.processedSourceFileService = processedSourceFileService;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
        this.tracer = tracer;
    }

    public com.integrationhub.platform.entity.ProcessExecution execute(Long processDefinitionId) {
        return execute(processDefinitionId, Map.of(), List.of(), null, "MANUAL");
    }

    public com.integrationhub.platform.entity.ProcessExecution execute(Long processDefinitionId,
                                                                       Map<String, String> executionVariables,
                                                                       String triggerSource) {
        return execute(processDefinitionId, executionVariables, List.of(), null, triggerSource);
    }

    public com.integrationhub.platform.entity.ProcessExecution execute(Long processDefinitionId,
                                                                       Map<String, String> executionVariables,
                                                                       List<String> selectedFiles,
                                                                       Long sourceExecutionId,
                                                                       String triggerSource) {
        var normalizedExecutionVariables = executionVariables == null ? Map.<String, String>of() : Map.copyOf(executionVariables);
        var normalizedSelectedFiles = selectedFiles == null ? List.<String>of() : selectedFiles.stream().filter(value -> value != null && !value.isBlank()).map(String::trim).distinct().toList();
        var normalizedTriggerSource = triggerSource == null || triggerSource.isBlank() ? "MANUAL" : triggerSource;

        var processSpan = tracer.spanBuilder("process.execute").startSpan();
        processSpan.setAttribute("process.definition.id", processDefinitionId);
        processSpan.setAttribute("process.trigger.source", normalizedTriggerSource);
        processSpan.setAttribute("process.execution.variables.count", normalizedExecutionVariables.size());
        processSpan.setAttribute("process.selected.files.count", normalizedSelectedFiles.size());

        var plan = processExecutionStateService.loadExecutionPlan(processDefinitionId);
        processSpan.setAttribute("process.definition.name", plan.processName());
        if (sourceExecutionId != null) {
            processSpan.setAttribute("process.source.execution.id", sourceExecutionId);
        }
        var processExecutionId = processExecutionStateService.startProcess(plan.processDefinitionId(), plan.processName(), sourceExecutionId, normalizedTriggerSource);

        try {
            SourcePayload sourcePayload = null;
            ReadResult readResult = null;
            var taskOutputs = new java.util.LinkedHashMap<String, Object>();
            var tasks = plan.tasks();

            for (int index = 0; index < tasks.size(); index++) {
                var taskPlan = tasks.get(index);
                var nextTaskPlan = index + 1 < tasks.size() ? tasks.get(index + 1) : null;
                if (shouldUseFileReadDbWritePipeline(taskPlan, nextTaskPlan)) {
                    var fileReadTaskExecutionId = processExecutionStateService.startTask(processExecutionId, taskPlan.taskDefinitionId(), taskPlan.taskType().name(), taskPlan.taskOrder());
                    var dbWriteTaskExecutionId = processExecutionStateService.startTask(processExecutionId, nextTaskPlan.taskDefinitionId(), nextTaskPlan.taskType().name(), nextTaskPlan.taskOrder());
                    try {
                        var pipelineResult = fileReadDbWritePipelineService.run(processExecutionId, taskPlan, nextTaskPlan, normalizedExecutionVariables, normalizedSelectedFiles);
                        readResult = pipelineResult.readResult();
                        sourcePayload = null;
                        processExecutionStateService.completeTask(
                                processExecutionId,
                                fileReadTaskExecutionId,
                                buildReadDetails(taskPlan.sourceName(), pipelineResult.readResult(), pipelineResult.fileSummaries()),
                                buildReadAuditPayload(taskPlan, pipelineResult.readResult(), pipelineResult.fileSummaries(), pipelineResult.selectedFiles(), normalizedExecutionVariables, normalizedTriggerSource)
                        );
                        processedSourceFileService.recordPipelineFiles(
                                processExecutionId,
                                taskPlan.taskDefinitionId(),
                                pipelineResult.selectedFiles(),
                                pipelineResult.fileSummaries(),
                                List.of()
                        );
                        processExecutionStateService.completeTask(
                                processExecutionId,
                                dbWriteTaskExecutionId,
                                buildDbWriteDetails(nextTaskPlan, pipelineResult),
                                Map.of(
                                        "taskType", nextTaskPlan.taskType().name(),
                                        "writtenCount", pipelineResult.writtenCount(),
                                        "files", pipelineResult.fileSummaries().stream().map(summary -> Map.of(
                                                "fileName", summary.fileName(),
                                                "writtenCount", summary.writtenCount()
                                        )).toList()
                                )
                        );
                        index++;
                        continue;
                    } catch (Exception taskError) {
                        if (taskError instanceof FileReadDbWritePipelineService.FileReadDbWritePipelineException pipelineFailure) {
                            var failureDetails = buildPipelineFailureDetails(taskPlan.sourceName(), pipelineFailure);
                            var failurePayload = buildPipelineFailurePayload(taskPlan, pipelineFailure, normalizedExecutionVariables, normalizedTriggerSource, taskPlan.taskType().name());
                            var fileErrorPolicy = resolveFileErrorPolicy(taskPlan);
                            processedSourceFileService.recordPipelineFiles(
                                    processExecutionId,
                                    taskPlan.taskDefinitionId(),
                                    pipelineFailure.selectedFiles(),
                                    pipelineFailure.completedFiles(),
                                    pipelineFailure.failedFiles()
                            );
                            if ("continue".equals(fileErrorPolicy)) {
                                processExecutionStateService.completeTaskWithErrors(
                                        processExecutionId,
                                        fileReadTaskExecutionId,
                                        failureDetails,
                                        failurePayload
                                );
                                processExecutionStateService.completeTaskWithErrors(
                                        processExecutionId,
                                        dbWriteTaskExecutionId,
                                        failureDetails,
                                        buildPipelineFailurePayload(taskPlan, pipelineFailure, normalizedExecutionVariables, normalizedTriggerSource, nextTaskPlan.taskType().name())
                                );
                                processExecutionStateService.completeProcessWithErrors(processExecutionId, failureDetails);
                                return processExecutionStateService.getExecution(processExecutionId);
                            }
                            processExecutionStateService.failTask(
                                    processExecutionId,
                                    fileReadTaskExecutionId,
                                    failureDetails,
                                    failurePayload
                            );
                            processExecutionStateService.failTask(
                                    processExecutionId,
                                    dbWriteTaskExecutionId,
                                    failureDetails,
                                    buildPipelineFailurePayload(taskPlan, pipelineFailure, normalizedExecutionVariables, normalizedTriggerSource, nextTaskPlan.taskType().name())
                            );
                            throw taskError;
                        }
                        var message = taskError.getMessage() == null ? taskError.getClass().getSimpleName() : taskError.getMessage();
                        processExecutionStateService.failTask(processExecutionId, fileReadTaskExecutionId, message, buildTaskFailurePayload(taskPlan, normalizedExecutionVariables, normalizedTriggerSource));
                        processExecutionStateService.failTask(processExecutionId, dbWriteTaskExecutionId, message, buildTaskFailurePayload(nextTaskPlan, normalizedExecutionVariables, normalizedTriggerSource));
                        throw taskError;
                    }
                }

                var taskSpan = tracer.spanBuilder("process.task.execute")
                        .setAttribute("task.definition.id", taskPlan.taskDefinitionId())
                        .setAttribute("task.order", taskPlan.taskOrder())
                        .setAttribute("task.type", taskPlan.taskType().name())
                        .startSpan();

                var taskExecutionId = processExecutionStateService.startTask(processExecutionId, taskPlan.taskDefinitionId(), taskPlan.taskType().name(), taskPlan.taskOrder());
                try {
                    var runResult = processTaskRuntimeService.runTask(processExecutionId, taskPlan, sourcePayload, readResult, normalizedExecutionVariables, taskOutputs, normalizedSelectedFiles);
                    Object taskPayload = null;
                    String taskDetails;

                    if (runResult.fileRead()) {
                        sourcePayload = runResult.sourcePayload();
                        readResult = runResult.readResult();
                        taskDetails = buildReadDetails(taskPlan.sourceName(), readResult, List.of());
                        taskPayload = buildReadAuditPayload(taskPlan, readResult, List.of(), List.of(), normalizedExecutionVariables, normalizedTriggerSource);
                        taskSpan.setAttribute("records.count", readResult.recordCount());
                        taskSpan.setAttribute("records.skipped", readResult.skippedCount());
                    } else {
                        taskDetails = runResult.details();
                        if (runResult.outputs() != null && !runResult.outputs().isEmpty()) {
                            taskOutputs.putAll(runResult.outputs());
                            var outputPayload = new java.util.LinkedHashMap<String, Object>();
                            outputPayload.put("taskType", taskPlan.taskType().name());
                            outputPayload.put("outputs", runResult.outputs());
                            taskPayload = outputPayload;
                        }
                    }

                    processExecutionStateService.completeTask(processExecutionId, taskExecutionId, taskDetails, taskPayload);
                } catch (Exception taskError) {
                    var message = taskError.getMessage() == null ? taskError.getClass().getSimpleName() : taskError.getMessage();
                    processExecutionStateService.failTask(processExecutionId, taskExecutionId, message, buildTaskFailurePayload(taskPlan, normalizedExecutionVariables, normalizedTriggerSource));
                    taskSpan.recordException(taskError);
                    taskSpan.setStatus(StatusCode.ERROR, message);
                    throw taskError;
                } finally {
                    taskSpan.end();
                }
            }

            processExecutionStateService.completeProcess(processExecutionId, "Process completed successfully");
            return processExecutionStateService.getExecution(processExecutionId);
        } catch (Exception e) {
            var message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            processExecutionStateService.failProcess(processExecutionId, message);
            processSpan.recordException(e);
            processSpan.setStatus(StatusCode.ERROR, message);
            throw e;
        } finally {
            processSpan.end();
        }
    }

    private boolean shouldUseFileReadDbWritePipeline(ProcessExecutionStateService.TaskPlan current,
                                                     ProcessExecutionStateService.TaskPlan next) {
        return current != null
                && next != null
                && current.taskType() == TaskType.FILE_READ
                && next.taskType() == TaskType.DB_WRITE
                && ("TXT".equalsIgnoreCase(current.readerType()) || "CSV".equalsIgnoreCase(current.readerType()));
    }

    private String buildReadDetails(String sourceName,
                                    ReadResult readResult,
                                    List<FileReadDbWritePipelineService.FileReadSummary> fileSummaries) {
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

    private Map<String, Object> buildReadAuditPayload(ProcessExecutionStateService.TaskPlan taskPlan,
                                                      ReadResult readResult,
                                                      List<FileReadDbWritePipelineService.FileReadSummary> fileSummaries,
                                                  List<com.integrationhub.platform.spi.source.SelectedSourceFile> selectedFiles,
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
        payload.put("taskType", taskPlan.taskType().name());
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
        payload.put("selectedFiles", selectedFiles.stream().map(file -> file.name()).toList());
        payload.put("files", fileSummaries.stream().map(summary -> Map.of(
                "fileName", summary.fileName(),
                "recordCount", summary.recordCount(),
                "skippedCount", summary.skippedCount(),
                "writtenCount", summary.writtenCount()
        )).toList());
        payload.put("fileErrorPolicy", resolveFileErrorPolicy(taskPlan));
        return payload;
    }

    private String buildDbWriteDetails(ProcessExecutionStateService.TaskPlan dbWritePlan,
                                       FileReadDbWritePipelineService.FileReadDbWriteResult pipelineResult) {
        return "DB write completed with " + pipelineResult.writtenCount() + " records written using task " + dbWritePlan.taskDefinitionId();
    }
    private String buildPipelineFailureDetails(String sourceName,
                                               FileReadDbWritePipelineService.FileReadDbWritePipelineException failure) {
        var lines = new StringBuilder()
                .append("Read/DB write failed for source ")
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

    private Map<String, Object> buildTaskFailurePayload(ProcessExecutionStateService.TaskPlan taskPlan,
                                                      Map<String, String> executionVariables,
                                                      String triggerSource) {
        var payload = new java.util.LinkedHashMap<String, Object>();
        payload.put("taskType", taskPlan.taskType().name());
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

    private Map<String, Object> buildPipelineFailurePayload(ProcessExecutionStateService.TaskPlan taskPlan,
                                                            FileReadDbWritePipelineService.FileReadDbWritePipelineException failure,
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
        payload.put("selectedFiles", failure.selectedFiles().stream().map(file -> file.name()).toList());
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

    private String resolveFileErrorPolicy(ProcessExecutionStateService.TaskPlan taskPlan) {
        var sourceConfiguration = jsonConfigurationMapper.toMap(taskPlan.sourceConfigurationJson());
        var raw = sourceConfiguration.get("fileErrorPolicy");
        if (raw == null || String.valueOf(raw).isBlank()) {
            return "failFast";
        }
        return "continue".equalsIgnoreCase(String.valueOf(raw).trim()) ? "continue" : "failFast";
    }
}



