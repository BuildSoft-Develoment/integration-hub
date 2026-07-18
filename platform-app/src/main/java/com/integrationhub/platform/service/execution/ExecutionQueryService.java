package com.integrationhub.platform.service.execution;

// @trace RF-002, RF-003 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.mapper.execution.ExecutionApiMapper;
import com.integrationhub.platform.api.response.common.PageResponse;
import com.integrationhub.platform.api.response.execution.AuditEventResponse;
import com.integrationhub.platform.api.response.execution.AuditEventPageResponse;
import com.integrationhub.platform.api.response.execution.OverviewMetricResponse;
import com.integrationhub.platform.api.response.execution.ProcessedSourceFileResponse;
import com.integrationhub.platform.api.response.execution.OverviewSummaryResponse;
import com.integrationhub.platform.api.response.execution.ProcessExecutionResponse;
import com.integrationhub.platform.api.response.execution.ProcessTaskExecutionResponse;
import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.entity.AuditEvent;
import com.integrationhub.platform.entity.ProcessTaskExecution;
import com.integrationhub.platform.repository.AuditEventRepository;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.repository.ProcessExecutionRepository;
import com.integrationhub.platform.repository.ProcessTaskExecutionRepository;
import com.integrationhub.platform.repository.ProcessedSourceFileRepository;
import com.integrationhub.platform.repository.ReaderDefinitionRepository;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ExecutionQueryService {

    private final ProcessExecutionRepository processExecutionRepository;
    private final ProcessTaskExecutionRepository processTaskExecutionRepository;
    private final AuditEventRepository auditEventRepository;
    private final SourceDefinitionRepository sourceDefinitionRepository;
    private final ReaderDefinitionRepository readerDefinitionRepository;
    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessedSourceFileRepository processedSourceFileRepository;
    private final ExecutionApiMapper executionApiMapper;
    private final com.integrationhub.platform.service.execution.async.AsyncTaskDlqService asyncTaskDlqService;

    public ExecutionQueryService(
            ProcessExecutionRepository processExecutionRepository,
            ProcessTaskExecutionRepository processTaskExecutionRepository,
            AuditEventRepository auditEventRepository,
            SourceDefinitionRepository sourceDefinitionRepository,
            ReaderDefinitionRepository readerDefinitionRepository,
            ProcessDefinitionRepository processDefinitionRepository,
            ProcessedSourceFileRepository processedSourceFileRepository,
            ExecutionApiMapper executionApiMapper,
            com.integrationhub.platform.service.execution.async.AsyncTaskDlqService asyncTaskDlqService
    ) {
        this.processExecutionRepository = processExecutionRepository;
        this.processTaskExecutionRepository = processTaskExecutionRepository;
        this.auditEventRepository = auditEventRepository;
        this.sourceDefinitionRepository = sourceDefinitionRepository;
        this.readerDefinitionRepository = readerDefinitionRepository;
        this.processDefinitionRepository = processDefinitionRepository;
        this.processedSourceFileRepository = processedSourceFileRepository;
        this.executionApiMapper = executionApiMapper;
        this.asyncTaskDlqService = asyncTaskDlqService;
    }

    @Transactional
    public ProcessExecutionResponse getExecution(Long processExecutionId) {
        return executionApiMapper.toResponse(processExecutionRepository.findRequired(processExecutionId));
    }

    public PageResponse<ProcessExecutionResponse> listExecutions(Long processDefinitionId, String status, String queryText, String mode,
                                                                 LocalDateTime startedFrom, LocalDateTime startedTo, int page, int size) {
        var query = new StringBuilder("from ProcessExecution e where 1=1");
        var parameters = new HashMap<String, Object>();

        if (processDefinitionId != null) {
            query.append(" and e.processDefinition.id = :processDefinitionId");
            parameters.put("processDefinitionId", processDefinitionId);
        }
        if (status != null && !status.isBlank()) {
            query.append(" and e.status = :status");
            parameters.put("status", ExecutionStatus.valueOf(status.toUpperCase()));
        }
        applyExecutionMode(query, parameters, mode);
        if (queryText != null && !queryText.isBlank()) {
            applyExecutionSearch(query, parameters, queryText);
        }
        // 014: filtro por rango de fecha de inicio de la ejecucion (startedAt).
        if (startedFrom != null) {
            query.append(" and e.startedAt >= :startedFrom");
            parameters.put("startedFrom", startedFrom);
        }
        if (startedTo != null) {
            query.append(" and e.startedAt <= :startedTo");
            parameters.put("startedTo", startedTo);
        }
        query.append(" order by e.id desc");

        var result = processExecutionRepository.findExecutions(query.toString(), parameters);
        var total = result.count();
        result.page(page, size);
        return new PageResponse<>(
                total,
                result.list().stream().map(executionApiMapper::toResponse).collect(Collectors.toList())
        );
    }

    private void applyExecutionSearch(StringBuilder query, HashMap<String, Object> parameters, String queryText) {
        var normalized = queryText.trim().toLowerCase();
        query.append(" and (lower(e.processDefinition.name) like :queryText");
        parameters.put("queryText", "%" + normalized + "%");
        if (normalized.chars().allMatch(Character::isDigit)) {
            query.append(" or e.id = :searchId or e.processDefinition.id = :searchId");
            parameters.put("searchId", Long.valueOf(normalized));
        }
        query.append(")");
    }

    private void applyExecutionMode(StringBuilder query, HashMap<String, Object> parameters, String mode) {
        if (mode == null || mode.isBlank() || "ALL".equalsIgnoreCase(mode)) {
            return;
        }

        if ("SCHEDULED".equalsIgnoreCase(mode)) {
            query.append(" and e.triggerSource = :scheduledTriggerSource");
            parameters.put("scheduledTriggerSource", "SCHEDULED");
            return;
        }

        if ("MANUAL".equalsIgnoreCase(mode)) {
            query.append(" and (e.triggerSource is null or e.triggerSource <> :scheduledTriggerSource)");
            parameters.put("scheduledTriggerSource", "SCHEDULED");
        }
    }

    @Transactional
    public List<ProcessExecutionResponse> getExecutionChildren(Long processExecutionId) {
        return processExecutionRepository.findChildrenBySourceExecutionId(processExecutionId).list().stream()
                .map(executionApiMapper::toResponse)
                .toList();
    }

    public List<ProcessTaskExecutionResponse> listTaskExecutions(Long processExecutionId) {
        var query = processTaskExecutionRepository.findByProcessExecutionId(processExecutionId);
        return query.list().stream()
                .map(this::toTaskExecutionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AuditEventPageResponse listAuditEvents(Long processExecutionId, Long taskDefinitionId, String eventType, String status,
                                                  String queryText, LocalDateTime createdFrom, LocalDateTime createdTo, int page, int size) {
        var query = new StringBuilder("from AuditEvent e where 1=1");
        var parameters = new HashMap<String, Object>();

        if (processExecutionId != null) {
            query.append(" and e.processExecution.id = :processExecutionId");
            parameters.put("processExecutionId", processExecutionId);
        }
        if (taskDefinitionId != null) {
            query.append(" and e.taskDefinition.id = :taskDefinitionId");
            parameters.put("taskDefinitionId", taskDefinitionId);
        }
        if (eventType != null && !eventType.isBlank()) {
            query.append(" and e.eventType = :eventType");
            parameters.put("eventType", eventType);
        }
        if (status != null && !status.isBlank()) {
            query.append(" and e.status = :status");
            parameters.put("status", status.toUpperCase());
        }
        if (queryText != null && !queryText.isBlank()) {
            var normalized = queryText.trim().toLowerCase();
            query.append(" and (lower(e.eventType) like :queryText or lower(coalesce(e.message, '')) like :queryText");
            parameters.put("queryText", "%" + normalized + "%");

            if (normalized.chars().allMatch(Character::isDigit)) {
                query.append(" or e.id = :searchId or e.processExecution.id = :searchId or e.taskDefinition.id = :searchId");
                parameters.put("searchId", Long.valueOf(normalized));
            }
            query.append(")");
        }
        if (createdFrom != null) {
            query.append(" and e.createdAt >= :createdFrom");
            parameters.put("createdFrom", createdFrom);
        }
        if (createdTo != null) {
            query.append(" and e.createdAt <= :createdTo");
            parameters.put("createdTo", createdTo);
        }
        query.append(" order by e.id desc");

        var result = auditEventRepository.findAuditEvents(query.toString(), parameters);
        var total = result.count();
        result.page(page, size);
        return new AuditEventPageResponse(
                total,
                result.list().stream().map(this::toAuditEventResponse).collect(Collectors.toList()),
                auditEventRepository.listEventTypes()
        );
    }

    @Transactional
    public OverviewSummaryResponse overviewSummary() {
        var sources = new OverviewMetricResponse(
                "Sources",
                sourceDefinitionRepository.count(),
                sourceDefinitionRepository.count("active", true)
        );
        var readers = new OverviewMetricResponse(
                "Readers",
                readerDefinitionRepository.count(),
                readerDefinitionRepository.count("active", true)
        );
        var processes = new OverviewMetricResponse(
                "Processes",
                processDefinitionRepository.count(),
                processDefinitionRepository.count("active", true)
        );

        var scheduledProcesses = processDefinitionRepository.countActiveScheduled();
        var runningExecutions = processExecutionRepository.count("status", ExecutionStatus.RUNNING);
        var failedExecutions = processExecutionRepository.count("status in ?1", java.util.List.of(ExecutionStatus.FAILED, ExecutionStatus.COMPLETED_WITH_ERRORS));
        var completedWithErrorsExecutions = processExecutionRepository.count("status", ExecutionStatus.COMPLETED_WITH_ERRORS);
        var retryExecutions = processExecutionRepository.countByTriggerSource("MANUAL_RETRY_FAILED");
        var failedProcessedFiles = processedSourceFileRepository.countByStatus("FAILED");
        var pendingProcessedFiles = processedSourceFileRepository.countByStatus("PENDING");
        // Salud del backbone async: mismo umbral de estancamiento (5 min) que la consola DLQ.
        var asyncHealth = asyncTaskDlqService.health(java.time.Duration.ofMinutes(5));

        var recentExecutions = processExecutionRepository.findRecent(0, 5).list().stream()
                .map(executionApiMapper::toResponse)
                .toList();

        var recentAuditEvents = auditEventRepository.findRecent(0, 5).list().stream()
                .map(this::toAuditEventResponse)
                .toList();

        var failedExecutionHighlights = processExecutionRepository.findRecentFailed(0, 5).list().stream()
                .map(executionApiMapper::toResponse)
                .toList();

        return new OverviewSummaryResponse(
                sources,
                readers,
                processes,
                scheduledProcesses,
                runningExecutions,
                failedExecutions,
                completedWithErrorsExecutions,
                retryExecutions,
                failedProcessedFiles,
                pendingProcessedFiles,
                asyncHealth.dead(),
                asyncHealth.stalled(),
                recentExecutions,
                recentAuditEvents,
                failedExecutionHighlights
        );
    }

    private ProcessTaskExecutionResponse toTaskExecutionResponse(ProcessTaskExecution taskExecution) {
        return executionApiMapper.toResponse(
                taskExecution,
                taskPayloadJson(taskExecution.processExecution.id, taskExecution.taskDefinition.id),
                processedFiles(taskExecution.processExecution.id, taskExecution.taskDefinition.id)
        );
    }

    private AuditEventResponse toAuditEventResponse(AuditEvent auditEvent) {
        var processExecutionId = auditEvent.processExecution != null ? auditEvent.processExecution.id : null;
        var taskDefinitionId = auditEvent.taskDefinition != null ? auditEvent.taskDefinition.id : null;
        return executionApiMapper.toResponse(
                auditEvent,
                processExecutionId != null && taskDefinitionId != null ? processedFiles(processExecutionId, taskDefinitionId) : List.of()
        );
    }
    private String taskPayloadJson(Long processExecutionId, Long taskDefinitionId) {
        return auditEventRepository.findLatestTaskPayload(processExecutionId, taskDefinitionId);
    }


    private List<ProcessedSourceFileResponse> processedFiles(Long processExecutionId, Long taskDefinitionId) {
        return processedSourceFileRepository.findByExecutionAndTask(processExecutionId, taskDefinitionId)
                .list()
                .stream()
                .map(file -> new ProcessedSourceFileResponse(
                        file.id,
                        file.fileName,
                        file.filePath,
                        file.mediaType,
                        file.fileSize,
                        file.lastModified,
                        file.status,
                        file.recordCount,
                        file.skippedCount,
                        file.writtenCount,
                        file.errorMessage
                ))
                .toList();
    }
}
