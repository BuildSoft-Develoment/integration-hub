package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.execution.async.TaskDispatchPublisher;
import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.PublishResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

/**
 * Transporte remoto productivo para plugins asincronos sobre broker.
 *
 * <p>Publica el contrato compartido {@link AsyncTaskEnvelope}; el plugin externo
 * actua como consumer del topic/queue derivado por el codec existente. Como el
 * resultado llega por reanudacion posterior, la tarea queda suspendida con
 * metadata de correlacion.</p>
 */
@ApplicationScoped
public class BrokerRemotePluginTransport implements RemotePluginTransport {

    private final Function<String, Optional<MessageBrokerProvider>> brokerFinder;
    private final TaskDispatchPublisher publisher;
    private final ObjectMapper objectMapper;

    @Inject
    public BrokerRemotePluginTransport(
            MessageBrokerRegistry brokerRegistry,
            TaskDispatchPublisher publisher,
            ObjectMapper objectMapper) {
        this(brokerRegistry::find, publisher, objectMapper);
    }

    BrokerRemotePluginTransport(
            Function<String, Optional<MessageBrokerProvider>> brokerFinder,
            TaskDispatchPublisher publisher,
            ObjectMapper objectMapper) {
        this.brokerFinder = brokerFinder;
        this.publisher = publisher;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(RemotePluginDescriptor descriptor) {
        return descriptor != null
                && descriptor.transport() != null
                && brokerFinder.apply(descriptor.transport()).isPresent();
    }

    @Override
    public TaskResult invoke(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration) {
        var broker = brokerFinder.apply(descriptor.transport())
                .orElseThrow(() -> new IllegalStateException(
                        "Unsupported plugin broker transport: " + descriptor.transport()));
        var envelope = envelope(descriptor, taskType, context, configuration);
        PublishResult result = publisher.publish(broker, envelope);
        if (!result.accepted()) {
            throw new IllegalStateException("Broker rejected plugin task: " + result.error());
        }
        return TaskResult.suspended(
                "Plugin remoto " + descriptor.id() + " despachado por " + descriptor.transport(),
                suspendedState(descriptor, taskType, envelope, result));
    }

    private AsyncTaskEnvelope envelope(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration) {
        if (context.processExecutionId() == null || context.taskDefinitionId() == null) {
            throw new IllegalArgumentException("Remote plugin broker transport requires process and task identifiers");
        }
        var traceId = "exec-" + context.processExecutionId();
        var idempotencyKey = "plugin:"
                + descriptor.id()
                + ":"
                + context.processExecutionId()
                + ":"
                + context.taskDefinitionId()
                + ":"
                + normalized(taskType);
        return new AsyncTaskEnvelope(
                traceId,
                context.processExecutionId(),
                context.taskDefinitionId(),
                taskType,
                normalized(descriptor.transport()),
                idempotencyKey,
                1,
                payload(descriptor, taskType, context, configuration),
                headers(descriptor, traceId));
    }

    private String payload(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration) {
        var body = new LinkedHashMap<String, Object>();
        body.put("pluginId", descriptor.id());
        body.put("pluginVersion", descriptor.version());
        body.put("spiVersion", descriptor.spiVersion());
        body.put("endpoint", descriptor.endpoint());
        body.put("taskType", taskType);
        body.put("processExecutionId", context.processExecutionId());
        body.put("taskDefinitionId", context.taskDefinitionId());
        body.put("attributes", context.attributes());
        body.put("configuration", configuration == null ? Map.of() : configuration);
        try {
            return objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException error) {
            // Causa incluida: el error viaja como TaskResult.failure sin stacktrace (ver GrpcRemotePluginTransport).
            throw new IllegalArgumentException(
                    "Remote plugin payload cannot be serialized: " + error.getMessage(), error);
        }
    }

    private Map<String, String> headers(RemotePluginDescriptor descriptor, String traceId) {
        var headers = new LinkedHashMap<String, String>();
        headers.put("traceId", traceId);
        headers.put("pluginId", descriptor.id());
        headers.put("pluginVersion", descriptor.version());
        headers.put("spiVersion", descriptor.spiVersion());
        if (descriptor.endpoint() != null) {
            headers.put("pluginEndpoint", descriptor.endpoint());
        }
        return headers;
    }

    private Map<String, Object> suspendedState(
            RemotePluginDescriptor descriptor,
            String taskType,
            AsyncTaskEnvelope envelope,
            PublishResult result) {
        var state = new LinkedHashMap<String, Object>();
        state.put("pluginId", descriptor.id());
        state.put("taskType", taskType);
        state.put("transport", envelope.transport());
        state.put("traceId", envelope.traceId());
        state.put("idempotencyKey", envelope.idempotencyKey());
        state.put("brokerReference", result.reference());
        return state;
    }

    private static String normalized(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
