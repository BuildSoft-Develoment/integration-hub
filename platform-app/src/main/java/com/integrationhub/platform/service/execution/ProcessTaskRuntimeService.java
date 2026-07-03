package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.async.AsyncPageWorkItem;
import com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService;
import com.integrationhub.platform.service.execution.async.AsyncTaskDispatchService;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProcessTaskRuntimeService {

    private static final Logger LOG = Logger.getLogger(ProcessTaskRuntimeService.class);

    private final SourceProviderRegistry sourceProviderRegistry;
    private final ReaderProviderRegistry readerProviderRegistry;
    private final TaskProviderRegistry taskProviderRegistry;
    private final FileReadRuntimeSupport fileReadRuntimeSupport;
    private final TaskOutputRegistry taskOutputRegistry;
    private final TaskInputResolver taskInputResolver;
    private final AsyncTaskDispatchService asyncTaskDispatchService;
    private final com.integrationhub.platform.repository.TaskSyncProgressRepository syncProgressRepository;

    /** Cada cuántos slices se persiste el progreso sync (throttle: a 1M/batch no se escribe por lote). */
    private static final int PROGRESS_EVERY_N_SLICES = 10;

    public ProcessTaskRuntimeService(SourceProviderRegistry sourceProviderRegistry,
                                     ReaderProviderRegistry readerProviderRegistry,
                                     TaskProviderRegistry taskProviderRegistry,
                                     FileReadRuntimeSupport fileReadRuntimeSupport,
                                     TaskOutputRegistry taskOutputRegistry,
                                     TaskInputResolver taskInputResolver,
                                     AsyncTaskDispatchService asyncTaskDispatchService,
                                     com.integrationhub.platform.repository.TaskSyncProgressRepository syncProgressRepository) {
        this.sourceProviderRegistry = sourceProviderRegistry;
        this.readerProviderRegistry = readerProviderRegistry;
        this.taskProviderRegistry = taskProviderRegistry;
        this.fileReadRuntimeSupport = fileReadRuntimeSupport;
        this.taskOutputRegistry = taskOutputRegistry;
        this.taskInputResolver = taskInputResolver;
        this.asyncTaskDispatchService = asyncTaskDispatchService;
        this.syncProgressRepository = syncProgressRepository;
    }

    @Transactional(Transactional.TxType.NOT_SUPPORTED)
    public TaskRunResult runTask(Long processExecutionId,
                                 ProcessExecutionStateService.TaskPlan taskPlan,
                                 SourcePayload sourcePayload,
                                 ReadResult readResult,
                                 Map<String, String> executionVariables,
                                 Map<String, Object> taskOutputs,
                                 List<String> selectedFileReferences,
                                 String triggerSource) {
        var configuration = fileReadRuntimeSupport.configuration(taskPlan.configurationJson());
        taskOutputRegistry.taskRef(taskPlan, configuration);
        var executionMode = taskOutputRegistry.executionMode(configuration);
        taskOutputRegistry.registerMetadata(taskOutputs, processExecutionId, taskPlan, configuration, triggerSource);

        if (TaskType.FILE_READ.equals(taskPlan.taskType())) {
            return runFileReadTask(taskPlan, executionVariables, selectedFileReferences);
        }

        var provider = taskProviderRegistry.resolve(taskPlan.taskType());
        if (requiresRecordInput(executionMode) && !(configuration.get("input") instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Task " + taskOutputRegistry.taskRef(taskPlan, configuration)
                    + " requires input for executionMode " + executionMode);
        }

        // ADR-015 Etapa 3: si la tarea está marcada async (y el feature está activo), se offloada al
        // broker en vez de ejecutarse in-process. Gated OFF por defecto → sin cambio de comportamiento.
        var asyncEnvelope = asyncTaskDispatchService.prepare(
                processExecutionId, taskPlan.taskDefinitionId(), taskPlan.taskType(), configuration);
        if (asyncEnvelope.isPresent()) {
            guardAsyncOffloadable(provider, taskPlan.taskType(), executionMode);
            var envelope = asyncEnvelope.get();
            if (requiresRecordInput(executionMode)) {
                // Opción B (scatter): reparte los records en N slices (N work-items) en vez de offloadar
                // la tarea como una unidad. El tracker N→1 los agrega y reanuda la tarea al cerrar.
                var resolvedInput = taskInputResolver.resolve(configuration, taskOutputs);
                var metadata = taskOutputRegistry.taskMetadata(
                        processExecutionId, taskPlan, configuration, triggerSource);
                if (resolvedInput.tableInput() != null) {
                    // Input por table-streaming (N desconocido): page-chain. Se encola una página semilla
                    // y cada consumer encola la siguiente (keyset paging) → dispatch distribuido, memoria
                    // acotada, recuperación por at-least-once. El scatter se abre open-ended y se sella al
                    // agotar la tabla.
                    var table = resolvedInput.tableInput();
                    var seed = AsyncPageWorkItem.seed(table.tableName(), table.connectionRef(), table.orderBy(),
                            table.filters(), configuredBatchSize(configuration), configuration,
                            taskOutputs, metadata, executionVariables);
                    var scatter = AsyncSliceDispatchService.ScatterDispatch.streaming(
                            processExecutionId, taskPlan.taskDefinitionId(), taskPlan.taskType(),
                            envelope.transport(), seed);
                    return TaskRunResult.suspendedScatter(
                            "Tarea " + taskPlan.taskType() + " en scatter por table-streaming (page-chain) por "
                                    + envelope.transport(),
                            Map.of("scatterDispatch", true, "streaming", true, "transport", envelope.transport()),
                            scatter);
                }
                var records = resolvedInput.readResult() == null
                        ? List.<ReadRecord>of()
                        : resolvedInput.readResult().records();
                var slices = sliceRecords(records, configuredBatchSize(configuration));
                if (slices.isEmpty()) {
                    return TaskRunResult.generic(true, "sin registros para repartir", sourcePayload, readResult, Map.of());
                }
                // Propaga el contexto serializable a cada slice (Nivel 2): outputs de tareas origen,
                // metadata y variables de ejecución; el consumer reconstruye el TaskContext con ellos.
                var scatter = AsyncSliceDispatchService.ScatterDispatch.materialized(
                        processExecutionId, taskPlan.taskDefinitionId(), taskPlan.taskType(),
                        envelope.transport(), configuration, slices,
                        taskOutputs, metadata, executionVariables);
                return TaskRunResult.suspendedScatter(
                        "Tarea " + taskPlan.taskType() + " repartida en " + slices.size() + " slices async por "
                                + envelope.transport(),
                        Map.of("scatterDispatch", true, "totalSlices", slices.size(), "transport", envelope.transport()),
                        scatter);
            }
            // Etapa 3 (per-task once): el enqueue lo hace el motor atómicamente con la suspensión.
            return TaskRunResult.suspendedAsync(
                    "Tarea " + taskPlan.taskType() + " despachada async por " + envelope.transport(),
                    Map.of("asyncDispatch", true,
                            "idempotencyKey", envelope.idempotencyKey(),
                            "transport", envelope.transport()),
                    envelope);
        }

        var resolvedInput = taskInputResolver.resolve(configuration, taskOutputs);

        if ("batch".equals(executionMode) || "per-record".equals(executionMode)) {
            var accumulator = taskInputResolver.executeByMode(
                    resolvedInput,
                    executionMode,
                    configuredBatchSize(configuration),
                    slice -> {
                        var sliceReadResult = new ReadResult(slice.records(), slice.records().size());
                        var taskContext = taskContext(
                                processExecutionId,
                                taskPlan,
                                configuration,
                                resolvedInput.sourcePayload(),
                                sliceReadResult,
                                executionVariables,
                                taskOutputs,
                                triggerSource
                        );
                        addBatchMetadata(taskContext, slice);
                        if (slice.records().size() == 1) {
                            taskContext.attributes().put("currentRecord", slice.records().getFirst().values());
                        }
                        var sliceResult = provider instanceof BatchTaskProvider batchTaskProvider
                                ? batchTaskProvider.executeRecords(taskContext, configuration, slice.records(), resolvedInput.sourcePayload())
                                : provider.execute(taskContext, configuration);
                        // Progreso en vivo (throttled): persiste el acumulado (slice.batchTo) cada N slices,
                        // en tx propia (runTask es NOT_SUPPORTED) → la UI de monitoreo lo ve durante la corrida.
                        // Best-effort: un fallo al persistir el progreso NO debe fallar la tarea (el trabajo
                        // real ya se hizo); se registra y se sigue.
                        if (slice.batchNumber() % PROGRESS_EVERY_N_SLICES == 0) {
                            try {
                                syncProgressRepository.upsert(
                                        processExecutionId, taskPlan.taskDefinitionId(), slice.batchTo());
                            } catch (RuntimeException progressError) {
                                LOG.debugf(progressError, "No se pudo persistir el progreso sync de exec=%d task=%d",
                                        processExecutionId, taskPlan.taskDefinitionId());
                            }
                        }
                        return sliceResult;
                    }
            );
            return TaskRunResult.generic(accumulator.success(), accumulator.details(),
                    sourcePayload, readResult, accumulator.outputs());
        }

        var taskContext = taskContext(
                processExecutionId,
                taskPlan,
                configuration,
                resolvedInput.sourcePayload(),
                resolvedInput.readResult(),
                executionVariables,
                taskOutputs,
                triggerSource
        );
        if (resolvedInput.readResult() != null && resolvedInput.readResult().records().size() == 1) {
            taskContext.attributes().put("currentRecord", resolvedInput.readResult().records().getFirst().values());
        }
        var result = provider.execute(taskContext, configuration);
        if (result.suspended()) {
            return TaskRunResult.suspended(result.details(), result.suspendedState());
        }
        return TaskRunResult.generic(result.success(), result.details(), sourcePayload, readResult, result.outputs());
    }

    private boolean requiresRecordInput(String executionMode) {
        return "batch".equals(executionMode) || "per-record".equals(executionMode);
    }

    /**
     * ADR-015: verifica que el provider soporte offload async para el {@code executionMode} pedido.
     * Si no lo soporta, <b>lanza</b> (no degrada a síncrono en silencio ni deja que el consumer marque
     * DEAD/no-op): async es opt-in por capacidad ({@link AsyncOffloadSupport}) y un tipo marcado async
     * que no la soporta es un error de configuración que debe fallar fuerte y visible.
     */
    private void guardAsyncOffloadable(TaskProvider provider, String taskType, String executionMode) {
        var scatter = requiresRecordInput(executionMode);
        // Nivel 3: un SuspendableTaskProvider SÍ es offloadable en 'once' (el consumer ejecuta el primer
        // intento y, si suspende, la tarea se re-suspende para callback/scheduler). Pero NO en scatter: la
        // re-suspensión no aplica a una slice; una slice que suspende va a DEAD. Se bloquea explícito.
        if (provider instanceof SuspendableTaskProvider && scatter) {
            throw new IllegalStateException("La tarea suspendible '" + taskType + "' no soporta async en modo "
                    + "distribuido (scatter): la re-suspensión solo aplica a executionMode 'once'.");
        }
        var support = provider.asyncOffloadSupport();
        var allowed = switch (support) {
            case SUPPORTED -> true;
            case SLICE_ONLY -> scatter;
            case UNSUPPORTED -> false;
        };
        if (!allowed) {
            var detail = support == AsyncOffloadSupport.SLICE_ONLY
                    ? " en modo '" + executionMode + "': solo es offloadable como scatter (executionMode "
                            + "batch/per-record, donde los records viajan en los slices)."
                    : ": depende de contexto en vivo no propagable por el broker (readResult/taskOutputs/"
                            + "executionVariables/sourcePayload). Ejecútela síncrona.";
            throw new IllegalStateException("La tarea '" + taskType + "' no soporta ejecución async" + detail);
        }
    }

    private TaskContext taskContext(Long processExecutionId,
                                    ProcessExecutionStateService.TaskPlan taskPlan,
                                    Map<String, Object> configuration,
                                    SourcePayload sourcePayload,
                                    ReadResult readResult,
                                    Map<String, String> executionVariables,
                                    Map<String, Object> taskOutputs,
                                    String triggerSource) {
        var taskContext = new TaskContext(processExecutionId, taskPlan.taskDefinitionId());
        if (sourcePayload != null) {
            taskContext.attributes().put("sourcePayload", sourcePayload);
        }
        if (readResult != null) {
            taskContext.attributes().put("readResult", readResult);
        }
        if (executionVariables != null && !executionVariables.isEmpty()) {
            taskContext.attributes().put("executionVariables", executionVariables);
        }
        if (taskOutputs != null && !taskOutputs.isEmpty()) {
            taskContext.attributes().put("taskOutputs", taskOutputs);
        }
        var metadata = taskOutputRegistry.taskMetadata(processExecutionId, taskPlan, configuration, triggerSource);
        taskContext.attributes().put("metadata", metadata);
        return taskContext;
    }

    /** Parte los records en slices de {@code batchSize} para el scatter async (Opción B). */
    private List<List<ReadRecord>> sliceRecords(List<ReadRecord> records, int batchSize) {
        var size = Math.max(batchSize, 1);
        var slices = new ArrayList<List<ReadRecord>>();
        for (var from = 0; from < records.size(); from += size) {
            slices.add(List.copyOf(records.subList(from, Math.min(records.size(), from + size))));
        }
        return slices;
    }

    @SuppressWarnings("unchecked")
    private int configuredBatchSize(Map<String, Object> configuration) {
        var input = configuration.get("input") instanceof Map<?, ?> rawInput
                ? (Map<String, Object>) rawInput
                : Map.<String, Object>of();
        // Lote funcional de lectura/proceso: input.batchSize > configuration.batchSize > default.
        // NO cae a jdbcBatchSize (eso es el lote de INSERT de DB_WRITE, concepto distinto; P2.1).
        return intValue(
                input.get("batchSize"),
                intValue(configuration.get("batchSize"), 1000)
        );
    }

    private void addBatchMetadata(TaskContext taskContext, TaskInputResolver.BatchSlice slice) {
        if (!(taskContext.attributes().get("metadata") instanceof Map<?, ?> rawMetadata)) {
            return;
        }
        @SuppressWarnings("unchecked")
        var metadata = (Map<String, Object>) rawMetadata;
        metadata.put("_batchNumber", slice.batchNumber());
        metadata.put("_batchSize", slice.records().size());
        metadata.put("_batchFrom", slice.batchFrom());
        metadata.put("_batchTo", slice.batchTo());
    }

    private int intValue(Object value, int defaultValue) {
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private TaskRunResult runFileReadTask(ProcessExecutionStateService.TaskPlan taskPlan,
                                          Map<String, String> executionVariables,
                                          List<String> selectedFileReferences) {
        if (taskPlan.sourceType() == null || taskPlan.readerType() == null) {
            throw new IllegalArgumentException("FILE_READ task requires linked sourceDefinition and readerDefinition");
        }
        var sourceProvider = sourceProviderRegistry.resolve(taskPlan.sourceType());
        var readerProvider = readerProviderRegistry.resolve(taskPlan.readerType());
        var sourceConfiguration = fileReadRuntimeSupport.sourceConfiguration(
                taskPlan.sourceConfigurationJson(),
                taskPlan.configurationJson(),
                executionVariables
        );
        var selectedFiles = fileReadRuntimeSupport.filterSelectedFiles(
                sourceProvider.selectFiles(sourceConfiguration),
                selectedFileReferences
        );
        if (selectedFiles.isEmpty()) {
            throw new IllegalStateException("No source files were selected");
        }
        var nextSourcePayload = sourceProvider.openFile(selectedFiles.getFirst(), sourceConfiguration);
        var nextReadResult = fileReadRuntimeSupport.collectReadResult(
                readerProvider,
                nextSourcePayload,
                fileReadRuntimeSupport.configuration(taskPlan.readerConfigurationJson())
        );
        return TaskRunResult.fileRead(nextSourcePayload, nextReadResult);
    }

    public record TaskRunResult(
            boolean success,
            String details,
            SourcePayload sourcePayload,
            ReadResult readResult,
            Map<String, Object> outputs,
            boolean fileRead,
            boolean suspended,
            Map<String, Object> suspendedState,
            com.integrationhub.platform.task.AsyncTaskEnvelope asyncDispatch,
            com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService.ScatterDispatch scatterDispatch
    ) {
        static TaskRunResult fileRead(SourcePayload sourcePayload, ReadResult readResult) {
            return new TaskRunResult(true, null, sourcePayload, readResult, Map.of(), true, false, Map.of(), null, null);
        }

        static TaskRunResult generic(boolean success, String details, SourcePayload sourcePayload, ReadResult readResult, Map<String, Object> outputs) {
            return new TaskRunResult(success, details, sourcePayload, readResult,
                    outputs == null ? Map.of() : new LinkedHashMap<>(outputs),
                    false, false, Map.of(), null, null);
        }

        /**
         * Resultado de una tarea {@link com.integrationhub.platform.spi.task.SuspendableTaskProvider}
         * que retorno {@link com.integrationhub.platform.spi.task.TaskResult#suspended}.
         * El engine genera el token y persiste el state JSON-serializado.
         *
         * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
         */
        static TaskRunResult suspended(String details, Map<String, Object> suspendedState) {
            return new TaskRunResult(true, details, null, null, Map.of(), false, true,
                    suspendedState == null ? Map.of() : new LinkedHashMap<>(suspendedState), null, null);
        }

        /**
         * Suspensión por <b>despacho async</b> (ADR-015): la tarea se offloada a un broker. El engine
         * persiste la suspensión y encola {@code asyncDispatch} en el outbox <b>en la misma
         * transacción</b> (transactional outbox), para que la trama nunca sea visible sin su suspensión.
         */
        static TaskRunResult suspendedAsync(String details, Map<String, Object> suspendedState,
                                            com.integrationhub.platform.task.AsyncTaskEnvelope asyncDispatch) {
            return new TaskRunResult(true, details, null, null, Map.of(), false, true,
                    suspendedState == null ? Map.of() : new LinkedHashMap<>(suspendedState), asyncDispatch, null);
        }

        /**
         * Suspensión por <b>scatter async</b> (Opción B): la tarea batch/per-record se reparte en N
         * slices. El engine abre el tracker N→1 y encola los N work-items <b>en la misma transacción</b>
         * que la suspensión (atómico: nunca hay slices visibles sin su tracker ni su suspensión).
         */
        static TaskRunResult suspendedScatter(String details, Map<String, Object> suspendedState,
                                              com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService.ScatterDispatch scatterDispatch) {
            return new TaskRunResult(true, details, null, null, Map.of(), false, true,
                    suspendedState == null ? Map.of() : new LinkedHashMap<>(suspendedState), null, scatterDispatch);
        }
    }
}
