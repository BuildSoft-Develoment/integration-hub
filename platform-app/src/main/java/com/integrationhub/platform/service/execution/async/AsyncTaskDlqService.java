package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskDispatchOutbox;
import com.integrationhub.platform.entity.TaskInbox;
import com.integrationhub.platform.repository.ProcessTaskExecutionRepository;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.repository.TaskDispatchOutboxRepository;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

/**
 * Operaciones de DLQ y recuperación del pipeline async (ADR-015, grupo 3: 3c + 3a). Da visibilidad de
 * los estados muertos y dos redrives seguros:
 * <ul>
 *   <li><b>Outbox</b>: reanima filas {@code DEAD} (falló la publicación) a {@code PENDING} → el relay
 *       reintenta. Idempotente aguas abajo por idempotencyKey.</li>
 *   <li><b>Suspensión colgada</b> (3a): reconstruye el work-item de una tarea async aún suspendida y
 *       lo re-encola (limpiando el dedup del inbox), para procesos atascados por un item que murió en
 *       el consumer (tipo/config) o cuya trama se perdió. Como no hay expiry en suspensiones async, es
 *       la red de recuperación.</li>
 * </ul>
 */
@ApplicationScoped
public class AsyncTaskDlqService {

    private static final Logger LOG = Logger.getLogger(AsyncTaskDlqService.class);

    private final TaskDispatchOutboxRepository outboxRepository;
    private final TaskInboxRepository inboxRepository;
    private final TaskAsyncDispatchRepository scatterTracker;
    private final ProcessTaskExecutionRepository taskExecutionRepository;
    private final JsonConfigurationMapper configurationMapper;
    private final TaskDispatchPlanner planner;
    private final AsyncTaskDispatchService dispatchService;
    private final TaskOutboxStore outboxStore;

    @Inject
    public AsyncTaskDlqService(TaskDispatchOutboxRepository outboxRepository,
                              TaskInboxRepository inboxRepository,
                              TaskAsyncDispatchRepository scatterTracker,
                              ProcessTaskExecutionRepository taskExecutionRepository,
                              JsonConfigurationMapper configurationMapper,
                              TaskDispatchPlanner planner,
                              AsyncTaskDispatchService dispatchService,
                              TaskOutboxStore outboxStore) {
        this.outboxRepository = outboxRepository;
        this.inboxRepository = inboxRepository;
        this.scatterTracker = scatterTracker;
        this.taskExecutionRepository = taskExecutionRepository;
        this.configurationMapper = configurationMapper;
        this.planner = planner;
        this.dispatchService = dispatchService;
        this.outboxStore = outboxStore;
    }

    @Transactional
    public DlqSummary summary() {
        return new DlqSummary(
                outboxRepository.countByStatus(TaskDispatchOutbox.DEAD),
                inboxRepository.countByStatus(TaskInbox.DEAD),
                inboxRepository.countByStatus(TaskInbox.POISON));
    }

    /** Reanima hasta {@code limit} filas DEAD del outbox a PENDING para que el relay reintente. */
    @Transactional
    public long redriveOutboxDead(int limit) {
        var redriven = outboxRepository.redriveDead(limit);
        if (redriven > 0) {
            LOG.infof("Async DLQ: redrive de %d filas DEAD del outbox → PENDING", redriven);
        }
        return redriven;
    }

    /**
     * Re-encola el work-item de una tarea async aún suspendida (recuperación 3a). Reconstruye el
     * envelope determinista desde la configuración de la tarea, limpia el registro de dedup del inbox
     * (para que un DEAD previo no bloquee) y encola. Devuelve {@code false} si no hay suspensión activa.
     */
    @Transactional
    public boolean requeueSuspension(Long processExecutionId, Long taskDefinitionId) {
        var taskExecution = taskExecutionRepository.findActiveSuspendedByExecutionAndTask(
                processExecutionId, taskDefinitionId);
        if (taskExecution == null || taskExecution.taskDefinition == null) {
            return false;
        }
        // Una tarea scatter (Opción B) no se re-encola como per-task: eso completaría la tarea sin
        // procesar sus records. Su recuperación es redrive de las slices muertas (outbox/inbox).
        if (scatterTracker.findByExecutionAndTask(processExecutionId, taskDefinitionId).isPresent()) {
            LOG.warnf("Async DLQ: exec=%d task=%d es un scatter; usar redrive de slices, no requeue per-task",
                    processExecutionId, taskDefinitionId);
            return false;
        }
        var definition = taskExecution.taskDefinition;
        var configuration = configurationMapper.toMap(definition.configurationJson);
        var plan = planner.plan(configuration);
        var transport = plan.isAsync() ? plan.transport() : TaskDispatchPlanner.DEFAULT_TRANSPORT;
        var envelope = dispatchService.buildEnvelope(
                processExecutionId, taskDefinitionId, definition.taskType, transport, configuration);

        // Limpia el dedup en ambos lados: la fila previa del outbox (cualquier estado) bloquearía el
        // enqueue por idempotencyKey, y una fila DEAD/POISON del inbox bloquearía el reproceso.
        outboxRepository.deleteByIdempotencyKey(envelope.idempotencyKey());
        inboxRepository.deleteByIdempotencyKey(envelope.idempotencyKey());
        outboxStore.enqueue(envelope);
        LOG.infof("Async DLQ: re-encolada suspensión exec=%d task=%d (key=%s)",
                processExecutionId, taskDefinitionId, envelope.idempotencyKey());
        return true;
    }

    public record DlqSummary(long outboxDead, long inboxDead, long inboxPoison) {
    }
}
