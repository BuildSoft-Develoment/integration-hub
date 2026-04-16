package com.integrationhub.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.domain.TaskType;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.provider.task.DbWriteTaskProvider;
import com.integrationhub.platform.repository.ProcessExecutionRepository;
import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.spi.ReadBatch;
import com.integrationhub.platform.spi.ReadBatchConsumer;
import com.integrationhub.platform.spi.ReadRecord;
import com.integrationhub.platform.spi.ReadResult;
import com.integrationhub.platform.spi.SelectedSourceFile;
import com.integrationhub.platform.spi.SourcePayload;
import com.integrationhub.platform.spi.SourceProvider;
import org.junit.jupiter.api.Test;
import jakarta.transaction.Transactional;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProcessTaskRuntimeServiceTest {

    @Test
    void pipelineRunsOutsideJtaTransaction() throws NoSuchMethodException {
        Method method = ProcessTaskRuntimeService.class.getMethod(
                "runFileReadToDbWrite",
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
        var service = serviceForPolicy("failFast", List.of(
                new SelectedSourceFile("clientes_ok.txt", "/tmp/clientes_ok.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("clientes_fail.txt", "/tmp/clientes_fail.txt", "text/plain", 10L, Instant.now())
        ));

        var fileReadPlan = taskPlan("failFast");
        var dbWritePlan = dbWritePlan();

        var error = assertThrows(ProcessTaskRuntimeService.FileReadDbWritePipelineException.class,
                () -> service.runFileReadToDbWrite(1L, fileReadPlan, dbWritePlan, Map.of(), List.of()));

        assertEquals("clientes_fail.txt", error.failedFileName());
        assertEquals(1, error.completedFiles().size());
        assertEquals(2, error.selectedFiles().size());
        assertEquals(1, error.failedFiles().size());
        assertEquals(1, error.validCount());
        assertEquals(1, error.writtenCount());
    }

    @Test
    void pipelineContinuesAfterFileErrorWhenPolicyIsContinue() {
        var service = serviceForPolicy("continue", List.of(
                new SelectedSourceFile("clientes_fail.txt", "/tmp/clientes_fail.txt", "text/plain", 10L, Instant.now()),
                new SelectedSourceFile("clientes_ok.txt", "/tmp/clientes_ok.txt", "text/plain", 10L, Instant.now())
        ));

        var fileReadPlan = taskPlan("continue");
        var dbWritePlan = dbWritePlan();

        var error = assertThrows(ProcessTaskRuntimeService.FileReadDbWritePipelineException.class,
                () -> service.runFileReadToDbWrite(1L, fileReadPlan, dbWritePlan, Map.of(), List.of()));

        assertEquals("clientes_fail.txt", error.failedFileName());
        assertEquals(1, error.completedFiles().size());
        assertEquals("clientes_ok.txt", error.completedFiles().getFirst().fileName());
        assertEquals(2, error.selectedFiles().size());
        assertEquals(1, error.failedFiles().size());
        assertEquals(1, error.validCount());
        assertEquals(1, error.writtenCount());
    }

    private ProcessTaskRuntimeService serviceForPolicy(String policy, List<SelectedSourceFile> selectedFiles) {
        var mapper = new JsonConfigurationMapper();
        mapper.objectMapper = new ObjectMapper();

        SourceProvider sourceProvider = new SourceProvider() {
            @Override
            public String type() {
                return "FILESYSTEM";
            }

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
            public SourceProvider resolve(String type) {
                return sourceProvider;
            }
        };

        var readerRegistry = new ReaderProviderRegistry(null) {
            @Override
            public com.integrationhub.platform.spi.ReaderProvider resolve(String type) {
                return new com.integrationhub.platform.spi.ReaderProvider() {
                    @Override
                    public String type() {
                        return "TXT";
                    }

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

        var executionRepository = new ProcessExecutionRepository() {
            @Override
            public ProcessExecution findById(Long id) {
                var execution = new ProcessExecution();
                execution.id = id;
                return execution;
            }
        };

        var taskDefinitionRepository = new ProcessTaskDefinitionRepository() {
            @Override
            public ProcessTaskDefinition findById(Long id) {
                var task = new ProcessTaskDefinition();
                task.id = id;
                task.taskType = TaskType.DB_WRITE;
                return task;
            }
        };

        var dbWriteProvider = new DbWriteTaskProvider(null, null, null) {
            @Override
            public com.integrationhub.platform.spi.TaskResult executeRecords(com.integrationhub.platform.spi.TaskContext context,
                                                                             Map<String, Object> configuration,
                                                                             List<ReadRecord> records,
                                                                             SourcePayload sourcePayload) {
                if (sourcePayload != null && sourcePayload.name().contains("fail")) {
                    throw new IllegalStateException("Cannot insert records into public.cliente_target");
                }
                return com.integrationhub.platform.spi.TaskResult.success("ok");
            }
        };

        return new ProcessTaskRuntimeService(
                mapper,
                sourceRegistry,
                readerRegistry,
                null,
                executionRepository,
                taskDefinitionRepository,
                dbWriteProvider
        );
    }

    private ProcessExecutionStateService.TaskPlan taskPlan(String fileErrorPolicy) {
        String sourceConfigurationJson = "{\"fileErrorPolicy\":\"" + fileErrorPolicy + "\"}";
        return new ProcessExecutionStateService.TaskPlan(
                10L,
                1,
                TaskType.FILE_READ,
                "{}",
                100L,
                "Source QA",
                "FILESYSTEM",
                sourceConfigurationJson,
                200L,
                "TXT",
                "{}"
        );
    }

    private ProcessExecutionStateService.TaskPlan dbWritePlan() {
        return new ProcessExecutionStateService.TaskPlan(
                20L,
                2,
                TaskType.DB_WRITE,
                "{\"targetTable\":\"public.cliente_target\",\"mode\":\"insert\"}",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
