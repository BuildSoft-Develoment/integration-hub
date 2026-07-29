package com.integrationhub.platform.service.execution.fastpath;

import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.service.JsonConfigurationMapper;
import com.integrationhub.platform.service.TaskProviderRegistry;
import com.integrationhub.platform.service.execution.ProcessExecutionAuditMapper;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import com.integrationhub.platform.service.execution.ProcessedSourceFileService;
import com.integrationhub.platform.service.execution.StreamingPipelineService;
import com.integrationhub.platform.service.execution.TaskOutputRegistry;
import com.integrationhub.platform.service.reader.ReaderProviderRegistry;
import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import com.integrationhub.platform.spi.source.SourcePayload;
import com.integrationhub.platform.spi.task.BatchTaskProvider;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.inject.Vetoed;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

// @covers RF-005 (reingenieria: prueba que cubre el/los RF en produccion)
class FileReadTaskFastPathTest {

    @Test
    void continuePolicyCompletesProcessWithErrorsWithoutRethrowing() {
        var execution = new ProcessExecution();
        var stateService = new RecordingStateService(execution);
        var processedSourceFileService = new RecordingProcessedSourceFileService();
        var taskProviderRegistry = new BatchTaskProviderRegistry();
        var auditMapper = new ProcessExecutionAuditMapper(new JsonConfigurationMapper());
        var pipelineService = new FailingStreamingPipelineService();

        var fastPath = new FileReadTaskFastPath(
                pipelineService,
                stateService,
                auditMapper,
                processedSourceFileService,
                taskProviderRegistry,
                new StreamingReaderProviderRegistry(),
                new TaskOutputRegistry(new JsonConfigurationMapper()),
                new com.integrationhub.platform.service.execution.async.TaskDispatchPlanner()
        );

        var result = fastPath.execute(
                77L,
                "tok",
                fileReadPlan("continue"),
                sinkPlan(),
                Map.of(),
                List.of(),
                "MANUAL",
                new LinkedHashMap<>()
        );

        assertSame(execution, result);
        assertEquals(2, stateService.completedWithErrorsCount.get());
        assertEquals(1, stateService.completedProcessWithErrorsCount.get());
        assertEquals(0, stateService.failedTaskCount.get());
        assertEquals(1, processedSourceFileService.recordPipelineFilesCount.get());
    }

    @Test
    void doesNotSupportRecordsProducingSinkBecauseItProducesMaterialOutputs() {
        var fastPath = new FileReadTaskFastPath(
                new FailingStreamingPipelineService(),
                new RecordingStateService(new ProcessExecution()),
                new ProcessExecutionAuditMapper(new JsonConfigurationMapper()),
                new RecordingProcessedSourceFileService(),
                new BatchTaskProviderRegistry(),
                new StreamingReaderProviderRegistry(),
                new TaskOutputRegistry(new JsonConfigurationMapper()),
                new com.integrationhub.platform.service.execution.async.TaskDispatchPlanner()
        );

        // MT101_PARSE publica un output `records` consumido downstream (p.ej. MT101_ROUTE);
        // el fast path no lo materializa, por eso no debe fusionarlo.
        assertFalse(fastPath.supports(fileReadPlan("fail"), mt101ParsePlan()));
        assertTrue(fastPath.supports(fileReadPlan("fail"), sinkPlan()));
    }

    @Test
    void doesNotSupportAsyncSinkSoItFallsToRunTaskWhichRejectsIt() {
        // ADR-015: una tarea async no debe fusionarse al fast path (se ejecutaria sincrona en
        // silencio, ignorando el flag). Al no soportarla, cae a runTask, que lanza el error explicito.
        var fastPath = new FileReadTaskFastPath(
                new FailingStreamingPipelineService(),
                new RecordingStateService(new ProcessExecution()),
                new ProcessExecutionAuditMapper(new JsonConfigurationMapper()),
                new RecordingProcessedSourceFileService(),
                new BatchTaskProviderRegistry(),
                new StreamingReaderProviderRegistry(),
                new TaskOutputRegistry(new JsonConfigurationMapper()),
                new com.integrationhub.platform.service.execution.async.TaskDispatchPlanner()
        );

        assertFalse(fastPath.supports(fileReadPlan("fail"), asyncSinkPlan()));
        // control: el mismo sink sin async si es elegible.
        assertTrue(fastPath.supports(fileReadPlan("fail"), sinkPlan()));
    }

    @Test
    void supportsRemoteReaderWhenItDeclaresStreamingCapability() {
        var fastPath = new FileReadTaskFastPath(
                new FailingStreamingPipelineService(),
                new RecordingStateService(new ProcessExecution()),
                new ProcessExecutionAuditMapper(new JsonConfigurationMapper()),
                new RecordingProcessedSourceFileService(),
                new BatchTaskProviderRegistry(),
                new StreamingReaderProviderRegistry(),
                new TaskOutputRegistry(new JsonConfigurationMapper()),
                new com.integrationhub.platform.service.execution.async.TaskDispatchPlanner()
        );

        assertTrue(fastPath.supports(fileReadPlan("fail", "REMOTE_CSV"), sinkPlan()));
    }

    private ProcessExecutionStateService.TaskPlan asyncSinkPlan() {
        return new ProcessExecutionStateService.TaskPlan(
                20L,
                2,
                TaskType.DB_WRITE,
                "{\"taskRef\":\"task-2-db-write\",\"executionMode\":\"batch\",\"async\":true,\"input\":{\"source\":\"task-output\",\"sourceTaskRef\":\"task-1-file-read\",\"sourceOutput\":\"records\"},\"targetTable\":\"public.cliente_target\",\"mode\":\"insert\"}",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    private ProcessExecutionStateService.TaskPlan mt101ParsePlan() {
        return new ProcessExecutionStateService.TaskPlan(
                20L,
                2,
                "MT101_PARSE",
                "{\"taskRef\":\"parse-mt101\",\"executionMode\":\"batch\",\"input\":{\"source\":\"task-output\",\"sourceTaskRef\":\"task-1-file-read\",\"sourceOutput\":\"records\"}}",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    private ProcessExecutionStateService.TaskPlan fileReadPlan(String fileErrorPolicy) {
        return fileReadPlan(fileErrorPolicy, "TXT");
    }

    private ProcessExecutionStateService.TaskPlan fileReadPlan(String fileErrorPolicy, String readerType) {
        return new ProcessExecutionStateService.TaskPlan(
                10L,
                1,
                TaskType.FILE_READ,
                "{\"taskRef\":\"task-1-file-read\",\"executionMode\":\"batch\"}",
                100L,
                "Clientes",
                "FILESYSTEM",
                "{\"fileErrorPolicy\":\"" + fileErrorPolicy + "\"}",
                200L,
                readerType,
                "{}"
        );
    }

    private ProcessExecutionStateService.TaskPlan sinkPlan() {
        return new ProcessExecutionStateService.TaskPlan(
                20L,
                2,
                TaskType.DB_WRITE,
                "{\"taskRef\":\"task-2-db-write\",\"executionMode\":\"batch\",\"input\":{\"source\":\"task-output\",\"sourceTaskRef\":\"task-1-file-read\",\"sourceOutput\":\"records\"},\"targetTable\":\"public.cliente_target\",\"mode\":\"insert\"}",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    @Vetoed
    private static final class RecordingStateService extends ProcessExecutionStateService {
        private final ProcessExecution execution;
        private final AtomicInteger completedWithErrorsCount = new AtomicInteger();
        private final AtomicInteger completedProcessWithErrorsCount = new AtomicInteger();
        private final AtomicInteger failedTaskCount = new AtomicInteger();
        private final AtomicInteger sequence = new AtomicInteger();

        private RecordingStateService(ProcessExecution execution) {
            super(null, null, null, null, null, null, null);
            this.execution = execution;
        }

        @Override
        public Long startTask(Long processExecutionId, String executionToken, Long taskDefinitionId, String taskType, Integer taskOrder) {
            return sequence.incrementAndGet() * 10L;
        }

        @Override
        public void completeTaskWithErrors(Long processExecutionId, String executionToken, Long taskExecutionId, String details, Object payload) {
            completedWithErrorsCount.incrementAndGet();
        }

        @Override
        public void completeProcessWithErrors(Long processExecutionId, String executionToken, String details) {
            completedProcessWithErrorsCount.incrementAndGet();
        }

        @Override
        public void failTask(Long processExecutionId, String executionToken, Long taskExecutionId, String message, Object payload) {
            failedTaskCount.incrementAndGet();
        }

        @Override
        public ProcessExecution getExecution(Long processExecutionId) {
            return execution;
        }
    }

    @Vetoed
    private static final class RecordingProcessedSourceFileService extends ProcessedSourceFileService {
        private final AtomicInteger recordPipelineFilesCount = new AtomicInteger();

        private RecordingProcessedSourceFileService() {
            super(null, null, null);
        }

        @Override
        public void recordPipelineFiles(Long processExecutionId,
                                        Long taskDefinitionId,
                                        List<SelectedSourceFile> selectedFiles,
                                        List<StreamingPipelineService.BatchSummary> completedFiles,
                                        List<StreamingPipelineService.StreamFailureSummary> failedFiles) {
            recordPipelineFilesCount.incrementAndGet();
        }
    }

    @Vetoed
    private static final class BatchTaskProviderRegistry extends TaskProviderRegistry {
        private BatchTaskProviderRegistry() {
            super(null);
        }

        /**
         * ADR-021: el fast path ya no consulta una lista de literales del motor sino esta capacidad,
         * que declara el provider. El doble responde por MT101_PARSE igual que lo haria el provider
         * real ({@code producesConsumableRecords() == true}).
         */
        @Override
        public boolean producesConsumableRecords(String type) {
            return "MT101_PARSE".equalsIgnoreCase(type);
        }

        @Override
        public com.integrationhub.platform.spi.task.TaskProvider resolve(String type) {
            return new BatchTaskProvider() {
                @Override
                public String type() {
                    return "DB_WRITE";
                }

                @Override
                public TaskResult executeRecords(TaskContext context,
                                                 Map<String, Object> configuration,
                                                 List<com.integrationhub.platform.spi.reader.ReadRecord> records,
                                                 com.integrationhub.platform.spi.source.SourcePayload sourcePayload) {
                    return TaskResult.success("ok");
                }
            };
        }
    }

    @Vetoed
    private static final class StreamingReaderProviderRegistry extends ReaderProviderRegistry {
        private StreamingReaderProviderRegistry() {
            super(null);
        }

        @Override
        public ReaderProvider resolve(String type) {
            return new ReaderProvider() {
                @Override
                public String type() {
                    return type;
                }

                @Override
                public boolean supportsStreamingPipeline() {
                    return true;
                }

                @Override
                public ReadResult readInBatches(SourcePayload payload,
                                                Map<String, Object> configuration,
                                                int batchSize,
                                                ReadBatchConsumer consumer) {
                    return new ReadResult(List.of(), 0);
                }
            };
        }
    }

    @Vetoed
    private static final class FailingStreamingPipelineService extends StreamingPipelineService {
        private FailingStreamingPipelineService() {
            super(null, null, null, null, null, null, null);
        }

        @Override
        public StreamingResult run(Long processExecutionId,
                                   ProcessExecutionStateService.TaskPlan sourcePlan,
                                   ProcessExecutionStateService.TaskPlan sinkTaskPlan,
                                   Map<String, String> executionVariables,
                                   List<String> selectedFileReferences) {
            var selectedFile = new SelectedSourceFile("clientes_fail.txt", "/tmp/clientes_fail.txt", "text/plain", 10L, Instant.now());
            throw new StreamingPipelineException(
                    "Streaming completed with 1 error(s)",
                    selectedFile.name(),
                    List.of(new StreamingPipelineService.BatchSummary("clientes_ok.txt", 1, 0, 1)),
                    List.of(selectedFile),
                    1,
                    0,
                    1,
                    List.of(),
                    List.of(new StreamingPipelineService.StreamFailureSummary(selectedFile.name(), "Cannot insert records")),
                    null
            );
        }
    }
}
