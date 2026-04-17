package com.integrationhub.platform.service.process;

import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.service.execution.AuditService;
import com.integrationhub.platform.service.execution.ProcessExecutionService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

@ApplicationScoped
public class ProcessSchedulerService {

    private static final Logger LOG = Logger.getLogger(ProcessSchedulerService.class);

    private final ProcessExecutionService processExecutionService;
    private final AuditService auditService;
    private final ProcessDefinitionRepository processDefinitionRepository;

    public ProcessSchedulerService(
            ProcessExecutionService processExecutionService,
            AuditService auditService,
            ProcessDefinitionRepository processDefinitionRepository
    ) {
        this.processExecutionService = processExecutionService;
        this.auditService = auditService;
        this.processDefinitionRepository = processDefinitionRepository;
    }

    @Scheduled(every = "{integrationhub.scheduler.poll-every:30s}")
    @Transactional
    void pollScheduledProcesses() {
        var now = LocalDateTime.now();
        var dueProcesses = processDefinitionRepository.listDueScheduled(now);

        for (var definition : dueProcesses) {
            try {
                LOG.infov("Running scheduled process {0} ({1})", definition.name, definition.id);
                processExecutionService.execute(definition.id, Map.of(), "SCHEDULED");
                definition.lastRunAt = now;
                definition.nextRunAt = now.plus(parseEvery(definition.scheduleEvery));
                auditService.record((Long) null, (Long) null, "PROCESS_SCHEDULED_EXECUTION", "COMPLETED",
                        "Scheduled execution completed for process " + definition.name,
                        Map.of("processDefinitionId", definition.id, "scheduleEvery", definition.scheduleEvery));
            } catch (Exception e) {
                definition.nextRunAt = now.plus(parseEvery(definition.scheduleEvery));
                auditService.record((Long) null, (Long) null, "PROCESS_SCHEDULED_EXECUTION", "FAILED",
                        "Scheduled execution failed for process " + definition.name + ": " + e.getMessage(),
                        Map.of("processDefinitionId", definition.id, "scheduleEvery", definition.scheduleEvery));
                LOG.errorv(e, "Scheduled execution failed for process {0} ({1})", definition.name, definition.id);
            }
        }
    }

    Duration parseEvery(String scheduleEvery) {
        if (scheduleEvery == null || scheduleEvery.isBlank()) {
            throw new IllegalArgumentException("scheduleEvery is required for scheduled processes");
        }
        return Duration.parse("PT" + scheduleEvery.trim().toUpperCase());
    }
}
