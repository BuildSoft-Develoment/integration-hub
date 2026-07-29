package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.context.ManagedExecutor;
import com.integrationhub.platform.service.TaskProviderRegistry;
import org.jboss.logging.Logger;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

@ApplicationScoped
public class BackgroundProcessExecutionDispatcher {

    private static final Logger LOG = Logger.getLogger(BackgroundProcessExecutionDispatcher.class);

    private final ProcessExecutionStateService processExecutionStateService;
    private final ProcessExecutionRunner processExecutionRunner;
    private final ManagedExecutor managedExecutor;
    private final TaskProviderRegistry taskProviderRegistry;
    private final int maxConcurrentExecutions;
    private final int maxPendingExecutions;
    private final int leaseSeconds;
    private final int recoveryLimit;
    private final AtomicInteger activeExecutions = new AtomicInteger();
    private final Object dispatchMonitor = new Object();
    // v53-fix (#8): identidad de ESTE nodo (owner del claim) + ejecuciones que este nodo tiene activas (id -> token)
    // para renovar su lease (heartbeat) mientras corren, de modo que la recuperacion no las reclame por error.
    private final String nodeId = "node-" + UUID.randomUUID();
    private final ConcurrentMap<Long, String> activeLeases = new ConcurrentHashMap<>();

    public BackgroundProcessExecutionDispatcher(ProcessExecutionStateService processExecutionStateService,
                                                ProcessExecutionRunner processExecutionRunner,
                                                ManagedExecutor managedExecutor,
                                                TaskProviderRegistry taskProviderRegistry,
                                                @ConfigProperty(name = "integrationhub.execution.async.max-concurrent", defaultValue = "2") int maxConcurrentExecutions,
                                                @ConfigProperty(name = "integrationhub.execution.async.max-pending", defaultValue = "20") int maxPendingExecutions,
                                                @ConfigProperty(name = "integrationhub.execution.async.lease-seconds", defaultValue = "30") int leaseSeconds,
                                                @ConfigProperty(name = "integrationhub.execution.async.recovery-limit", defaultValue = "50") int recoveryLimit) {
        this.processExecutionStateService = processExecutionStateService;
        this.processExecutionRunner = processExecutionRunner;
        this.managedExecutor = managedExecutor;
        this.taskProviderRegistry = taskProviderRegistry;
        this.maxConcurrentExecutions = Math.max(maxConcurrentExecutions, 1);
        this.maxPendingExecutions = Math.max(maxPendingExecutions, 1);
        this.leaseSeconds = Math.max(leaseSeconds, 2);
        this.recoveryLimit = Math.max(recoveryLimit, 1);
    }

    public boolean canQueueExecution() {
        return processExecutionStateService.countPendingProcesses() < maxPendingExecutions;
    }

    public void dispatchPendingExecutions() {
        synchronized (dispatchMonitor) {
            while (activeExecutions.get() < maxConcurrentExecutions) {
                var availableSlots = maxConcurrentExecutions - activeExecutions.get();
                var pendingExecutionIds = processExecutionStateService.listPendingProcessExecutionIds(availableSlots);
                if (pendingExecutionIds.isEmpty()) {
                    return;
                }

                var dispatchedAny = false;
                for (var processExecutionId : pendingExecutionIds) {
                    if (activeExecutions.get() >= maxConcurrentExecutions) {
                        break;
                    }
                    // v53-fix: claim ATOMICO distribuido. Solo si ESTE nodo gana el UPDATE ... WHERE status='PENDING'
                    // se despacha; en cluster los demas nodos ven 0 filas y siguen (sin doble dispatch).
                    var token = UUID.randomUUID().toString();
                    if (!processExecutionStateService.claimProcessForExecution(processExecutionId, nodeId, token, leaseSeconds)) {
                        continue;
                    }
                    activeLeases.put(processExecutionId, token);
                    dispatchedAny = true;
                    LOG.infov(
                            "Dispatching queued process execution {0} claimed by {1}. activeExecutions={2}/{3}",
                            processExecutionId, nodeId, activeExecutions.get(), maxConcurrentExecutions);
                    submit(processExecutionId, token);
                }

                if (!dispatchedAny) {
                    return;
                }
            }
        }
    }

    @Scheduled(every = "{integrationhub.execution.async.dispatch-every:2s}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void pumpPendingExecutions() {
        renewActiveLeases();
        dispatchPendingExecutions();
    }

    /** v53-fix: heartbeat — renueva el lease de las ejecuciones que este nodo tiene activas (evita falso-reclamo). */
    private void renewActiveLeases() {
        for (var entry : activeLeases.entrySet()) {
            try {
                processExecutionStateService.renewExecutionLease(entry.getKey(), entry.getValue(), leaseSeconds);
            } catch (RuntimeException error) {
                LOG.warnv(error, "Could not renew lease for active execution {0}", entry.getKey());
            }
        }
    }

    /**
     * v53-fix: barrido de recuperacion de ejecuciones RUNNING huerfanas (lease vencido = nodo caido). Las que ya
     * iniciaron PAY pasan a NEEDS_RECONCILIATION (nunca re-ejecucion a ciegas); las demas se re-encolan.
     */
    @Scheduled(every = "{integrationhub.execution.async.recovery-every:30s}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void recoverOrphanedExecutions() {
        try {
            // ADR-021 (E): ya no hace falta pasarle los tipos. La decision "esta tarea movio dinero" se
            // tomo AL ARRANCAR cada tarea —con el provider y la config a la vista, incluida la entrega a
            // una fuente marcada como critica— y quedo persistida. Pasar los tipos aca obligaba a
            // re-derivarla de la definicion ACTUAL, que pudo cambiar entre la caida y este barrido.
            var recovered = processExecutionStateService.recoverExpiredExecutions(recoveryLimit);
            if (recovered > 0) {
                LOG.infov("Recovered {0} orphaned process execution(s) with expired lease", recovered);
            }
        } catch (RuntimeException error) {
            LOG.warnv(error, "Orphaned process execution recovery sweep failed");
        }
    }

    private void submit(Long processExecutionId, String executionToken) {
        var activeNow = activeExecutions.incrementAndGet();
        LOG.infov(
                "Submitting queued process execution {0} to background executor. activeExecutions={1}/{2}",
                processExecutionId, activeNow, maxConcurrentExecutions);
        managedExecutor.runAsync(() -> {
            try {
                processExecutionRunner.run(processExecutionId, executionToken);
            } catch (com.integrationhub.platform.service.execution.FencingTokenLostException fence) {
                // P2: el lease venció y otro nodo recuperó la ejecución; este worker zombi abortó sin tocar estado.
                LOG.warnv("Queued process execution {0} aborted: fencing token lost (recovered by another node)",
                        processExecutionId);
            } catch (Exception e) {
                LOG.errorv(e, "Queued process execution {0} failed during background run", processExecutionId);
            } finally {
                activeLeases.remove(processExecutionId);
                var remaining = activeExecutions.decrementAndGet();
                LOG.infov(
                        "Background execution {0} finished. activeExecutions={1}/{2}",
                        processExecutionId, remaining, maxConcurrentExecutions);
                dispatchPendingExecutions();
            }
        });
    }
}
