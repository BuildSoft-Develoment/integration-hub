package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskDispatchOutbox;
import com.integrationhub.platform.entity.TaskInbox;
import com.integrationhub.platform.repository.ProcessTaskExecutionRepository;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.repository.TaskDispatchOutboxRepository;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.Map;

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

    /** Self-referencia (proxy CDI) para invocar {@code requeueSuspension} con su PROPIA transacción por
     *  item en el sweep — una self-invocation directa bypassaría el interceptor @Transactional y correría
     *  todo en una sola tx (un fallo rollbackearía todo el barrido). */
    @Inject
    AsyncTaskDlqService self;

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

    /**
     * Salud agregada del backbone async para el tile del overview: total de filas muertas
     * (outbox+inbox+poison) y scatters streaming estancados. Contadores baratos (sin cargar filas).
     */
    @Transactional
    public DlqHealth health(java.time.Duration stallThreshold) {
        var s = summary();
        var cutoff = java.time.LocalDateTime.now().minus(stallThreshold);
        return new DlqHealth(
                s.outboxDead() + s.inboxDead() + s.inboxPoison(),
                scatterTracker.countStalledStreaming(cutoff));
    }

    /** Filas muertas del consumer (DEAD/POISON) para la consola de DLQ. */
    @Transactional
    public java.util.List<DeadTask> listDead(int limit) {
        return inboxRepository.findDead(limit).stream()
                .map(r -> new DeadTask(r.id, r.idempotencyKey, r.taskType, r.processExecutionId,
                        r.taskDefinitionId, r.status, r.error))
                .toList();
    }

    /** Scatters en streaming estancados (candidatos a re-inyección) para la consola de DLQ. */
    @Transactional
    public java.util.List<StalledScatter> listStalled(java.time.Duration stallThreshold, int limit) {
        var cutoff = java.time.LocalDateTime.now().minus(stallThreshold);
        return scatterTracker.findStalledStreaming(cutoff, limit).stream()
                .map(t -> new StalledScatter(t.processExecutionId, t.taskDefinitionId, t.completedSlices,
                        t.failedSlices, t.lastPageIndex, t.lastProgressAt))
                .toList();
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
        var definition = taskExecution.taskDefinition;
        var configuration = configurationMapper.toMap(definition.configurationJson);
        var plan = planner.plan(configuration);
        var transport = plan.isAsync() ? plan.transport() : TaskDispatchPlanner.DEFAULT_TRANSPORT;

        var scatter = scatterTracker.findByExecutionAndTask(processExecutionId, taskDefinitionId);
        if (scatter.isPresent()) {
            var tracker = scatter.get();
            if (tracker.lastPageJson != null) {
                // Scatter en streaming (page-chain): la cadena se rompe si una página muere sin encolar su
                // sucesora. Se re-inyecta la ÚLTIMA página despachada (persistida en el tracker) → al
                // re-correr, encola su sucesora y la cadena reanuda. Idempotente por su idempotencyKey.
                return requeueStreamingPage(processExecutionId, taskDefinitionId, definition.taskType, transport,
                        tracker.lastPageIndex, tracker.lastPageJson);
            }
            // Scatter materializado (Opción B): no se re-encola como per-task (completaría sin procesar los
            // records). Su recuperación es redrive de las slices muertas (outbox/inbox).
            LOG.warnf("Async DLQ: exec=%d task=%d es un scatter materializado; usar redrive de slices",
                    processExecutionId, taskDefinitionId);
            return false;
        }
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

    /**
     * Auto-recuperación (ADR-015): busca scatters en streaming <b>estancados</b> (PENDING sin progreso por
     * &gt; {@code stallThreshold}) y re-inyecta su última página vía {@link #requeueSuspension}. Devuelve
     * cuántos re-inyectó. Idempotente/seguro: si el scatter progresó, completó o falló, {@code
     * requeueSuspension} no hace nada (o el consumer cortocircuita por {@code isScatterTerminal}).
     */
    public int recoverStalledStreamingScatters(java.time.Duration stallThreshold, int limit) {
        var cutoff = java.time.LocalDateTime.now().minus(stallThreshold);
        var recovered = 0;
        // Cada requeue via el proxy (self) → su PROPIA transacción: un scatter que falle no rollbackea el
        // resto del barrido. Con try/catch per-item la robustez es total (un item malo no bloquea a los otros).
        for (var pair : self.findStalledStreamingScatters(cutoff, limit)) {
            try {
                if (self.requeueSuspension(pair[0], pair[1])) {
                    recovered++;
                }
            } catch (RuntimeException error) {
                LOG.warnf(error, "Async DLQ: recovery de exec=%d task=%d falló; se reintenta en el próximo sweep",
                        pair[0], pair[1]);
            }
        }
        if (recovered > 0) {
            LOG.warnf("Async DLQ: auto-recuperados %d scatter(s) streaming estancados (> %s sin progreso)",
                    recovered, stallThreshold);
        }
        return recovered;
    }

    /** IDs {@code [processExecutionId, taskDefinitionId]} de los scatters streaming estancados. */
    @Transactional
    public java.util.List<long[]> findStalledStreamingScatters(java.time.LocalDateTime cutoff, int limit) {
        return scatterTracker.findStalledStreaming(cutoff, limit).stream()
                .map(t -> new long[]{t.processExecutionId, t.taskDefinitionId})
                .toList();
    }

    /** Re-inyecta la última página despachada de un scatter en streaming, limpiando su dedup. */
    private boolean requeueStreamingPage(Long processExecutionId, Long taskDefinitionId, String taskType,
                                         String transport, Integer pageIndex, String pageJson) {
        var idx = pageIndex == null ? 0 : pageIndex;
        var idempotencyKey = TaskIdempotency.key(processExecutionId, taskDefinitionId, "page-" + idx);
        // Limpia el dedup para permitir el reproceso (una fila previa bloquearía el enqueue/consumo).
        outboxRepository.deleteByIdempotencyKey(idempotencyKey);
        inboxRepository.deleteByIdempotencyKey(idempotencyKey);
        var traceId = "exec-" + processExecutionId;
        var envelope = new AsyncTaskEnvelope(traceId, processExecutionId, taskDefinitionId, taskType, transport,
                idempotencyKey, 1, pageJson,
                Map.of("traceId", traceId, "kind", "PAGE", "pageIndex", String.valueOf(idx)));
        outboxStore.enqueue(envelope);
        // Marca actividad: evita que el auto-resume vuelva a disparar antes de que la página re-inyectada
        // tenga chance de procesarse.
        scatterTracker.touchProgress(processExecutionId, taskDefinitionId);
        LOG.infof("Async DLQ: re-inyectada página %d del scatter streaming exec=%d task=%d (la cadena reanuda)",
                idx, processExecutionId, taskDefinitionId);
        return true;
    }

    public record DlqSummary(long outboxDead, long inboxDead, long inboxPoison) {
    }

    /** Salud agregada del backbone async para el tile del overview. */
    public record DlqHealth(long dead, long stalled) {
    }

    /** Fila muerta del consumer para la consola de DLQ (dedup por idempotencyKey). */
    public record DeadTask(Long id, String idempotencyKey, String taskType, Long processExecutionId,
                           Long taskDefinitionId, String status, String error) {
    }

    /** Scatter en streaming estancado (sin progreso por &gt; umbral): candidato a re-inyección. */
    public record StalledScatter(Long processExecutionId, Long taskDefinitionId, int completed, int failed,
                                 Integer lastPageIndex, java.time.LocalDateTime lastProgressAt) {
    }
}
