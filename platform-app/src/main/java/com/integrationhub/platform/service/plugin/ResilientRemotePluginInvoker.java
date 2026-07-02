package com.integrationhub.platform.service.plugin;

import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.eclipse.microprofile.faulttolerance.Timeout;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;

/**
 * Invocador remoto con limite de resiliencia comun para plugins backend.
 *
 * <p>Aplica timeout y circuit breaker en el seam estable del core. La seleccion
 * de transporte queda detras de {@link RemotePluginTransport}, por lo que instalar
 * un transporte nuevo no exige tocar la resolucion de tareas.</p>
 */
@ApplicationScoped
public class ResilientRemotePluginInvoker implements RemotePluginInvoker {

    private final Iterable<RemotePluginTransport> transports;
    private final PluginRuntimeMetricsRecorder metricsRecorder;

    @Inject
    public ResilientRemotePluginInvoker(
            Instance<RemotePluginTransport> transports,
            PluginRuntimeMetricsRecorder metricsRecorder) {
        this((Iterable<RemotePluginTransport>) transports, metricsRecorder);
    }

    ResilientRemotePluginInvoker(Iterable<RemotePluginTransport> transports,
                                 PluginRuntimeMetricsRecorder metricsRecorder) {
        this.transports = transports == null ? List.of() : transports;
        this.metricsRecorder = metricsRecorder;
    }

    @Override
    @Timeout(value = 60, unit = ChronoUnit.SECONDS)
    @CircuitBreaker(requestVolumeThreshold = 8, failureRatio = 0.5, delay = 10, delayUnit = ChronoUnit.SECONDS, successThreshold = 2)
    public TaskResult invoke(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration) {
        var started = System.nanoTime();
        try {
            var result = resolveTransport(descriptor).invoke(descriptor, taskType, context, configuration);
            record(descriptor, taskType, result.success(), outcome(result), started, null);
            return result;
        } catch (RuntimeException error) {
            record(descriptor, taskType, false, "ERROR", started, error.getMessage());
            throw error;
        }
    }

    private RemotePluginTransport resolveTransport(RemotePluginDescriptor descriptor) {
        return StreamSupport.stream(transports.spliterator(), false)
                .filter(transport -> transport.supports(descriptor))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No RemotePluginTransport configured for " + descriptor.transport()));
    }

    private void record(
            RemotePluginDescriptor descriptor,
            String taskType,
            boolean success,
            String outcome,
            long started,
            String errorMessage) {
        metricsRecorder.record(new PluginInvocationMetricCommand(
                descriptor.id(),
                descriptor.version(),
                taskType,
                descriptor.transport(),
                success,
                outcome,
                (System.nanoTime() - started) / 1_000_000L,
                errorMessage,
                null));
    }

    private String outcome(TaskResult result) {
        if (result.suspended()) {
            return "SUSPENDED";
        }
        return result.success() ? "SUCCESS" : "FAILURE";
    }
}
