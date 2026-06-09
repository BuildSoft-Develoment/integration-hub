package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Registra los outputs publicados por cada tarea (summary/records/table/errors) para que
 * tareas posteriores los consuman; soporta `batchSize`/checkpoint del motor. Ver ADR-004.
 *
 * @trace RF-010
 */
@ApplicationScoped
public class TaskOutputRegistry {

    private final JsonConfigurationMapper jsonConfigurationMapper;

    public TaskOutputRegistry(JsonConfigurationMapper jsonConfigurationMapper) {
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    public Map<String, Object> configuration(String configurationJson) {
        return jsonConfigurationMapper.toMap(configurationJson);
    }

    public String taskRef(ProcessExecutionStateService.TaskPlan taskPlan, Map<String, Object> configuration) {
        var configuredRef = stringValue(configuration.get("taskRef"));
        if (!configuredRef.isBlank()) {
            return configuredRef;
        }
        throw new IllegalArgumentException("Task " + taskPlan.taskOrder() + " requires configuration key: taskRef");
    }

    public String executionMode(Map<String, Object> configuration) {
        var value = stringValue(configuration.get("executionMode"));
        if (value.isBlank()) {
            throw new IllegalArgumentException("Task configuration requires executionMode");
        }
        var normalized = value.toLowerCase();
        if (!"once".equals(normalized) && !"per-record".equals(normalized) && !"batch".equals(normalized)) {
            throw new IllegalArgumentException("Unsupported executionMode: " + value);
        }
        return normalized;
    }

    public Map<String, Object> taskMetadata(Long processExecutionId,
                                            ProcessExecutionStateService.TaskPlan taskPlan,
                                            Map<String, Object> configuration,
                                            String triggerSource) {
        var metadata = new LinkedHashMap<String, Object>();
        metadata.put("_processExecutionId", processExecutionId);
        metadata.put("_taskDefinitionId", taskPlan.taskDefinitionId());
        metadata.put("_taskOrder", taskPlan.taskOrder());
        metadata.put("_taskType", taskPlan.taskType());
        metadata.put("_taskRef", taskRef(taskPlan, configuration));
        metadata.put("_executionMode", executionMode(configuration));
        metadata.put("_triggerSource", triggerSource == null || triggerSource.isBlank() ? "MANUAL" : triggerSource);
        return metadata;
    }

    public void registerMetadata(Map<String, Object> taskOutputs,
                                 Long processExecutionId,
                                 ProcessExecutionStateService.TaskPlan taskPlan,
                                 Map<String, Object> configuration,
                                 String triggerSource) {
        registerTypedOutput(taskOutputs, taskPlan, configuration, "metadata",
                taskMetadata(processExecutionId, taskPlan, configuration, triggerSource));
    }

    public void registerFileRead(Map<String, Object> taskOutputs,
                                 ProcessExecutionStateService.TaskPlan taskPlan,
                                 Map<String, Object> configuration,
                                 SourcePayload sourcePayload,
                                 ReadResult readResult) {
        registerFileRead(taskOutputs, taskPlan, configuration,
                sourcePayload == null ? null : sourcePayload.file(), readResult);
    }

    /**
     * Variante por {@link SelectedSourceFile}: la usa el fast path (que no construye SourcePayload)
     * para que el `summary` incluya sourceFileName/Path/... igual que el camino normal (P2.2).
     */
    public void registerFileRead(Map<String, Object> taskOutputs,
                                 ProcessExecutionStateService.TaskPlan taskPlan,
                                 Map<String, Object> configuration,
                                 SelectedSourceFile sourceFile,
                                 ReadResult readResult) {
        var summary = new LinkedHashMap<String, Object>();
        summary.put("recordCount", readResult == null ? 0 : readResult.recordCount());
        summary.put("skippedCount", readResult == null ? 0 : readResult.skippedCount());
        if (sourceFile != null) {
            putIfPresent(summary, "sourceFileName", sourceFile.name());
            putIfPresent(summary, "sourceFilePath", sourceFile.location());
            putIfPresent(summary, "sourceMediaType", sourceFile.mediaType());
            putIfPresent(summary, "sourceFileSize", sourceFile.size());
            Instant lastModified = sourceFile.lastModified();
            putIfPresent(summary, "sourceLastModified", lastModified == null ? null : lastModified.toString());
        }
        registerTypedOutput(taskOutputs, taskPlan, configuration, "summary", summary);
        if (readResult != null && readResult.records() != null && !readResult.records().isEmpty()) {
            registerTypedOutput(taskOutputs, taskPlan, configuration, "records", readResult.records());
        }
        if (readResult != null && readResult.skippedRows() != null && !readResult.skippedRows().isEmpty()) {
            registerTypedOutput(taskOutputs, taskPlan, configuration, "errors", readResult.skippedRows());
        }
    }

    public void registerTaskResult(Map<String, Object> taskOutputs,
                                   ProcessExecutionStateService.TaskPlan taskPlan,
                                   Map<String, Object> configuration,
                                   Map<String, Object> outputs) {
        if (outputs == null || outputs.isEmpty()) {
            return;
        }
        // P2.a: las claves PLANAS (processedCount, writtenCount, targetTable...) se publican como
        // conveniencia "last-writer-wins" para tokens sin calificar y compatibilidad. NO son la
        // fuente canonica: entre tareas encadenadas con el mismo nombre se pisan. La forma
        // determinista y sin colision es la clave CALIFICADA `taskRef.<output>.<campo>` (abajo),
        // que las UIs ya emiten para outputs agregados (SP/FN P1.a, REST/Notification P1.c).
        taskOutputs.putAll(outputs);
        registerTypedOutput(taskOutputs, taskPlan, configuration, "summary", outputs);
        if (TaskType.DB_EXECUTE_SP.equals(taskPlan.taskType()) || TaskType.DB_EXECUTE_FN.equals(taskPlan.taskType())) {
            registerTypedOutput(taskOutputs, taskPlan, configuration, "out", outputs);
        }
        if (TaskType.DB_WRITE.equals(taskPlan.taskType())) {
            var targetTable = outputs.get("targetTable");
            if (targetTable != null && !String.valueOf(targetTable).isBlank()) {
                registerTypedOutput(taskOutputs, taskPlan, configuration, "table", String.valueOf(targetTable));
                // Conexion del productor: una lectura posterior de <ref>.table debe usar la conexion
                // donde se escribio la tabla, no la del consumidor (hallazgo P1.3, ADR-004).
                var connectionRef = configuration.get("connectionRef");
                if (connectionRef != null && !String.valueOf(connectionRef).isBlank()) {
                    taskOutputs.put(taskRef(taskPlan, configuration) + ".table.connectionRef", String.valueOf(connectionRef));
                }
            }
        }
    }

    public void registerTypedOutput(Map<String, Object> taskOutputs,
                                    ProcessExecutionStateService.TaskPlan taskPlan,
                                    Map<String, Object> configuration,
                                    String outputName,
                                    Object value) {
        if (taskOutputs == null || value == null || outputName == null || outputName.isBlank()) {
            return;
        }
        var taskRef = taskRef(taskPlan, configuration);
        var typedKey = taskRef + "." + outputName;
        taskOutputs.put(typedKey, value);
        if (value instanceof Map<?, ?> mapValue) {
            mapValue.forEach((key, nestedValue) -> {
                if (key != null && !String.valueOf(key).isBlank()) {
                    taskOutputs.put(typedKey + "." + key, nestedValue);
                    taskOutputs.putIfAbsent(taskRef + "." + key, nestedValue);
                }
            });
        }
    }

    public Map<String, Object> pipelineSinkOutputs(ProcessExecutionStateService.TaskPlan sinkPlan, long processedCount) {
        var outputs = new LinkedHashMap<String, Object>();
        var sinkConfiguration = configuration(sinkPlan.configurationJson());
        outputs.put("processedCount", processedCount);
        outputs.put("writtenCount", processedCount);
        var targetTable = sinkConfiguration.get("targetTable");
        if (targetTable != null && !String.valueOf(targetTable).isBlank()) {
            outputs.put("targetTable", String.valueOf(targetTable));
        }
        return outputs;
    }

    private void putIfPresent(Map<String, Object> target, String key, Object value) {
        if (value != null && !String.valueOf(value).isBlank()) {
            target.put(key, value);
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
