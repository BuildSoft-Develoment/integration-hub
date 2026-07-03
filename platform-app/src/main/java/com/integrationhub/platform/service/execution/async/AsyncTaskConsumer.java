package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.Map;

/**
 * Caso de uso <b>puro</b> del consumer de tareas asíncronas (ADR-015), en el mismo estilo que
 * {@code AuditEventHandler}: un adaptador de broker (Kafka/JMS/… — Etapa 4) solo saca el texto del
 * canal y delega aquí. Toma el payload (el {@link AsyncTaskEnvelope} serializado entero, patrón
 * audit/sidecar), lo decodifica, descarta duplicados por {@code idempotencyKey}, resuelve el
 * provider local y lo ejecuta.
 *
 * <p><b>Contrato del work-item local</b>: {@code envelope.payload()} es el JSON de la
 * {@code configuration} resuelta que espera {@link TaskProvider#execute}; el {@code TaskContext} se
 * reconstruye desde los identificadores del envelope. (El transporte de plugin remoto usa su propio
 * body enriquecido, que consume el sidecar, no este handler.)</p>
 *
 * <p><b>Semántica de reentrega</b> (at-least-once): un fallo <i>transitorio</i> (excepción lanzada
 * por {@code execute}, p.ej. BD caída) <b>propaga</b> para que el broker reentregue; un fallo de
 * <i>negocio</i> determinista ({@code TaskResult.failure}) se registra y se ACK-ea (reintentarlo no
 * ayuda); una trama indecodificable o un tipo desconocido van al ledger (POISON/DEAD) y se ACK-ean.</p>
 *
 * <p>Tras ejecutar, aplica el resultado a la tarea suspendida por despacho async y continúa el
 * pipeline via {@link AsyncTaskCompletion} (Etapa 4), sin re-invocar al provider. La completación es
 * idempotente (por {@code resumedAt}), así que una reentrega no reanuda dos veces.</p>
 */
@ApplicationScoped
public class AsyncTaskConsumer {

    private static final Logger LOG = Logger.getLogger(AsyncTaskConsumer.class);
    private static final TypeReference<Map<String, Object>> CONFIG_TYPE = new TypeReference<>() {
    };

    private final TaskInboxStore inbox;
    private final TaskProviderRegistry providers;
    private final AsyncTaskCompletion completion;
    private final ObjectMapper objectMapper;

    @Inject
    public AsyncTaskConsumer(TaskInboxStore inbox,
                             TaskProviderRegistry providers,
                             AsyncTaskCompletion completion,
                             ObjectMapper objectMapper) {
        this.inbox = inbox;
        this.providers = providers;
        this.completion = completion;
        this.objectMapper = objectMapper;
    }

    /**
     * Procesa un work-item. Devuelve el desenlace (testeable). Solo relanza en fallo transitorio
     * de {@code execute}, para que el adaptador haga nack → reentrega.
     */
    public ConsumeResult consume(String payload, String brokerType, String topic) {
        AsyncTaskEnvelope envelope;
        try {
            envelope = AsyncTaskMessageCodec.decode(payload, objectMapper);
        } catch (IllegalArgumentException poison) {
            inbox.recordPoison(payload, brokerType, topic, poison.getMessage());
            LOG.warnf(poison, "Async task consumer: trama indecodificable en %s/%s → POISON", brokerType, topic);
            return ConsumeResult.POISON;
        }

        if (inbox.isProcessed(envelope.idempotencyKey())) {
            LOG.debugf("Async task consumer: %s ya procesada; reentrega descartada", envelope.idempotencyKey());
            return ConsumeResult.DUPLICATE;
        }

        TaskProvider provider;
        try {
            provider = providers.resolve(envelope.taskType());
        } catch (IllegalArgumentException unknown) {
            inbox.recordDead(envelope, unknown.getMessage());
            LOG.warnf("Async task consumer: tipo '%s' no resoluble → DEAD (%s)", envelope.taskType(), unknown.getMessage());
            return ConsumeResult.DEAD;
        }

        Map<String, Object> configuration;
        try {
            configuration = decodeConfiguration(envelope.payload());
        } catch (JsonProcessingException badConfig) {
            inbox.recordDead(envelope, "configuración ilegible: " + badConfig.getOriginalMessage());
            LOG.warnf(badConfig, "Async task consumer: configuración ilegible para %s → DEAD", envelope.taskType());
            return ConsumeResult.DEAD;
        }

        var context = new TaskContext(envelope.processExecutionId(), envelope.taskDefinitionId());
        // Un throw aquí (fallo transitorio) NO se captura: propaga → nack → reentrega (at-least-once).
        var result = provider.execute(context, configuration);

        if (result.suspended()) {
            // Una tarea offloada no puede volver a suspenderse en el consumer: no hay forma de
            // reanudarla desde aquí. DEAD explícito, sin degradar en silencio.
            inbox.recordDead(envelope, "el provider se suspendió en el consumer async; no soportado");
            return ConsumeResult.DEAD;
        }

        // Aplica el resultado a la tarea suspendida por despacho async y continúa el pipeline
        // (idempotente por resumedAt). Se hace ANTES de registrar el inbox: si hay crash entre
        // completar y registrar, la reentrega re-ejecuta (at-least-once) y la completación vuelve a
        // ser idempotente (NOT_FOUND), sin dejar el proceso colgado.
        var outcome = completion.completeFromExternalResult(
                envelope.processExecutionId(), envelope.taskDefinitionId(), result);
        LOG.debugf("Async task consumer: completación de %s → %s", envelope.idempotencyKey(), outcome.outcome());

        if (!result.success()) {
            inbox.recordFailed(envelope, result.details());
            return ConsumeResult.FAILED;
        }

        inbox.recordProcessed(envelope, writeOutputs(result.outputs()), result.details());
        return ConsumeResult.PROCESSED;
    }

    private Map<String, Object> decodeConfiguration(String payload) throws JsonProcessingException {
        if (payload == null || payload.isBlank()) {
            return Map.of();
        }
        return objectMapper.readValue(payload, CONFIG_TYPE);
    }

    private String writeOutputs(Map<String, Object> outputs) {
        if (outputs == null || outputs.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(outputs);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Outputs de la tarea async no serializables", e);
        }
    }

    /** Desenlace del procesamiento de un work-item (para observabilidad y tests). */
    public enum ConsumeResult {
        PROCESSED,
        DUPLICATE,
        FAILED,
        DEAD,
        POISON
    }
}
