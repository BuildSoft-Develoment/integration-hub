package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.repository.TaskSyncProgressRepository;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.TaskInputResolver.BatchSlice;
import com.integrationhub.platform.service.execution.TaskInputResolver.ResolvedInput;
import com.integrationhub.platform.service.execution.TaskInputResolver.TaskExecutionAccumulator;
import com.integrationhub.platform.service.execution.async.AsyncTaskDispatchService;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Progreso sync en vivo del camino {@code executeByMode} (batch/table-input): el motor upsertea el
 * acumulado {@code batchTo} cada {@code PROGRESS_EVERY_N_SLICES} slices, en su propia tx, best-effort.
 * Cierra el call-site que faltaba cubrir (el upsert del repo se prueba aparte en AsyncTaskDlqIT).
 */
class ProcessTaskRuntimeSyncProgressTest {

    private TaskInputResolver taskInputResolver;
    private TaskSyncProgressRepository syncProgressRepository;
    private ProcessTaskRuntimeService service;

    @BeforeEach
    void setUp() {
        var sourceProviderRegistry = mock(SourceProviderRegistry.class);
        var readerProviderRegistry = mock(ReaderProviderRegistry.class);
        var taskProviderRegistry = mock(TaskProviderRegistry.class);
        var fileReadRuntimeSupport = mock(FileReadRuntimeSupport.class);
        var taskOutputRegistry = mock(TaskOutputRegistry.class);
        taskInputResolver = mock(TaskInputResolver.class);
        var asyncTaskDispatchService = mock(AsyncTaskDispatchService.class);
        syncProgressRepository = mock(TaskSyncProgressRepository.class);

        service = new ProcessTaskRuntimeService(
                sourceProviderRegistry,
                readerProviderRegistry,
                taskProviderRegistry,
                fileReadRuntimeSupport,
                taskOutputRegistry,
                taskInputResolver,
                asyncTaskDispatchService,
                syncProgressRepository);

        // batch requiere "input" en la config (guard de línea 81); no hay async (prepare vacío).
        var config = new HashMap<String, Object>();
        config.put("input", Map.of("source", "task-output"));
        when(fileReadRuntimeSupport.configuration(any())).thenReturn(config);
        when(taskOutputRegistry.executionMode(any())).thenReturn("batch");
        when(taskProviderRegistry.resolve(anyString())).thenReturn(mock(TaskProvider.class));
        when(asyncTaskDispatchService.prepare(any(), any(), any(), any())).thenReturn(Optional.empty());
        when(taskInputResolver.resolve(any(), any()))
                .thenReturn(new ResolvedInput(null, new ReadResult(List.of(), 0), null));

        // Simula 12 slices (batchNumber 0..11, batchTo acumulado = (n+1)*10) invocando el executor real.
        when(taskInputResolver.executeByMode(any(), eq("batch"), anyInt(), any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Function<BatchSlice, TaskResult> executor = invocation.getArgument(3, Function.class);
            for (int n = 0; n < 12; n++) {
                executor.apply(new BatchSlice(List.of(), n, n * 10, (n + 1) * 10));
            }
            return TaskExecutionAccumulator.single(TaskResult.success("ok"));
        });
    }

    private ProcessTaskRuntimeService.TaskRunResult run() {
        var plan = new ProcessExecutionStateService.TaskPlan(
                1L, 1, "ANY_TYPE", "{}", null, null, null, null, null, null, null);
        return service.runTask(1L, plan, null, null, Map.of(), new HashMap<>(), List.of(), "MANUAL");
    }

    @Test
    void upsertsAccumulatedProgressEveryTenSlices() {
        run();

        // batchNumber 0 y 10 cumplen % 10 == 0 → upsert del batchTo de esos slices (10 y 110).
        verify(syncProgressRepository).upsert(eq(1L), anyLong(), eq(10L));
        verify(syncProgressRepository).upsert(eq(1L), anyLong(), eq(110L));
        // Sólo esos dos (no uno por slice) → throttling.
        verify(syncProgressRepository, times(2)).upsert(anyLong(), anyLong(), anyLong());
        // El slice 5 (batchTo=60) NO se persiste.
        verify(syncProgressRepository, never()).upsert(anyLong(), anyLong(), eq(60L));
    }

    @Test
    void progressWriteFailureDoesNotFailTheTask() {
        doThrow(new RuntimeException("db down")).when(syncProgressRepository)
                .upsert(anyLong(), anyLong(), anyLong());

        // Best-effort: el trabajo real ya se hizo; un fallo del progreso no debe romper la tarea.
        var result = assertDoesNotThrow(this::run);
        assertNotNull(result);
    }
}
