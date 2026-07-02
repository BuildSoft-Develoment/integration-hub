package com.integrationhub.platform.service.plugin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskRequest;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskResult;
import com.integrationhub.platform.plugin.grpc.RemotePluginServiceGrpc;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class GrpcRemotePluginTransport implements RemotePluginTransport {

    /** 16 MiB: raises the 4 MiB gRPC default so larger Source/Reader payloads fit. */
    private static final int DEFAULT_MAX_MESSAGE_BYTES = 16 * 1024 * 1024;
    private static final int MIN_MAX_MESSAGE_BYTES = 64 * 1024;

    private static final TypeReference<Map<String, Object>> OBJECT_MAP = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final int maxMessageBytes;

    @Inject
    public GrpcRemotePluginTransport(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "integrationhub.plugins.grpc.max-message-bytes",
                    defaultValue = "16777216") int maxMessageBytes) {
        this.objectMapper = objectMapper;
        this.maxMessageBytes = Math.max(MIN_MAX_MESSAGE_BYTES, maxMessageBytes);
    }

    public GrpcRemotePluginTransport(ObjectMapper objectMapper) {
        this(objectMapper, DEFAULT_MAX_MESSAGE_BYTES);
    }

    /** Configured maximum inbound gRPC message size, in bytes. */
    int maxMessageBytes() {
        return maxMessageBytes;
    }

    @Override
    public boolean supports(RemotePluginDescriptor descriptor) {
        return descriptor != null
                && descriptor.transport() != null
                && "GRPC".equalsIgnoreCase(descriptor.transport())
                && descriptor.endpoint() != null
                && !descriptor.endpoint().isBlank();
    }

    @Override
    public TaskResult invoke(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration) {
        var endpoint = URI.create(descriptor.endpoint());
        var channel = channel(endpoint);
        try {
            var response = RemotePluginServiceGrpc.newBlockingStub(channel)
                    .withDeadlineAfter(60, TimeUnit.SECONDS)
                    .execute(request(descriptor, taskType, context, configuration));
            return toTaskResult(response);
        } finally {
            channel.shutdownNow();
        }
    }

    private ManagedChannel channel(URI endpoint) {
        var host = endpoint.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("GRPC plugin endpoint must include host");
        }
        var port = endpoint.getPort();
        if (port < 0) {
            port = "https".equalsIgnoreCase(endpoint.getScheme()) ? 443 : 80;
        }
        var builder = ManagedChannelBuilder.forAddress(host, port)
                .maxInboundMessageSize(maxMessageBytes);
        if ("http".equalsIgnoreCase(endpoint.getScheme())) {
            builder.usePlaintext();
        } else {
            builder.useTransportSecurity();
        }
        return builder.build();
    }

    private GrpcRemoteTaskRequest request(
            RemotePluginDescriptor descriptor,
            String taskType,
            TaskContext context,
            Map<String, Object> configuration) {
        return GrpcRemoteTaskRequest.newBuilder()
                .setPluginId(descriptor.id())
                .setPluginVersion(descriptor.version())
                .setSpiVersion(descriptor.spiVersion())
                .setTaskType(taskType)
                .setProcessExecutionId(context.processExecutionId() == null ? 0L : context.processExecutionId())
                .setTaskDefinitionId(context.taskDefinitionId() == null ? 0L : context.taskDefinitionId())
                .setAttributesJson(json(context.attributes()))
                .setConfigurationJson(json(configuration == null ? Map.of() : configuration))
                .build();
    }

    TaskResult toTaskResult(GrpcRemoteTaskResult response) {
        var outputs = parseMap(response.getOutputsJson(), "outputs");
        if (response.getSuspended()) {
            return TaskResult.suspended(response.getDetails(), parseMap(response.getSuspendedStateJson(), "suspendedState"));
        }
        return response.getSuccess()
                ? TaskResult.success(response.getDetails(), outputs)
                : TaskResult.failure(response.getDetails(), outputs);
    }

    private String json(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("GRPC plugin payload cannot be serialized", error);
        }
    }

    private Map<String, Object> parseMap(String json, String fieldName) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, OBJECT_MAP);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("GRPC plugin " + fieldName + " cannot be parsed", error);
        }
    }
}
