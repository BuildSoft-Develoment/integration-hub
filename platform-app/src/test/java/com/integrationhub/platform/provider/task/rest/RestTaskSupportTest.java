package com.integrationhub.platform.provider.task.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.task.TaskContext;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RestTaskSupportTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void resolvesRecordTemplatesWithExecutionVariables() {
        TaskContext context = taskContext();
        ReadRecord record = new ReadRecord(Map.of("codigo", "C001", "nombre", "Ana"));

        Map<String, Object> variables = RestTaskSupport.buildRecordVariables(record, 0, 2, context);
        String resolved = RestTaskSupport.resolveBody(
                "{\"codigo\":\"${codigo}\",\"nombre\":\"${nombre}\",\"recordNumber\":${recordNumber},\"processExecutionId\":${processExecutionId}}",
                record,
                objectMapper,
                variables
        );

        assertEquals("{\"codigo\":\"C001\",\"nombre\":\"Ana\",\"recordNumber\":1,\"processExecutionId\":99}", resolved);
    }

    @Test
    void resolvesBatchTemplatesWithSerializedRecords() {
        TaskContext context = taskContext();
        List<ReadRecord> records = List.of(
                new ReadRecord(Map.of("codigo", "C001")),
                new ReadRecord(Map.of("codigo", "C002"))
        );

        Map<String, Object> variables = RestTaskSupport.buildBatchVariables(records, context, objectMapper);
        String resolved = RestTaskSupport.resolveBatchBody(
                "{\"processExecutionId\":${processExecutionId},\"recordCount\":${recordCount},\"items\":${recordsJson}}",
                records,
                objectMapper,
                variables
        );

        assertTrue(resolved.contains("\"processExecutionId\":99"));
        assertTrue(resolved.contains("\"recordCount\":2"));
        assertTrue(resolved.contains("\"codigo\":\"C001\""));
        assertTrue(resolved.contains("\"codigo\":\"C002\""));
    }

    private TaskContext taskContext() {
        return new TaskContext(99L, 7L);
    }
}
