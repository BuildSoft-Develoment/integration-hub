package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
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
    private final SliceGatherService gather;
    private final ObjectMapper objectMapper;

    @Inject
    public AsyncTaskConsumer(TaskInboxStore inbox,
                             TaskProviderRegistry providers,
                             AsyncTaskCompletion completion,
                             SliceGatherService gather,
                             ObjectMapper objectMapper) {
        this.inbox = inbox;
        this.providers = providers;
        this.completion = completion;
        this.gather = gather;
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

        // Scatter-gather (Opción B): un work-item de slice se procesa por lotes y agrega en el tracker
        // N→1, en vez de completar la tarea de una.
        if ("SLICE".equals(envelope.headers().get("kind"))) {
            return consumeSlice(envelope);
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

    /**
     * Procesa un work-item de <b>slice</b> (Opción B): ejecuta el {@code BatchTaskProvider} sobre los
     * records de la slice y avanza la agregación N→1. La reanudación de la tarea la dispara solo la
     * slice que cierra el conteo (o la primera que falla); las demás solo cuentan.
     */
    private ConsumeResult consumeSlice(AsyncTaskEnvelope envelope) {
        AsyncSliceWorkItem item;
        try {
            item = objectMapper.readValue(envelope.payload(), AsyncSliceWorkItem.class);
        } catch (JsonProcessingException badSlice) {
            inbox.recordDead(envelope, "slice ilegible: " + badSlice.getOriginalMessage());
            return ConsumeResult.DEAD;
        }
        var continueOnFailure = asBoolean(item.configuration().get("continueOnFailure"));

        TaskProvider provider;
        try {
            provider = providers.resolve(envelope.taskType());
        } catch (IllegalArgumentException unknown) {
            failSlice(envelope, unknown.getMessage(), continueOnFailure);
            return ConsumeResult.DEAD;
        }
        if (!(provider instanceof BatchTaskProvider batchProvider)) {
            failSlice(envelope, "el tipo '" + envelope.taskType() + "' no es BatchTaskProvider", continueOnFailure);
            return ConsumeResult.DEAD;
        }

        var records = item.records().stream().map(ReadRecord::new).toList();
        var context = new TaskContext(envelope.processExecutionId(), envelope.taskDefinitionId());
        // Nivel 2: rehidrata el contexto serializable que viajó en la slice (outputs de tareas origen,
        // metadata, variables) para que el provider resuelva variables como en el motor síncrono. NO se
        // rehidrata sourcePayload (no serializable): los providers que lo requieren son UNSUPPORTED.
        hydrateSliceContext(context, item);
        // Un throw (fallo transitorio) propaga → nack → reentrega de la slice.
        var result = batchProvider.executeRecords(context, item.configuration(), records, null);

        if (result.suspended()) {
            failSlice(envelope, "una slice no puede suspenderse en el consumer", continueOnFailure);
            return ConsumeResult.DEAD;
        }
        if (!result.success()) {
            failSlice(envelope, result.details(), continueOnFailure);
            return ConsumeResult.FAILED;
        }

        var progress = gather.commitCompletedSlice(envelope, writeOutputs(result.outputs()), result.details());
        progress.filter(TaskAsyncDispatchRepository.SliceProgress::terminal)
                .ifPresent(p -> resumeTaskOnTerminal(envelope, p, continueOnFailure));
        return ConsumeResult.PROCESSED;
    }

    /** Cuenta una slice fallida; si esa slice cierra el scatter, reanuda/falla la tarea una vez. */
    private void failSlice(AsyncTaskEnvelope envelope, String error, boolean continueOnFailure) {
        gather.failSlice(envelope, error, continueOnFailure)
                .filter(TaskAsyncDispatchRepository.SliceProgress::terminal)
                .ifPresent(p -> resumeTaskOnTerminal(envelope, p, continueOnFailure));
    }

    /**
     * Reanuda la tarea suspendida una vez, con el resultado agregado del scatter: éxito si no hubo
     * fallos; éxito con errores si {@code continueOnFailure} y hubo fallos; failure en fail-fast.
     */
    private void resumeTaskOnTerminal(AsyncTaskEnvelope envelope,
                                      TaskAsyncDispatchRepository.SliceProgress progress,
                                      boolean continueOnFailure) {
        TaskResult result;
        if (progress.failed() == 0) {
            result = TaskResult.success("scatter completado: " + progress.total() + " slices");
        } else if (continueOnFailure) {
            result = TaskResult.success(
                    "scatter completado con errores: " + progress.completed() + " ok, " + progress.failed()
                            + " fallidas de " + progress.total(),
                    Map.of("scatterCompleted", progress.completed(),
                            "scatterFailed", progress.failed(),
                            "scatterTotal", progress.total()));
        } else {
            result = TaskResult.failure(
                    "scatter fallido: " + progress.failed() + " slice(s) fallida(s) de " + progress.total());
        }
        completion.completeFromExternalResult(envelope.processExecutionId(), envelope.taskDefinitionId(), result);
    }

    /** Rehidrata en el context el contexto serializable propagado en la slice (Nivel 2). */
    private void hydrateSliceContext(TaskContext context, AsyncSliceWorkItem item) {
        if (item.taskOutputs() != null && !item.taskOutputs().isEmpty()) {
            context.attributes().put("taskOutputs", item.taskOutputs());
        }
        if (item.metadata() != null && !item.metadata().isEmpty()) {
            context.attributes().put("metadata", item.metadata());
        }
        if (item.executionVariables() != null && !item.executionVariables().isEmpty()) {
            context.attributes().put("executionVariables", item.executionVariables());
        }
    }

    private boolean asBoolean(Object value) {
        return value instanceof Boolean b ? b
                : value != null && "true".equalsIgnoreCase(String.valueOf(value).trim());
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
