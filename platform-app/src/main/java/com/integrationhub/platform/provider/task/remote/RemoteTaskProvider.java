package com.integrationhub.platform.provider.task.remote;

import com.integrationhub.platform.service.plugin.RemotePluginDescriptor;
import com.integrationhub.platform.service.plugin.RemotePluginInvoker;
import com.integrationhub.platform.service.plugin.RemotePluginRegistry;
import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.RemoteTaskResumePayload;

import java.util.LinkedHashMap;
import java.util.Locale;
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
public class RemoteTaskProvider implements SuspendableTaskProvider {

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

    @Override
    public TaskResult resume(TaskContext context, Map<String, Object> configuration, Map<String, Object> suspendedState) {
        if (!descriptor.trusted()) {
            registry.markDegraded(descriptor.id(), "descriptor no confiable");
            return TaskResult.failure("Plugin remoto " + descriptor.id() + " no esta verificado");
        }

        var externalEvent = objectMap(value(suspendedState, "externalEvent"));
        if (externalEvent.isEmpty()) {
            return degradeAndFail("callback remoto sin externalEvent");
        }
        var pluginId = text(externalEvent.get(RemoteTaskResumePayload.PLUGIN_ID));
        if (!descriptor.id().equals(pluginId)) {
            return degradeAndFail("callback remoto de plugin inesperado: " + pluginId);
        }
        var taskType = text(externalEvent.get(RemoteTaskResumePayload.TASK_TYPE));
        if (!normalized(type).equals(normalized(taskType))) {
            return degradeAndFail("callback remoto de taskType inesperado: " + taskType);
        }
        var expectedIdempotencyKey = text(value(suspendedState, RemoteTaskResumePayload.IDEMPOTENCY_KEY));
        var actualIdempotencyKey = text(externalEvent.get(RemoteTaskResumePayload.IDEMPOTENCY_KEY));
        if (!expectedIdempotencyKey.isBlank() && !expectedIdempotencyKey.equals(actualIdempotencyKey)) {
            return degradeAndFail("callback remoto con idempotencyKey inesperada");
        }
        var success = externalEvent.get(RemoteTaskResumePayload.SUCCESS);
        if (!(success instanceof Boolean completed)) {
            return degradeAndFail("callback remoto sin bandera success booleana");
        }

        var details = text(externalEvent.get(RemoteTaskResumePayload.DETAILS));
        if (details.isBlank()) {
            details = completed ? "Plugin remoto " + descriptor.id() + " completado" : "Plugin remoto fallo";
        }
        var outputs = objectMap(externalEvent.get(RemoteTaskResumePayload.OUTPUTS));
        return completed ? TaskResult.success(details, outputs) : TaskResult.failure(details, outputs);
    }

    private TaskResult degradeAndFail(String reason) {
        registry.markDegraded(descriptor.id(), reason);
        return TaskResult.failure("Plugin remoto " + descriptor.id() + " no pudo reanudarse: " + reason);
    }

    private static Object value(Map<String, Object> source, String key) {
        return source == null ? null : source.get(key);
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static String normalized(String value) {
        return text(value).toUpperCase(Locale.ROOT);
    }

    private static Map<String, Object> objectMap(Object value) {
        if (!(value instanceof Map<?, ?> map)) {
            return Map.of();
        }
        var copy = new LinkedHashMap<String, Object>();
        for (var entry : map.entrySet()) {
            if (entry.getKey() instanceof String key) {
                copy.put(key, entry.getValue());
            }
        }
        return copy;
    }
}
