package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.Optional;

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
    private final AsyncPageChainService pageChain;
    private final JsonConfigurationMapper configurationMapper;
    private final int maxAttempts;
    private final long backoffMs;

    @Inject
    public AsyncTaskConsumer(TaskInboxStore inbox,
                             TaskProviderRegistry providers,
                             AsyncTaskCompletion completion,
                             SliceGatherService gather,
                             ObjectMapper objectMapper,
                             AsyncPageChainService pageChain,
                             JsonConfigurationMapper configurationMapper,
                             @ConfigProperty(name = "tasks.async.consumer.max-attempts", defaultValue = "3")
                             int maxAttempts,
                             @ConfigProperty(name = "tasks.async.consumer.backoff-ms", defaultValue = "200")
                             long backoffMs) {
        this.inbox = inbox;
        this.providers = providers;
        this.completion = completion;
        this.gather = gather;
        this.objectMapper = objectMapper;
        this.pageChain = pageChain;
        this.configurationMapper = configurationMapper;
        this.maxAttempts = Math.max(1, maxAttempts);
        this.backoffMs = Math.max(0, backoffMs);
    }

    /**
     * Procesa un work-item con <b>retry in-app</b> del fallo transitorio antes de propagar (ADR-015).
     * Bajo {@code failure-strategy=fail}, un {@code nack} detiene el canal entero; reintentar unos
     * intentos con backoff <b>ride-out</b> los blips transitorios (BD/red) sin halt del pipeline. Si se
     * agotan los intentos, propaga → el adaptador hace {@code nack} → halt+restart redelivera (un fallo
     * permanente queda como halt <b>visible</b> para ops; para auto-aislar a volumen, {@code
     * dead-letter-queue}). Los desenlaces terminales (PROCESSED/DEAD/...) NO se reintentan.
     */
    public ConsumeResult consumeWithRetries(String payload, String brokerType, String topic) {
        RuntimeException lastTransient = null;
        for (var attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return consume(payload, brokerType, topic);
            } catch (RuntimeException transientFailure) {
                lastTransient = transientFailure;
                if (attempt < maxAttempts) {
                    LOG.warnf(transientFailure, "Async task consumer: fallo transitorio (intento %d/%d) en %s → retry",
                            attempt, maxAttempts, topic);
                    backoff(attempt);
                }
            }
        }
        LOG.errorf(lastTransient, "Async task consumer: agotados %d intentos in-app en %s → propaga (nack)",
                maxAttempts, topic);
        throw lastTransient;
    }

    private void backoff(int attempt) {
        if (backoffMs <= 0) {
            return;
        }
        try {
            Thread.sleep(backoffMs * attempt); // lineal; suficiente para blips de BD/red
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Retry del consumer interrumpido", interrupted);
        }
    }

    /**
     * Procesa un work-item (<b>un solo intento</b>). Devuelve el desenlace (testeable). Solo relanza en
     * fallo transitorio de {@code execute}/lectura, para que el caller reintente o el adaptador haga nack.
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

        // Scatter por table-streaming (page-chain): esta página encola la siguiente y procesa la suya.
        if ("PAGE".equals(envelope.headers().get("kind"))) {
            return consumePage(envelope);
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
        // Nivel 3 (camino once): rehidrata el contexto serializable capturado al suspender (taskOutputs/
        // executionVariables), para que un provider como MT101_STATUS resuelva qué consultar igual que
        // en el motor síncrono. NO viaja sourcePayload (no serializable): esos providers son UNSUPPORTED.
        hydrateOnceContext(context, envelope);
        // §6: la config viajó con los ${secret:} SIN resolver (no se persisten en outbox/broker); se
        // re-resuelven aquí, en el punto-de-uso, justo antes de ejecutar. Sin secretos inline es no-op.
        var resolvedConfiguration = resolveSecrets(configuration);
        // Un throw aquí (fallo transitorio) NO se captura: propaga → nack → reentrega (at-least-once).
        var result = provider.execute(context, resolvedConfiguration);

        // Aplica el resultado a la tarea suspendida por despacho async y continúa el pipeline (o, si el
        // provider volvió a suspender —Nivel 3, suspendible—, re-suspende con token/estado nuevos). Se
        // hace ANTES de registrar el inbox: si hay crash entre completar y registrar, la reentrega
        // re-ejecuta (at-least-once) y la completación es idempotente (NOT_FOUND), sin colgar el proceso.
        var outcome = completion.completeFromExternalResult(
                envelope.processExecutionId(), envelope.taskDefinitionId(), result);
        LOG.debugf("Async task consumer: completación de %s → %s", envelope.idempotencyKey(), outcome.outcome());

        if (result.suspended()) {
            // Re-suspensión: la tarea quedó SUSPENDED esperando callback/scheduler; el offload cumplió su
            // trabajo (ejecutó el primer intento). Se marca PROCESSED para deduplicar la reentrega.
            inbox.recordProcessed(envelope, null, result.details());
            return ConsumeResult.PROCESSED;
        }

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

        var resolved = resolveBatchProvider(envelope, continueOnFailure);
        if (resolved.isEmpty()) {
            return ConsumeResult.DEAD;
        }
        var batchProvider = resolved.get();

        // Si el scatter ya cerró (fail-fast de otra slice), no se ejecuta el provider: evita side-effects
        // inútiles sobre las slices restantes tras el fallo (su commit sería no-op igual).
        if (gather.isScatterTerminal(envelope.processExecutionId(), envelope.taskDefinitionId())) {
            return ConsumeResult.DUPLICATE;
        }

        var records = item.records().stream().map(ReadRecord::new).toList();
        var context = new TaskContext(envelope.processExecutionId(), envelope.taskDefinitionId());
        // Nivel 2: rehidrata el contexto serializable que viajó en la slice (outputs de tareas origen,
        // metadata, variables) para que el provider resuelva variables como en el motor síncrono. NO se
        // rehidrata sourcePayload (no serializable): los providers que lo requieren son UNSUPPORTED.
        hydrateSliceContext(context, item);
        // §6: re-resuelve los ${secret:} de la config de la slice en el punto-de-uso (viajó con placeholders).
        // Un throw (fallo transitorio) propaga → nack → reentrega de la slice.
        var result = batchProvider.executeRecords(context, resolveSecrets(item.configuration()), records, null);

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

    /**
     * Procesa una <b>página</b> del scatter por table-streaming (page-chain): lee su página (y encola la
     * siguiente vía {@link AsyncPageChainService}), ejecuta el {@code BatchTaskProvider} sobre sus
     * records, cuenta la slice y —si es la última página— <b>sella</b> el scatter. La reanudación la
     * dispara exactamente uno: la slice/seal que cierra el conteo.
     */
    private ConsumeResult consumePage(AsyncTaskEnvelope envelope) {
        AsyncPageWorkItem item;
        try {
            item = objectMapper.readValue(envelope.payload(), AsyncPageWorkItem.class);
        } catch (JsonProcessingException badPage) {
            inbox.recordDead(envelope, "página ilegible: " + badPage.getOriginalMessage());
            return ConsumeResult.DEAD;
        }
        var continueOnFailure = asBoolean(item.configuration().get("continueOnFailure"));

        var resolved = resolveBatchProvider(envelope, continueOnFailure);
        if (resolved.isEmpty()) {
            return ConsumeResult.DEAD;
        }
        var batchProvider = resolved.get();

        // Si el scatter ya cerró (p.ej. fail-fast de una página previa), NO se lee/encola/ejecuta: mata la
        // cadena runaway y evita side-effects del provider sobre el resto de la tabla tras el fallo.
        if (gather.isScatterTerminal(envelope.processExecutionId(), envelope.taskDefinitionId())) {
            return ConsumeResult.DUPLICATE;
        }

        // Lee esta página y encola la siguiente (auto-propagación). Un throw (BD caída) propaga → reentrega.
        var page = pageChain.readAndChain(envelope, item);

        var outcome = ConsumeResult.PROCESSED;
        if (page.isSlice()) {
            var records = page.records();
            var context = new TaskContext(envelope.processExecutionId(), envelope.taskDefinitionId());
            hydrateContext(context, item.taskOutputs(), item.metadata(), item.executionVariables());
            // §6: re-resuelve los ${secret:} de la config de la página en el punto-de-uso (viajó con placeholders).
            var result = batchProvider.executeRecords(context, resolveSecrets(item.configuration()), records, null);
            if (result.suspended()) {
                failSlice(envelope, "una página no puede suspenderse en el consumer", continueOnFailure);
                return ConsumeResult.DEAD;
            }
            if (!result.success()) {
                failSlice(envelope, result.details(), continueOnFailure);
                outcome = ConsumeResult.FAILED;
            } else {
                gather.commitCompletedSlice(envelope, writeOutputs(result.outputs()), result.details())
                        .filter(TaskAsyncDispatchRepository.SliceProgress::terminal)
                        .ifPresent(p -> resumeTaskOnTerminal(envelope, p, continueOnFailure));
            }
        }
        if (page.last()) {
            // Última página: fija el total. Si todas las slices ya están contadas, ESTE seal cierra el
            // scatter (ningún evento de slice futuro lo haría) → reanuda la tarea una vez.
            gather.sealScatter(envelope.processExecutionId(), envelope.taskDefinitionId(), page.total())
                    .filter(TaskAsyncDispatchRepository.SliceProgress::terminal)
                    .ifPresent(p -> resumeTaskOnTerminal(envelope, p, continueOnFailure));
        }
        return outcome;
    }

    /**
     * Resuelve el provider del envelope como {@link BatchTaskProvider} para el camino scatter (slice/page).
     * Si el tipo no resuelve o no es batch, registra el fallo de la slice (que la lleva a DEAD si cierra el
     * scatter) y devuelve vacío para que el caller corte con {@code ConsumeResult.DEAD}. Unifica la
     * resolución que antes estaba duplicada verbatim entre {@code consumeSlice} y {@code consumePage} (DRY).
     */
    private Optional<BatchTaskProvider> resolveBatchProvider(AsyncTaskEnvelope envelope,
                                                             boolean continueOnFailure) {
        TaskProvider provider;
        try {
            provider = providers.resolve(envelope.taskType());
        } catch (IllegalArgumentException unknown) {
            failSlice(envelope, unknown.getMessage(), continueOnFailure);
            return Optional.empty();
        }
        if (provider instanceof BatchTaskProvider batchProvider) {
            return Optional.of(batchProvider);
        }
        failSlice(envelope, "el tipo '" + envelope.taskType() + "' no es BatchTaskProvider", continueOnFailure);
        return Optional.empty();
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

    /**
     * Rehidrata en el context (camino once, Nivel 3) el contexto serializable capturado al suspender la
     * tarea por despacho async, leído de la continuación persistida vía el puerto de completación.
     */
    private void hydrateOnceContext(TaskContext context, AsyncTaskEnvelope envelope) {
        var suspended = completion.loadSuspendedContext(
                envelope.processExecutionId(), envelope.taskDefinitionId());
        if (suspended.taskOutputs() != null && !suspended.taskOutputs().isEmpty()) {
            context.attributes().put("taskOutputs", suspended.taskOutputs());
        }
        if (suspended.executionVariables() != null && !suspended.executionVariables().isEmpty()) {
            context.attributes().put("executionVariables", suspended.executionVariables());
        }
    }

    /** Rehidrata en el context el contexto serializable propagado en la slice (Nivel 2). */
    private void hydrateSliceContext(TaskContext context, AsyncSliceWorkItem item) {
        hydrateContext(context, item.taskOutputs(), item.metadata(), item.executionVariables());
    }

    /** Pone en el context los atributos serializables no nulos/no vacíos (slice y page). */
    private void hydrateContext(TaskContext context, Map<String, Object> taskOutputs,
                                Map<String, Object> metadata, Map<String, String> executionVariables) {
        if (taskOutputs != null && !taskOutputs.isEmpty()) {
            context.attributes().put("taskOutputs", taskOutputs);
        }
        if (metadata != null && !metadata.isEmpty()) {
            context.attributes().put("metadata", metadata);
        }
        if (executionVariables != null && !executionVariables.isEmpty()) {
            context.attributes().put("executionVariables", executionVariables);
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

    /**
     * §6: re-resuelve los {@code ${secret:...}} de la config justo antes de ejecutar (punto-de-uso). El
     * envelope/slice viaja con los placeholders para no persistir secretos en el outbox ni en el broker;
     * aquí se resuelven contra el store. Sin referencias inline es un no-op (la config queda igual), así que
     * los providers actuales (MT101_STATUS por {@code connectionRef}) no cambian de comportamiento.
     */
    private Map<String, Object> resolveSecrets(Map<String, Object> configuration) {
        return configurationMapper.resolveSecretsIn(configuration);
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
