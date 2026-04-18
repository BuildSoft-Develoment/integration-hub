package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.execution.async.BackgroundProcessExecutionDispatcher;
import com.integrationhub.platform.service.execution.async.QueuedProcessExecutionPayload;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessExecutionCommandService {

    private static final Logger LOG = Logger.getLogger(ProcessExecutionCommandService.class);

    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessExecutionStateService processExecutionStateService;
    private final BackgroundProcessExecutionDispatcher backgroundDispatcher;
    private final JsonConfigurationMapper jsonConfigurationMapper;

    public ProcessExecutionCommandService(ProcessDefinitionRepository processDefinitionRepository,
                                         ProcessExecutionStateService processExecutionStateService,
                                         BackgroundProcessExecutionDispatcher backgroundDispatcher,
                                         JsonConfigurationMapper jsonConfigurationMapper) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processExecutionStateService = processExecutionStateService;
        this.backgroundDispatcher = backgroundDispatcher;
        this.jsonConfigurationMapper = jsonConfigurationMapper;
    }

    public ProcessExecution startAsync(Long processDefinitionId,
                                       Map<String, String> executionVariables,
                                       List<String> selectedFiles,
                                       Long sourceExecutionId,
                                       String triggerSource) {
        if (!backgroundDispatcher.canQueueExecution()) {
            LOG.warnv("Process execution request rejected because the async queue is full for process definition {0}", processDefinitionId);
            throw new IllegalStateException("Execution queue is full. Try again when pending executions decrease.");
        }

        var normalizedExecutionVariables = executionVariables == null ? Map.<String, String>of() : Map.copyOf(executionVariables);
        var normalizedSelectedFiles = selectedFiles == null
                ? List.<String>of()
                : selectedFiles.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        var normalizedTriggerSource = triggerSource == null || triggerSource.isBlank() ? "MANUAL" : triggerSource;

        var definition = processDefinitionRepository.findRequired(processDefinitionId);
        var payloadJson = jsonConfigurationMapper.toJson(
                new QueuedProcessExecutionPayload(normalizedExecutionVariables, normalizedSelectedFiles)
        );
        var processExecutionId = processExecutionStateService.queueProcess(
                definition.id,
                definition.name,
                sourceExecutionId,
                normalizedTriggerSource,
                payloadJson
        );
        LOG.infov(
                "Queued process execution {0} for process definition {1} ({2}) trigger={3} selectedFiles={4}",
                processExecutionId,
                definition.id,
                definition.name,
                normalizedTriggerSource,
                normalizedSelectedFiles.size()
        );
        backgroundDispatcher.dispatchPendingExecutions();
        return processExecutionStateService.getExecution(processExecutionId);
    }
}
