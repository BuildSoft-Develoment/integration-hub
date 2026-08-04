package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.provider.task.dbwrite.DbWriteTaskProvider;
import com.integrationhub.platform.provider.task.dbwrite.DbWriteUpsertDialect;
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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers spec 003-diseno-y-ejecucion-procesos RF-004, RF-005 (la matriz de 003 declara esta clase
// y este test para RF-004)
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
        var service = serviceForPolicy("failFast", true, null, List.of(
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

    @Test
    void pipelineHonorsConfiguredMaxConcurrency() {
        var selectedFiles = List.of(
                new SelectedSourceFile("file1.txt", "/tmp/file1.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("file2.txt", "/tmp/file2.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("file3.txt", "/tmp/file3.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("file4.txt", "/tmp/file4.txt", "text/plain", 10L, Instant.now())
        );
        var maxObserved = new AtomicInteger();
        var inFlight = new AtomicInteger();
        var service = serviceForPolicy(
                "failFast",
                true,
                2,
                selectedFiles,
                sourcePayload -> {
                    var current = inFlight.incrementAndGet();
                    maxObserved.accumulateAndGet(current, Math::max);
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("Interrupted");
                    } finally {
                        inFlight.decrementAndGet();
                    }
                    return TaskResult.success("ok");
                },
                new AtomicInteger()
        );

        var result = service.run(1L, taskPlan("failFast", true, 2), dbWritePlan(), Map.of(), List.of());

        assertEquals(4, result.readResult().recordCount());
        assertTrue(maxObserved.get() <= 2, "Expected max concurrency <= 2 but was " + maxObserved.get());
    }

    @Test
    void pipelineRunsBatchesInParallelWithinSingleFile() {
        var selectedFiles = List.of(
                new SelectedSourceFile("clientes_big.txt", "/tmp/clientes_big.txt", "text/plain", 10L, Instant.now())
        );
        var maxObserved = new AtomicInteger();
        var inFlight = new AtomicInteger();
        var service = serviceForPolicy(
                "failFast",
                true,
                2,
                "batch",
                selectedFiles,
                readBatches(List.of(
                        List.of(Map.of("id", 1)),
                        List.of(Map.of("id", 2)),
                        List.of(Map.of("id", 3)),
                        List.of(Map.of("id", 4))
                )),
                sourcePayload -> {
                    var current = inFlight.incrementAndGet();
                    maxObserved.accumulateAndGet(current, Math::max);
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("Interrupted");
                    } finally {
                        inFlight.decrementAndGet();
                    }
                    return TaskResult.success("ok");
                },
                new AtomicInteger()
        );

        var result = service.run(1L, taskPlan("failFast", true, 2, "batch"), dbWritePlan(), Map.of(), List.of());

        assertEquals(4, result.readResult().recordCount());
        assertTrue(maxObserved.get() <= 2, "Expected batch concurrency <= 2 but was " + maxObserved.get());
        assertTrue(maxObserved.get() > 1, "Expected more than one batch in flight");
    }

    @Test
    void parallelFailFastStopsSchedulingNewFilesAfterFirstError() {
        var openCount = new AtomicInteger();
        var service = serviceForPolicy(
                "failFast",
                true,
                1,
                List.of(
                        new SelectedSourceFile("clientes_fail.txt", "/tmp/clientes_fail.txt", "text/plain", 10L, Instant.now()),
                        new SelectedSourceFile("clientes_ok_1.txt", "/tmp/clientes_ok_1.txt", "text/plain", 10L, Instant.now()),
                        new SelectedSourceFile("clientes_ok_2.txt", "/tmp/clientes_ok_2.txt", "text/plain", 10L, Instant.now())
                ),
                sourcePayload -> {
                    if (sourcePayload != null && sourcePayload.name().contains("fail")) {
                        throw new IllegalStateException("Cannot insert records");
                    }
                    return TaskResult.success("ok");
                },
                openCount
        );

        var error = assertThrows(StreamingPipelineService.StreamingPipelineException.class,
                () -> service.run(1L, taskPlan("failFast", true, 1), dbWritePlan(), Map.of(), List.of()));

        assertEquals("clientes_fail.txt", error.failedFileName());
        assertEquals(1, openCount.get());
    }

    private StreamingPipelineService serviceForPolicy(String policy,
                                                      boolean parallel,
                                                      List<SelectedSourceFile> selectedFiles) {
        return serviceForPolicy(policy, parallel, null, selectedFiles);
    }

    private StreamingPipelineService serviceForPolicy(String policy,
                                                      boolean parallel,
                                                      Integer maxConcurrency,
                                                      List<SelectedSourceFile> selectedFiles) {
        return serviceForPolicy(policy, parallel, maxConcurrency, "file", selectedFiles, defaultReaderBehavior(), sourcePayload -> {
            if (sourcePayload != null && sourcePayload.name().contains("fail")) {
                throw new IllegalStateException("Cannot insert records");
            }
            return TaskResult.success("ok");
        }, new AtomicInteger());
    }

    private StreamingPipelineService serviceForPolicy(String policy,
                                                      boolean parallel,
                                                      Integer maxConcurrency,
                                                      List<SelectedSourceFile> selectedFiles,
                                                      java.util.function.Function<SourcePayload, TaskResult> sinkBehavior,
                                                      AtomicInteger openCount) {
        return serviceForPolicy(policy, parallel, maxConcurrency, "file", selectedFiles, defaultReaderBehavior(), sinkBehavior, openCount);
    }

    private StreamingPipelineService serviceForPolicy(String policy,
                                                      boolean parallel,
                                                      Integer maxConcurrency,
                                                      String parallelMode,
                                                      List<SelectedSourceFile> selectedFiles,
                                                      ReaderProvider readerProvider,
                                                      java.util.function.Function<SourcePayload, TaskResult> sinkBehavior,
                                                      AtomicInteger openCount) {
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
                openCount.incrementAndGet();
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
                return readerProvider;
            }
        };

        // Subclase anonima que sustituye la escritura entera: nunca llega a resolver un dialecto de
        // upsert, asi que la lista vacia es lo honesto (si algun dia lo alcanzara, fallaria ruidoso).
        var dbWriteProvider = new DbWriteTaskProvider(null, null, null, List.<DbWriteUpsertDialect>of()) {
            @Override
            public String type() { return "DB_WRITE"; }

            @Override
            public TaskResult executeRecords(TaskContext context, Map<String, Object> configuration, List<ReadRecord> records, SourcePayload sourcePayload) {
                return sinkBehavior.apply(sourcePayload);
            }
        };

        var taskProviderRegistry = new TaskProviderRegistry(null) {
            @Override
            public com.integrationhub.platform.spi.task.TaskProvider resolve(String type) {
                if ("DB_WRITE".equalsIgnoreCase(type)) return dbWriteProvider;
                return null;
            }
        };

        ExecutorService delegate = parallel
                ? Executors.newCachedThreadPool()
                : Executors.newSingleThreadExecutor();
        org.eclipse.microprofile.context.ManagedExecutor executor = managedExecutor(delegate);

        // Repo de progreso no-op: la lógica de throttle/flush del reporter se prueba en SyncProgressReporterTest;
        // aquí sólo importa que el pipeline no reviente al reportar (no hay EntityManager en este unit test).
        var noOpSyncProgress = new com.integrationhub.platform.repository.TaskSyncProgressRepository() {
            @Override
            public void upsert(Long processExecutionId, Long taskDefinitionId, long processed) {
                // no-op
            }
        };

        return new StreamingPipelineService(
                sourceRegistry,
                readerRegistry,
                taskProviderRegistry,
                runtimeSupport,
                new StreamingPipelineWorker(runtimeSupport),
                executor,
                noOpSyncProgress
        );
    }

    private ReaderProvider defaultReaderBehavior() {
        return readBatches(List.of(List.of(Map.of("id", "default"))));
    }

    private ReaderProvider readBatches(List<List<Map<String, Object>>> batches) {
        return new ReaderProvider() {
            @Override
            public String type() { return "TXT"; }

            @Override
            public ReadResult readInBatches(SourcePayload payload, Map<String, Object> configuration, int batchSize, ReadBatchConsumer consumer) {
                var total = 0;
                var batchNumber = 1;
                for (var batchRecords : batches) {
                    var records = batchRecords.stream()
                            .map(values -> new ReadRecord(new LinkedHashMap<>(values)))
                            .toList();
                    consumer.accept(new ReadBatch(payload.name(), batchNumber++, records));
                    total += records.size();
                }
                return new ReadResult(List.of(), total, 0, List.of());
            }
        };
    }

    private org.eclipse.microprofile.context.ManagedExecutor managedExecutor(ExecutorService delegate) {
        return new org.eclipse.microprofile.context.ManagedExecutor() {
            @Override public void execute(Runnable command) { delegate.execute(command); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> completedFuture(T value) { return java.util.concurrent.CompletableFuture.completedFuture(value); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> failedFuture(Throwable ex) { return java.util.concurrent.CompletableFuture.failedFuture(ex); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> supplyAsync(java.util.function.Supplier<T> supplier) { return java.util.concurrent.CompletableFuture.supplyAsync(supplier, delegate); }
            @Override public java.util.concurrent.CompletableFuture<Void> runAsync(Runnable runnable) { return java.util.concurrent.CompletableFuture.runAsync(runnable, delegate); }
            @Override public <U> java.util.concurrent.CompletionStage<U> completedStage(U value) { return java.util.concurrent.CompletableFuture.completedStage(value); }
            @Override public <U> java.util.concurrent.CompletionStage<U> failedStage(Throwable ex) { return java.util.concurrent.CompletableFuture.failedStage(ex); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> newIncompleteFuture() { return new java.util.concurrent.CompletableFuture<>(); }
            @Override public <T> java.util.concurrent.CompletableFuture<T> copy(java.util.concurrent.CompletableFuture<T> f) { return f.copy(); }
            @Override public <T> java.util.concurrent.CompletionStage<T> copy(java.util.concurrent.CompletionStage<T> f) { return f.toCompletableFuture().copy(); }
            @Override public org.eclipse.microprofile.context.ThreadContext getThreadContext() { return null; }
            @Override public void shutdown() { delegate.shutdown(); }
            @Override public List<Runnable> shutdownNow() { return delegate.shutdownNow(); }
            @Override public boolean isShutdown() { return delegate.isShutdown(); }
            @Override public boolean isTerminated() { return delegate.isTerminated(); }
            @Override public boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException { return delegate.awaitTermination(timeout, unit); }
            @Override public <T> Future<T> submit(java.util.concurrent.Callable<T> task) { return delegate.submit(task); }
            @Override public <T> Future<T> submit(Runnable task, T result) { return delegate.submit(task, result); }
            @Override public Future<?> submit(Runnable task) { return delegate.submit(task); }
            @Override public <T> List<Future<T>> invokeAll(java.util.Collection<? extends java.util.concurrent.Callable<T>> tasks) throws InterruptedException { return delegate.invokeAll(tasks); }
            @Override public <T> List<Future<T>> invokeAll(java.util.Collection<? extends java.util.concurrent.Callable<T>> tasks, long timeout, TimeUnit unit) throws InterruptedException { return delegate.invokeAll(tasks, timeout, unit); }
            @Override public <T> T invokeAny(java.util.Collection<? extends java.util.concurrent.Callable<T>> tasks) throws InterruptedException, java.util.concurrent.ExecutionException { return delegate.invokeAny(tasks); }
            @Override public <T> T invokeAny(java.util.Collection<? extends java.util.concurrent.Callable<T>> tasks, long timeout, TimeUnit unit) throws InterruptedException, java.util.concurrent.ExecutionException, java.util.concurrent.TimeoutException { return delegate.invokeAny(tasks, timeout, unit); }
        };
    }

    private ProcessExecutionStateService.TaskPlan taskPlan(String fileErrorPolicy, boolean parallel, Integer maxConcurrency, String parallelMode) {
        var sourceConfiguration = new StringBuilder()
                .append("{\"fileErrorPolicy\":\"").append(fileErrorPolicy).append("\",")
                .append("\"parallel\":").append(parallel);
        if (maxConcurrency != null) {
            sourceConfiguration.append(",\"maxConcurrency\":").append(maxConcurrency);
        }
        if (parallelMode != null && !parallelMode.isBlank()) {
            sourceConfiguration.append(",\"parallelMode\":\"").append(parallelMode).append("\"");
        }
        sourceConfiguration.append("}");
        return new ProcessExecutionStateService.TaskPlan(
                10L, 1, TaskType.FILE_READ, "{}",
                100L, "Source QA", "FILESYSTEM", sourceConfiguration.toString(),
                200L, "TXT", "{}"
        );
    }

    private ProcessExecutionStateService.TaskPlan taskPlan(String fileErrorPolicy, boolean parallel, Integer maxConcurrency) {
        return taskPlan(fileErrorPolicy, parallel, maxConcurrency, "file");
    }

    private ProcessExecutionStateService.TaskPlan taskPlan(String fileErrorPolicy, boolean parallel) {
        return taskPlan(fileErrorPolicy, parallel, null);
    }

    private ProcessExecutionStateService.TaskPlan dbWritePlan() {
        return new ProcessExecutionStateService.TaskPlan(
                20L, 2, TaskType.DB_WRITE, "{\"targetTable\":\"public.cliente_target\",\"mode\":\"insert\"}",
                null, null, null, null, null, null, null
        );
    }
}
