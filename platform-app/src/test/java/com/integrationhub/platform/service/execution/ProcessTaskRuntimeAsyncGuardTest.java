package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.async.AsyncTaskDispatchService;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.task.AsyncOffloadSupport;
import com.integrationhub.platform.spi.task.SuspendableTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * ADR-015: el motor <b>lanza</b> (sin degradar a síncrono ni dejar que el consumer marque DEAD/no-op)
 * cuando se pide async sobre un provider que no lo soporta para el {@code executionMode} dado. La
 * capacidad la declara el provider ({@link AsyncOffloadSupport}); un tipo marcado async que no la
 * soporta es un error de configuración que debe fallar fuerte.
 */
class ProcessTaskRuntimeAsyncGuardTest {

    private TaskProviderRegistry taskProviderRegistry;
    private FileReadRuntimeSupport fileReadRuntimeSupport;
    private TaskOutputRegistry taskOutputRegistry;
    private AsyncTaskDispatchService asyncTaskDispatchService;
    private ProcessTaskRuntimeService service;

    @BeforeEach
    void setUp() {
        var sourceProviderRegistry = mock(SourceProviderRegistry.class);
        var readerProviderRegistry = mock(ReaderProviderRegistry.class);
        taskProviderRegistry = mock(TaskProviderRegistry.class);
        fileReadRuntimeSupport = mock(FileReadRuntimeSupport.class);
        taskOutputRegistry = mock(TaskOutputRegistry.class);
        var taskInputResolver = mock(TaskInputResolver.class);
        asyncTaskDispatchService = mock(AsyncTaskDispatchService.class);

        service = new ProcessTaskRuntimeService(
                sourceProviderRegistry,
                readerProviderRegistry,
                taskProviderRegistry,
                fileReadRuntimeSupport,
                taskOutputRegistry,
                taskInputResolver,
                asyncTaskDispatchService,
                mock(com.integrationhub.platform.repository.ProcessTaskExecutionRepository.class));

        when(fileReadRuntimeSupport.configuration(any())).thenReturn(new HashMap<>());
        // Un envelope presente ⇒ se pidió async y el feature está activo: el guard debe decidir.
        when(asyncTaskDispatchService.prepare(any(), any(), any(), any()))
                .thenReturn(Optional.of(new AsyncTaskEnvelope(
                        "t", 1L, 1L, "T", "KAFKA", "k", 1, "{}", Map.of())));
    }

    private ProcessTaskRuntimeService.TaskRunResult run(String executionMode) {
        var plan = new ProcessExecutionStateService.TaskPlan(
                1L, 1, "ANY_TYPE", "{}", null, null, null, null, null, null, null);
        return service.runTask(1L, plan, null, null, Map.of(), new HashMap<>(), List.of(), "MANUAL");
    }

    private void stub(String executionMode, TaskProvider provider) {
        when(taskOutputRegistry.executionMode(any())).thenReturn(executionMode);
        when(taskProviderRegistry.resolve(anyString())).thenReturn(provider);
    }

    @Test
    void throwsWhenUnsupportedProviderIsDispatchedAsync() {
        stub("once", new UnsupportedProvider());
        var ex = assertThrows(IllegalStateException.class, () -> run("once"));
        assertTrue(ex.getMessage().contains("no soporta ejecución async"), ex.getMessage());
    }

    @Test
    void throwsWhenSuspendableProviderWithoutCapabilityIsDispatchedAsync() {
        // Suspendible con capacidad UNSUPPORTED (p.ej. RemoteTaskProvider): sigue bloqueado.
        stub("once", new SuspendableProvider());
        var ex = assertThrows(IllegalStateException.class, () -> run("once"));
        assertTrue(ex.getMessage().contains("no soporta ejecución async"), ex.getMessage());
    }

    @Test
    void allowsSupportedSuspendableProviderDispatchedAsyncOnce() {
        // Nivel 3: un suspendible SUPPORTED en once SÍ se offloada (el motor lo re-suspende si suspende).
        stub("once", new SupportedSuspendableProvider());
        var result = assertDoesNotThrow(() -> run("once"));
        assertNotNull(result);
    }

    @Test
    void throwsWhenSuspendableProviderIsDispatchedInScatterMode() {
        // batch requiere input en la config para llegar al guard (si no, falla antes por "requires input").
        var config = new HashMap<String, Object>();
        config.put("input", Map.of("source", "task-output"));
        when(fileReadRuntimeSupport.configuration(any())).thenReturn(config);
        stub("batch", new SupportedSuspendableProvider());
        var ex = assertThrows(IllegalStateException.class, () -> run("batch"));
        assertTrue(ex.getMessage().contains("scatter"), ex.getMessage());
    }

    @Test
    void throwsWhenSliceOnlyProviderIsDispatchedInOnceMode() {
        stub("once", new SliceOnlyProvider());
        var ex = assertThrows(IllegalStateException.class, () -> run("once"));
        assertTrue(ex.getMessage().contains("scatter"), ex.getMessage());
    }

    @Test
    void allowsSupportedProviderDispatchedAsyncOnce() {
        stub("once", new SupportedProvider());
        var result = assertDoesNotThrow(() -> run("once"));
        assertNotNull(result);
    }

    // ---- providers de prueba, uno por capacidad ----

    private static class UnsupportedProvider implements TaskProvider {
        @Override public String type() { return "ANY_TYPE"; }
        @Override public TaskResult execute(TaskContext c, Map<String, Object> cfg) { return TaskResult.success("ok"); }
        // asyncOffloadSupport() default = UNSUPPORTED
    }

    private static class SliceOnlyProvider implements TaskProvider {
        @Override public String type() { return "ANY_TYPE"; }
        @Override public TaskResult execute(TaskContext c, Map<String, Object> cfg) { return TaskResult.success("ok"); }
        @Override public AsyncOffloadSupport asyncOffloadSupport() { return AsyncOffloadSupport.SLICE_ONLY; }
    }

    private static class SupportedProvider implements TaskProvider {
        @Override public String type() { return "ANY_TYPE"; }
        @Override public TaskResult execute(TaskContext c, Map<String, Object> cfg) { return TaskResult.success("ok"); }
        @Override public AsyncOffloadSupport asyncOffloadSupport() { return AsyncOffloadSupport.SUPPORTED; }
    }

    private static class SuspendableProvider implements SuspendableTaskProvider {
        @Override public String type() { return "ANY_TYPE"; }
        @Override public TaskResult execute(TaskContext c, Map<String, Object> cfg) { return TaskResult.success("ok"); }
        @Override public TaskResult resume(TaskContext c, Map<String, Object> cfg, Map<String, Object> state) { return TaskResult.success("ok"); }
        // asyncOffloadSupport() default = UNSUPPORTED
    }

    private static class SupportedSuspendableProvider implements SuspendableTaskProvider {
        @Override public String type() { return "ANY_TYPE"; }
        @Override public TaskResult execute(TaskContext c, Map<String, Object> cfg) { return TaskResult.success("ok"); }
        @Override public TaskResult resume(TaskContext c, Map<String, Object> cfg, Map<String, Object> state) { return TaskResult.success("ok"); }
        @Override public AsyncOffloadSupport asyncOffloadSupport() { return AsyncOffloadSupport.SUPPORTED; }
    }
}
