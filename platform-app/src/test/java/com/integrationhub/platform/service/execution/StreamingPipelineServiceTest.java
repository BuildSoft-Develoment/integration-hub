package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.provider.task.dbwrite.DbWriteTaskProvider;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.service.source.SourceProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadBatch;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.source.SourceProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StreamingPipelineServiceTest {

    @Test
    void pipelineRunsOutsideJtaTransaction() throws NoSuchMethodException {
        Method method = StreamingPipelineService.class.getMethod(
                "run",
                Long.class,
                ProcessExecutionStateService.TaskPlan.class,
                ProcessExecutionStateService.TaskPlan.class,
                Map.class,
                List.class
        );

        var transactional = method.getAnnotation(Transactional.class);

        assertEquals(Transactional.TxType.NOT_SUPPORTED, transactional.value());
    }

    @Test
    void pipelineStopsAtFirstErrorWhenPolicyIsFailFast() {
        var service = serviceForPolicy("failFast", false, List.of(
                new SelectedSourceFile("clientes_ok.txt", "/tmp/clientes_ok.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("clientes_fail.txt", "/tmp/clientes_fail.txt", "text/plain", 10L, Instant.now())
        ));

        var fileReadPlan = taskPlan("failFast", false);
        var dbWritePlan = dbWritePlan();

        var error = assertThrows(StreamingPipelineService.StreamingPipelineException.class,
                () -> service.run(1L, fileReadPlan, dbWritePlan, Map.of(), List.of()));

        assertEquals("clientes_fail.txt", error.failedFileName());
        assertEquals(1, error.completedFiles().size());
        assertEquals(2, error.selectedFiles().size());
        assertEquals(1, error.failedFiles().size());
        assertEquals(1, error.validCount());
    }

    @Test
    void pipelineContinuesAfterFileErrorWhenPolicyIsContinue() {
        var service = serviceForPolicy("continue", false, List.of(
                new SelectedSourceFile("clientes_fail.txt", "/tmp/clientes_fail.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("clientes_ok.txt", "/tmp/clientes_ok.txt", "text/plain", 10L, Instant.now())
        ));

        var fileReadPlan = taskPlan("continue", false);
        var dbWritePlan = dbWritePlan();

        var error = assertThrows(StreamingPipelineService.StreamingPipelineException.class,
                () -> service.run(1L, fileReadPlan, dbWritePlan, Map.of(), List.of()));

        assertEquals("clientes_fail.txt", error.failedFileName());
        assertEquals(1, error.completedFiles().size());
        assertEquals("clientes_ok.txt", error.completedFiles().getFirst().fileName());
        assertEquals(2, error.selectedFiles().size());
        assertEquals(1, error.failedFiles().size());
        assertEquals(1, error.validCount());
    }

    @Test
    void pipelineRunsInParallel() {
        var service = serviceForPolicy("failFast", true, List.of(
                new SelectedSourceFile("file1.txt", "/tmp/file1.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("file2.txt", "/tmp/file2.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("file3.txt", "/tmp/file3.txt", "text/plain", 10L, Instant.now())
        ));

        var fileReadPlan = taskPlan("failFast", true);
        var dbWritePlan = dbWritePlan();

        var result = service.run(1L, fileReadPlan, dbWritePlan, Map.of(), List.of());

        assertEquals(3, result.fileSummaries().size());
        assertEquals(3, result.readResult().recordCount());
    }

    private StreamingPipelineService serviceForPolicy(String policy, boolean parallel, List<SelectedSourceFile> selectedFiles) {
        var mapper = new JsonConfigurationMapper();
        var runtimeSupport = new FileReadRuntimeSupport(mapper);

        SourceProvider sourceProvider = new SourceProvider() {
            @Override
            public String type() { return "FILESYSTEM"; }

            @Override
            public List<SelectedSourceFile> selectFiles(Map<String, Object> configuration) {
                return selectedFiles;
            }

            @Override
            public SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration) {
                return SourcePayload.fromBytes(selectedFile.name(), selectedFile.name().getBytes(), selectedFile.mediaType());
            }
        };

        var sourceRegistry = new SourceProviderRegistry(null) {
            @Override
            public SourceProvider resolve(String type) { return sourceProvider; }
        };

        var readerRegistry = new ReaderProviderRegistry(null) {
            @Override
            public ReaderProvider resolve(String type) {
                return new ReaderProvider() {
                    @Override
                    public String type() { return "TXT"; }

                    @Override
                    public ReadResult readInBatches(SourcePayload payload, Map<String, Object> configuration, int batchSize, ReadBatchConsumer consumer) {
                        var values = new LinkedHashMap<String, Object>();
                        values.put("id", payload.name());
                        consumer.accept(new ReadBatch(payload.name(), 1, List.of(new ReadRecord(values))));
                        return new ReadResult(List.of(), 1, 0, List.of());
                    }
                };
            }
        };

        var dbWriteProvider = new DbWriteTaskProvider(null, null, null) {
            @Override
            public String type() { return "DB_WRITE"; }

            @Override
            public TaskResult executeRecords(TaskContext context, Map<String, Object> configuration, List<ReadRecord> records, SourcePayload sourcePayload) {
                if (sourcePayload != null && sourcePayload.name().contains("fail")) {
                    throw new IllegalStateException("Cannot insert records");
                }
                return TaskResult.success("ok");
            }
        };

        var taskProviderRegistry = new TaskProviderRegistry(null) {
            @Override
            public com.integrationhub.platform.spi.task.TaskProvider resolve(String type) {
                if ("DB_WRITE".equalsIgnoreCase(type)) return dbWriteProvider;
                return null;
            }
        };

        // Mock ManagedExecutor for unit test
        org.eclipse.microprofile.context.ManagedExecutor executor = new org.eclipse.microprofile.context.ManagedExecutor() {
            @Override public void execute(Runnable command) { command.run(); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> completedFuture(T value) { return java.util.concurrent.CompletableFuture.completedFuture(value); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> failedFuture(Throwable ex) { return java.util.concurrent.CompletableFuture.failedFuture(ex); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> supplyAsync(java.util.function.Supplier<T> supplier) { return java.util.concurrent.CompletableFuture.supplyAsync(supplier, this); }
            @Override public java.util.concurrent.CompletableFuture<Void> runAsync(Runnable runnable) { return java.util.concurrent.CompletableFuture.runAsync(runnable, this); }
            @Override public <U> java.util.concurrent.CompletionStage<U> completedStage(U value) { return java.util.concurrent.CompletableFuture.completedStage(value); }
            @Override public <U> java.util.concurrent.CompletionStage<U> failedStage(Throwable ex) { return java.util.concurrent.CompletableFuture.failedStage(ex); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> newIncompleteFuture() { return new java.util.concurrent.CompletableFuture<>(); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> copy(java.util.concurrent.CompletableFuture<T> f) { return f.copy(); }
            @Override public <T> java.util.concurrent.CompletionStage<T> copy(java.util.concurrent.CompletionStage<T> f) { return f.toCompletableFuture().copy(); }
            
            @Override public org.eclipse.microprofile.context.ThreadContext getThreadContext() { return null; }
            
            @Override public void shutdown() {}
            @Override public List<Runnable> shutdownNow() { return List.of(); }
            @Override public boolean isShutdown() { return false; }
            @Override public boolean isTerminated() { return false; }
            @Override public boolean awaitTermination(long timeout, java.util.concurrent.TimeUnit unit) { return true; }
            @Override public <T> java.util.concurrent.Future<T> submit(java.util.concurrent.Callable<T> task) { return null; }
            @Override public <T> java.util.concurrent.Future<T> submit(Runnable task, T result) { return null; }
            @Override public java.util.concurrent.Future<?> submit(Runnable task) { return null; }
            @Override public <T> List<java.util.concurrent.Future<T>> invokeAll(java.util.Collection<? extends java.util.concurrent.Callable<T>> tasks) { return null; }
            @Override public <T> List<java.util.concurrent.Future<T>> invokeAll(java.util.Collection<? extends java.util.concurrent.Callable<T>> tasks, long timeout, java.util.concurrent.TimeUnit unit) { return null; }
            @Override public <T> T invokeAny(java.util.Collection<? extends java.util.concurrent.Callable<T>> tasks) { return null; }
            @Override public <T> T invokeAny(java.util.Collection<? extends java.util.concurrent.Callable<T>> tasks, long timeout, java.util.concurrent.TimeUnit unit) { return null; }
        };

        return new StreamingPipelineService(
                sourceRegistry,
                readerRegistry,
                taskProviderRegistry,
                runtimeSupport,
                executor
        );
    }

    private ProcessExecutionStateService.TaskPlan taskPlan(String fileErrorPolicy, boolean parallel) {
        String sourceConfigurationJson = "{\"fileErrorPolicy\":\"" + fileErrorPolicy + "\", \"parallel\":" + parallel + "}";
        return new ProcessExecutionStateService.TaskPlan(
                10L, 1, TaskType.FILE_READ, "{}",
                100L, "Source QA", "FILESYSTEM", sourceConfigurationJson,
                200L, "TXT", "{}"
        );
    }

    private ProcessExecutionStateService.TaskPlan dbWritePlan() {
        return new ProcessExecutionStateService.TaskPlan(
                20L, 2, TaskType.DB_WRITE, "{\"targetTable\":\"public.cliente_target\",\"mode\":\"insert\"}",
                null, null, null, null, null, null, null
        );
    }
}
