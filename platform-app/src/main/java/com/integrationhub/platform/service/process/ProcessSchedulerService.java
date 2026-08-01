package com.integrationhub.platform.service.process;

// @trace spec 006-programacion-procesos RF-002, RF-004 (la matriz de 006 declara esta clase para ambos)
// @trace RF-003 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.service.execution.AuditService;
import com.integrationhub.platform.service.execution.ProcessExecutionCommandService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessSchedulerService {

    private static final Logger LOG = Logger.getLogger(ProcessSchedulerService.class);

    private final ProcessExecutionCommandService processExecutionCommandService;
    private final AuditService auditService;
    private final ProcessDefinitionRepository processDefinitionRepository;

    public ProcessSchedulerService(
            ProcessExecutionCommandService processExecutionCommandService,
            AuditService auditService,
            ProcessDefinitionRepository processDefinitionRepository
    ) {
        this.processExecutionCommandService = processExecutionCommandService;
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
                LOG.infov("Queueing scheduled process {0} ({1})", definition.name, definition.id);
                var execution = processExecutionCommandService.startAsync(definition.id, Map.of(), List.of(), null, "SCHEDULED");
                definition.lastRunAt = now;
                definition.nextRunAt = now.plus(parseEvery(definition.scheduleEvery));
                auditService.record((Long) null, (Long) null, "PROCESS_SCHEDULED_EXECUTION", "PENDING",
                        "Scheduled execution queued for process " + definition.name,
                        Map.of("processDefinitionId", definition.id, "processExecutionId", execution.id, "scheduleEvery", definition.scheduleEvery));
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
