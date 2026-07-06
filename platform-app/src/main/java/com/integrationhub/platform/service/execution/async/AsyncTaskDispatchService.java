package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.messaging.AsyncAvailabilityService;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Map;
import java.util.Optional;

/**
 * Lado <b>productor</b> del despacho de tareas asíncronas (ADR-015, Etapa 3): decide (via
 * {@link TaskDispatchPlanner}) si una tarea corre síncrona o se offloada a un broker, y en el caso
 * async <b>construye</b> el {@link AsyncTaskEnvelope}.
 *
 * <p><b>No encola</b>: el motor persiste el envelope en el outbox <b>en la misma transacción</b> que
 * la suspensión de la tarea (transactional outbox — {@code ProcessExecutionStateService.suspendTask}),
 * para que la trama nunca sea visible sin su suspensión (si no, un consumer rápido daría
 * {@code NOT_FOUND}: efecto huérfano + completación perdida).</p>
 *
 * <p><b>Gate</b>: {@code tasks.async.execution.enabled=false} por defecto → toda tarea corre síncrona
 * como hoy, sin cambio de comportamiento.</p>
 *
 * <p><b>Contrato del payload</b> (simétrico con el consumer): {@code envelope.payload()} es el JSON de
 * la {@code configuration} resuelta que espera {@code TaskProvider.execute}. Por eso solo son
 * offloadables tareas cuyo input está capturado en la configuración; los identificadores viajan en el
 * envelope. La propagación de contexto enriquecido (readResult/taskOutputs en vivo) es trabajo futuro.</p>
 */
@ApplicationScoped
public class AsyncTaskDispatchService {

    private final TaskDispatchPlanner planner;
    private final ObjectMapper objectMapper;
    private final AsyncAvailabilityService availability;
    private final boolean enabled;

    @Inject
    public AsyncTaskDispatchService(TaskDispatchPlanner planner,
                                    ObjectMapper objectMapper,
                                    AsyncAvailabilityService availability,
                                    @ConfigProperty(name = "tasks.async.execution.enabled",
                                            defaultValue = "false") boolean enabled) {
        this.planner = planner;
        this.objectMapper = objectMapper;
        this.availability = availability;
        this.enabled = enabled;
    }

    /**
     * Si la tarea es async (y el feature está activo), devuelve el {@link AsyncTaskEnvelope} a encolar
     * atómicamente con la suspensión; si es síncrona (o el gate está apagado), devuelve vacío → el
     * motor ejecuta in-process.
     *
     * @throws IllegalStateException si se pide async sin identificadores de ejecución/tarea (no se
     *         puede derivar una idempotencyKey determinista), o si el productor <b>no puede despachar</b>
     *         (§9: relay apagado o sin broker registrado) — en ningún caso se degrada a síncrono en silencio.
     */
    public Optional<AsyncTaskEnvelope> prepare(Long processExecutionId,
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
        // §9 fail-loud: async ON pero el productor no puede despachar (relay apagado o sin broker) →
        // suspender aquí dejaría la tarea con su outbox sin drenar, en no-progreso silencioso que ni el
        // recovery rescata (depende del mismo relay). Se lanza para que el operador lo vea al despachar, NO
        // se cae a síncrono. Alcance productor: NO se mira el consumer (desacoplado por el outbox; sus
        // stalls los expone el tile de salud/DLQ) ni la liveness transitoria (el outbox durable la aguanta).
        var gaps = availability.producerDispatchGaps();
        if (!gaps.isEmpty()) {
            throw new IllegalStateException("Se pidió despacho async para '" + taskType
                    + "' pero el productor no puede despachar: " + String.join("; ", gaps)
                    + ". Reactivar el relay/broker o poner tasks.async.execution.enabled=false.");
        }
        return Optional.of(buildEnvelope(processExecutionId, taskDefinitionId, taskType,
                plan.transport(), configuration));
    }

    /**
     * Construye el {@link AsyncTaskEnvelope} determinista de una tarea (idempotencyKey por
     * {@code (peId, tdId)}). Ungated: lo reusa el redrive del DLQ para re-encolar una suspensión
     * colgada sin depender del flag.
     */
    public AsyncTaskEnvelope buildEnvelope(Long processExecutionId, Long taskDefinitionId,
                                           String taskType, String transport, Map<String, Object> configuration) {
        if (processExecutionId == null || taskDefinitionId == null) {
            throw new IllegalStateException(
                    "El despacho async de '" + taskType + "' requiere processExecutionId y taskDefinitionId "
                            + "para una idempotencyKey determinista");
        }
        var traceId = "exec-" + processExecutionId;
        var idempotencyKey = TaskIdempotency.key(processExecutionId, taskDefinitionId, null);
        return new AsyncTaskEnvelope(
                traceId,
                processExecutionId,
                taskDefinitionId,
                taskType,
                transport,
                idempotencyKey,
                1,
                serialize(configuration),
                Map.of("traceId", traceId));
    }

    private String serialize(Map<String, Object> configuration) {
        try {
            return objectMapper.writeValueAsString(configuration == null ? Map.of() : configuration);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Configuración de tarea async no serializable", e);
        }
    }
}
