package com.integrationhub.platform.provider.task.remote;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;

import java.util.Map;

/**
 * {@link TaskProvider} que delega la ejecucion de un tipo de tarea en un plugin
 * out-of-process via {@link RemotePluginInvoker} (ADR-014).
 *
 * <p>No es un bean CDI por tipo (Quarkus resuelve CDI en build-time): se construye
 * en la resolucion para un {@code type()} cubierto por un descriptor. Aplica el
 * mismo limite de error que el loader del frontend: una invocacion fallida o un
 * descriptor no confiable marcan el plugin {@code degraded} y devuelven un
 * {@link TaskResult#failure} en vez de propagar y tumbar el motor.</p>
 */
public class RemoteTaskProvider implements TaskProvider {

    private final String type;
    private final RemotePluginDescriptor descriptor;
    private final RemotePluginInvoker invoker;
    private final RemotePluginRegistry registry;

    public RemoteTaskProvider(String type,
                              RemotePluginDescriptor descriptor,
                              RemotePluginInvoker invoker,
                              RemotePluginRegistry registry) {
        this.type = type;
        this.descriptor = descriptor;
        this.invoker = invoker;
        this.registry = registry;
    }

    @Override
    public String type() {
        return type;
    }

    @Override
    public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
        if (!descriptor.trusted()) {
            registry.markDegraded(descriptor.id(), "descriptor no confiable");
            return TaskResult.failure("Plugin remoto " + descriptor.id() + " no esta verificado");
        }

        try {
            return invoker.invoke(descriptor, type, context, configuration);
        } catch (RuntimeException error) {
            registry.markDegraded(descriptor.id(), "invocacion fallida: " + error.getMessage());
            return TaskResult.failure("Plugin remoto " + descriptor.id() + " fallo: " + error.getMessage());
        }
    }
}
