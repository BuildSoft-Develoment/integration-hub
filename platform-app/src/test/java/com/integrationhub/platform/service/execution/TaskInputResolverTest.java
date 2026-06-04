package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TaskInputResolverTest {

    @Test
    void resolvesRecordsFromPreviousTaskOutput() {
        var resolver = new TaskInputResolver(null, new ConnectionPoolManager(null, null));

        var resolved = resolver.resolve(
                Map.of("input", Map.of(
                        "source", "task-output",
                        "sourceTaskRef", "task-1-file-read",
                        "sourceOutput", "records"
                )),
                Map.of("task-1-file-read.records", List.of(
                        Map.of("cliente_id", 10L, "nombre", "Ana"),
                        Map.of("cliente_id", 11L, "nombre", "Luis")
                ))
        );

        assertEquals(2, resolved.readResult().recordCount());
        assertEquals(10L, resolved.readResult().records().getFirst().values().get("cliente_id"));
        assertEquals("Luis", resolved.readResult().records().get(1).values().get("nombre"));
    }
}
