package com.example.plugin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskRequest;
import com.integrationhub.platform.plugin.grpc.GrpcRemoteTaskResult;
import com.integrationhub.platform.plugin.grpc.MutinyRemotePluginServiceGrpc;
import io.grpc.Status;
import io.quarkus.grpc.GrpcService;
import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Uni;

import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

/**
 * Implementacion QUARKUS gRPC del contrato {@code RemotePluginService.Execute} que la
 * plataforma invoca. Traduce entre el transporte gRPC (JSON en String) y la logica de negocio
 * ({@link TransformTask} / {@link DemoRemoteCsvReader}). Quarkus arranca el servidor gRPC
 * (ver application.properties); ya no hay un {@code main()} propio.
 *
 * <p>Un {@code task_type} desconocido se rechaza (fail-loud) con INVALID_ARGUMENT.</p>
 */
@GrpcService
public class RemotePluginServiceImpl extends MutinyRemotePluginServiceGrpc.RemotePluginServiceImplBase {

    static final String PLUGIN_ID = "demo-transform-java";
    static final String PLUGIN_VERSION = "1.0.0";
    static final Set<String> SUPPORTED_TASK_TYPES = Set.of("DEMO_TRANSFORM_JAVA", DemoRemoteCsvReader.TASK_TYPE);

    private static final Logger LOG = Logger.getLogger(RemotePluginServiceImpl.class.getName());
    private static final TypeReference<Map<String, Object>> OBJECT_MAP = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final TransformTask task = new TransformTask();
    private final DemoRemoteCsvReader reader = new DemoRemoteCsvReader();

    @Override
    @Blocking
    public Uni<GrpcRemoteTaskResult> execute(GrpcRemoteTaskRequest request) {
        return Uni.createFrom().item(() -> handle(request));
    }

    private GrpcRemoteTaskResult handle(GrpcRemoteTaskRequest request) {
        var taskType = request.getTaskType();
        LOG.info(() -> "Execute task_type=" + taskType
                + " plugin=" + request.getPluginId() + "/" + request.getPluginVersion()
                + " execId=" + request.getProcessExecutionId());

        if (!SUPPORTED_TASK_TYPES.contains(taskType)) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("Unsupported task_type '" + taskType + "'; this plugin serves "
                            + SUPPORTED_TASK_TYPES)
                    .asRuntimeException();
        }

        final Map<String, Object> configuration;
        try {
            configuration = parseJson(request.getConfigurationJson());
        } catch (RuntimeException error) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("configuration_json is not valid JSON: " + error.getMessage())
                    .asRuntimeException();
        }

        if (DemoRemoteCsvReader.TASK_TYPE.equals(taskType)) {
            try {
                return GrpcRemoteTaskResult.newBuilder()
                        .setSuccess(true)
                        .setSuspended(false)
                        .setDetails("DEMO_REMOTE_CSV page read")
                        .setOutputsJson(writeJson(reader.read(configuration)))
                        .setSuspendedStateJson("")
                        .build();
            } catch (Exception error) {
                return GrpcRemoteTaskResult.newBuilder()
                        .setSuccess(false)
                        .setSuspended(false)
                        .setDetails(error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage())
                        .setOutputsJson("{}")
                        .setSuspendedStateJson("")
                        .build();
            }
        }

        var outcome = task.execute(configuration);
        return GrpcRemoteTaskResult.newBuilder()
                .setSuccess(outcome.success())
                .setSuspended(false)
                .setDetails(outcome.details())
                .setOutputsJson(writeJson(outcome.outputs()))
                .setSuspendedStateJson("")
                .build();
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
