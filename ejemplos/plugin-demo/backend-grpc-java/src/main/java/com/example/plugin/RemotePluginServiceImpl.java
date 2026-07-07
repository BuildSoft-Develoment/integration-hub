package com.example.plugin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskRequest;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskResult;
import com.integrationhub.platform.plugin.grpc.RemotePluginServiceGrpc;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;

import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

/**
 * Implementacion gRPC del contrato {@code RemotePluginService.Execute} que la plataforma
 * (cliente) invoca. Responsabilidad unica: traducir entre el transporte gRPC (JSON en String)
 * y la logica de negocio {@link TransformTask}. No conoce como se construye el servidor
 * ni el ciclo de vida — eso vive en {@link PluginServer}.
 *
 * <p>Este plugin declara un solo task type: {@code DEMO_TRANSFORM_JAVA}. Un {@code task_type}
 * desconocido se rechaza (fail-loud) en vez de devolver un exito vacio.</p>
 */
public final class RemotePluginServiceImpl extends RemotePluginServiceGrpc.RemotePluginServiceImplBase {

    static final String PLUGIN_ID = "demo-transform-java";
    static final String PLUGIN_VERSION = "1.0.0";
    static final Set<String> SUPPORTED_TASK_TYPES = Set.of("DEMO_TRANSFORM_JAVA");

    private static final Logger LOG = Logger.getLogger(RemotePluginServiceImpl.class.getName());
    private static final TypeReference<Map<String, Object>> OBJECT_MAP = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final TransformTask task = new TransformTask();

    @Override
    public void execute(GrpcRemoteTaskRequest request, StreamObserver<GrpcRemoteTaskResult> responseObserver) {
        var taskType = request.getTaskType();
        LOG.info(() -> "Execute task_type=" + taskType
                + " plugin=" + request.getPluginId() + "/" + request.getPluginVersion()
                + " execId=" + request.getProcessExecutionId());

        if (!SUPPORTED_TASK_TYPES.contains(taskType)) {
            // Contrato desconocido: erroramos con INVALID_ARGUMENT en vez de fingir exito.
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("Unsupported task_type '" + taskType + "'; this plugin serves "
                            + SUPPORTED_TASK_TYPES)
                    .asRuntimeException());
            return;
        }

        final Map<String, Object> configuration;
        try {
            configuration = parseJson(request.getConfigurationJson());
        } catch (RuntimeException error) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("configuration_json is not valid JSON: " + error.getMessage())
                    .asRuntimeException());
            return;
        }

        var outcome = task.execute(configuration);
        responseObserver.onNext(GrpcRemoteTaskResult.newBuilder()
                .setSuccess(outcome.success())
                .setSuspended(false)
                .setDetails(outcome.details())
                .setOutputsJson(writeJson(outcome.outputs()))
                .setSuspendedStateJson("")
                .build());
        responseObserver.onCompleted();
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, OBJECT_MAP);
        } catch (Exception error) {
            throw new IllegalArgumentException(error.getMessage(), error);
        }
    }

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (Exception error) {
            throw new IllegalStateException("outputs cannot be serialized", error);
        }
    }
}
