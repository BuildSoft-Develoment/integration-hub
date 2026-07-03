package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Map;
import java.util.Optional;

/**
 * Lado <b>productor</b> del despacho de tareas asíncronas (ADR-015, Etapa 3): decide (via
 * {@link TaskDispatchPlanner}) si una tarea corre síncrona o se offloada a un broker, y en el caso
 * async construye el {@link AsyncTaskEnvelope} y lo encola en el outbox durable ({@link TaskOutboxStore},
 * DIP). El relay lo publica y el {@link AsyncTaskConsumer} lo ejecuta.
 *
 * <p><b>Gate</b>: {@code tasks.async.execution.enabled=false} por defecto → toda tarea corre síncrona
 * como hoy, sin cambio de comportamiento. La bandera es opt-in del feature completo (requiere también
 * la continuación de la Etapa 4 para reanudar el proceso con el resultado).</p>
 *
 * <p><b>Contrato del payload</b> (simétrico con el consumer): {@code envelope.payload()} es el JSON de
 * la {@code configuration} resuelta que espera {@code TaskProvider.execute}. Por eso solo son
 * offloadables tareas cuyo input está capturado en la configuración; los identificadores viajan en el
 * envelope. La propagación de contexto enriquecido (readResult/taskOutputs en vivo) es trabajo futuro.</p>
 */
@ApplicationScoped
public class AsyncTaskDispatchService {

    private final TaskDispatchPlanner planner;
    private final TaskOutboxStore outboxStore;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    @Inject
    public AsyncTaskDispatchService(TaskDispatchPlanner planner,
                                    TaskOutboxStore outboxStore,
                                    ObjectMapper objectMapper,
                                    @ConfigProperty(name = "tasks.async.execution.enabled",
                                            defaultValue = "false") boolean enabled) {
        this.planner = planner;
        this.outboxStore = outboxStore;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
    }

    /**
     * Si la tarea es async (y el feature está activo), encola el work-item y devuelve la suspensión a
     * persistir; si es síncrona (o el gate está apagado), devuelve vacío → el motor ejecuta in-process.
     *
     * @throws IllegalStateException si se pide async sin identificadores de ejecución/tarea (no se
     *         puede derivar una idempotencyKey determinista) — no se degrada a síncrono en silencio.
     */
    public Optional<AsyncSuspension> dispatch(Long processExecutionId,
                                              Long taskDefinitionId,
                                              String taskType,
                                              Map<String, Object> configuration) {
        if (!enabled) {
            return Optional.empty();
        }
        var plan = planner.plan(configuration);
        if (!plan.isAsync()) {
            return Optional.empty();
        }
        if (processExecutionId == null || taskDefinitionId == null) {
            throw new IllegalStateException(
                    "El despacho async de '" + taskType + "' requiere processExecutionId y taskDefinitionId "
                            + "para una idempotencyKey determinista");
        }
        var traceId = "exec-" + processExecutionId;
        var idempotencyKey = TaskIdempotency.key(processExecutionId, taskDefinitionId, null);
        var envelope = new AsyncTaskEnvelope(
                traceId,
                processExecutionId,
                taskDefinitionId,
                taskType,
                plan.transport(),
                idempotencyKey,
                1,
                serialize(configuration),
                Map.of("traceId", traceId));
        outboxStore.enqueue(envelope);
        return Optional.of(new AsyncSuspension(idempotencyKey, plan.transport()));
    }

    private String serialize(Map<String, Object> configuration) {
        try {
            return objectMapper.writeValueAsString(configuration == null ? Map.of() : configuration);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Configuración de tarea async no serializable", e);
        }
    }

    /** Correlación de una tarea suspendida por despacho async; la resuelve la continuación (Etapa 4). */
    public record AsyncSuspension(String idempotencyKey, String transport) {
    }
}
