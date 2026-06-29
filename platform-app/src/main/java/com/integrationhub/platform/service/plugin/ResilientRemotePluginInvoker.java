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

    @Inject
    public ResilientRemotePluginInvoker(Instance<RemotePluginTransport> transports) {
        this((Iterable<RemotePluginTransport>) transports);
    }

    ResilientRemotePluginInvoker(Iterable<RemotePluginTransport> transports) {
        this.transports = transports == null ? List.of() : transports;
    }

    @Override
    @Timeout(value = 60, unit = ChronoUnit.SECONDS)
    @CircuitBreaker(requestVolumeThreshold = 8, failureRatio = 0.5, delay = 10, delayUnit = ChronoUnit.SECONDS, successThreshold = 2)
    public TaskResult invoke(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration) {
        return resolveTransport(descriptor).invoke(descriptor, taskType, context, configuration);
    }

    private RemotePluginTransport resolveTransport(RemotePluginDescriptor descriptor) {
        return StreamSupport.stream(transports.spliterator(), false)
                .filter(transport -> transport.supports(descriptor))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No RemotePluginTransport configured for " + descriptor.transport()));
    }
}
