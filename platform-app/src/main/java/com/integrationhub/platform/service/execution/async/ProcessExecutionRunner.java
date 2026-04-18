package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.execution.ProcessExecutionService;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import org.jboss.logging.Logger;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessExecutionRunner {

    private static final Logger LOG = Logger.getLogger(ProcessExecutionRunner.class);

    private final ProcessExecutionStateService processExecutionStateService;
    private final ProcessExecutionService processExecutionService;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    public ProcessExecutionRunner(ProcessExecutionStateService processExecutionStateService,
                                  ProcessExecutionService processExecutionService,
                                  JsonConfigurationMapper jsonConfigurationMapper) {
        this.processExecutionStateService = processExecutionStateService;
        this.processExecutionService = processExecutionService;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    @ActivateRequestContext
    public void run(Long processExecutionId) {
        var execution = processExecutionStateService.loadQueuedExecution(processExecutionId);
        var payload = jsonConfigurationMapper.toMap(execution.requestPayloadJson());
        var executionVariables = stringMap(payload.get("executionVariables"));
        var selectedFiles = stringList(payload.get("selectedFiles"));

        LOG.infov(
                "Starting background process execution {0} for process definition {1} trigger={2} selectedFiles={3}",
                execution.processExecutionId(),
                execution.processDefinitionId(),
                execution.triggerSource(),
                selectedFiles.size()
        );
        try {
            processExecutionService.executeQueued(
                    execution.processExecutionId(),
                    execution.processDefinitionId(),
                    executionVariables,
                    selectedFiles,
                    execution.triggerSource()
            );
            LOG.infov(
                    "Background process execution {0} completed for process definition {1}",
                    execution.processExecutionId(),
                    execution.processDefinitionId()
            );
        } catch (Exception e) {
            LOG.errorv(e,
                    "Background process execution {0} failed for process definition {1}",
                    execution.processExecutionId(),
                    execution.processDefinitionId());
            throw e;
        }
    }

    private Map<String, String> stringMap(Object rawValue) {
        if (!(rawValue instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }
        var normalized = new LinkedHashMap<String, String>();
        rawMap.forEach((key, value) -> {
            if (key == null || value == null) {
                return;
            }
            var normalizedKey = String.valueOf(key).trim();
            var normalizedValue = String.valueOf(value).trim();
            if (!normalizedKey.isBlank() && !normalizedValue.isBlank()) {
                normalized.put(normalizedKey, normalizedValue);
            }
        });
        return Map.copyOf(normalized);
    }

    private List<String> stringList(Object rawValue) {
        if (!(rawValue instanceof List<?> rawList)) {
            return List.of();
        }
        return rawList.stream()
                .filter(value -> value != null && !String.valueOf(value).isBlank())
                .map(value -> String.valueOf(value).trim())
                .distinct()
                .toList();
    }
}
