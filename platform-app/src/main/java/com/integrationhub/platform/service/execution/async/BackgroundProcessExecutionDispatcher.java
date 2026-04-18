package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;

import java.util.concurrent.atomic.AtomicInteger;

@ApplicationScoped
public class BackgroundProcessExecutionDispatcher {

    private static final Logger LOG = Logger.getLogger(BackgroundProcessExecutionDispatcher.class);

    private final ProcessExecutionStateService processExecutionStateService;
    private final ProcessExecutionRunner processExecutionRunner;
    private final ManagedExecutor managedExecutor;
    private final int maxConcurrentExecutions;
    private final int maxPendingExecutions;
    private final AtomicInteger activeExecutions = new AtomicInteger();
    private final Object dispatchMonitor = new Object();

    public BackgroundProcessExecutionDispatcher(ProcessExecutionStateService processExecutionStateService,
                                                ProcessExecutionRunner processExecutionRunner,
                                                ManagedExecutor managedExecutor,
                                                @ConfigProperty(name = "integrationhub.execution.async.max-concurrent", defaultValue = "2") int maxConcurrentExecutions,
                                                @ConfigProperty(name = "integrationhub.execution.async.max-pending", defaultValue = "20") int maxPendingExecutions) {
        this.processExecutionStateService = processExecutionStateService;
        this.processExecutionRunner = processExecutionRunner;
        this.managedExecutor = managedExecutor;
        this.maxConcurrentExecutions = Math.max(maxConcurrentExecutions, 1);
        this.maxPendingExecutions = Math.max(maxPendingExecutions, 1);
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
                    if (!processExecutionStateService.markProcessRunningIfPending(processExecutionId)) {
                        continue;
                    }
                    dispatchedAny = true;
                    LOG.infov(
                            "Dispatching queued process execution {0}. activeExecutions={1}/{2}",
                            processExecutionId,
                            activeExecutions.get(),
                            maxConcurrentExecutions
                    );
                    submit(processExecutionId);
                }

                if (!dispatchedAny) {
                    return;
                }
            }
        }
    }

    @Scheduled(every = "{integrationhub.execution.async.dispatch-every:2s}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void pumpPendingExecutions() {
        dispatchPendingExecutions();
    }

    private void submit(Long processExecutionId) {
        var activeNow = activeExecutions.incrementAndGet();
        LOG.infov(
                "Submitting queued process execution {0} to background executor. activeExecutions={1}/{2}",
                processExecutionId,
                activeNow,
                maxConcurrentExecutions
        );
        managedExecutor.runAsync(() -> {
            try {
                processExecutionRunner.run(processExecutionId);
            } catch (Exception e) {
                LOG.errorv(e, "Queued process execution {0} failed during background run", processExecutionId);
            } finally {
                var remaining = activeExecutions.decrementAndGet();
                LOG.infov(
                        "Background execution {0} finished. activeExecutions={1}/{2}",
                        processExecutionId,
                        remaining,
                        maxConcurrentExecutions
                );
                dispatchPendingExecutions();
            }
        });
    }
}
