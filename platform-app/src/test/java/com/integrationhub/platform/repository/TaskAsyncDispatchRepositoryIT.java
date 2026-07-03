package com.integrationhub.platform.repository;

import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * IT del tracker scatter-gather N→1 (ADR-015 Opción B, Etapa B1): incremento atómico, cierre exacto en
 * la última slice, idempotencia de la agregación y transición a FAILED.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class TaskAsyncDispatchRepositoryIT {

    @Inject
    TaskAsyncDispatchRepository repository;

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE TABLE task_async_dispatch RESTART IDENTITY");
        }
    }

    @Test
    void aggregatesUntilLastSliceThenReportsComplete() {
        repository.open(1L, 2L, 3);
        repository.open(1L, 2L, 3); // idempotente: no reabre ni duplica

        var first = repository.recordSliceCompleted(1L, 2L).orElseThrow();
        assertEquals(1, first.completed());
        assertFalse(first.batchCompleted(), "1 de 3 aún no cierra");

        var second = repository.recordSliceCompleted(1L, 2L).orElseThrow();
        assertEquals(2, second.completed());
        assertFalse(second.batchCompleted());

        var last = repository.recordSliceCompleted(1L, 2L).orElseThrow();
        assertEquals(3, last.completed());
        assertTrue(last.batchCompleted(), "la última slice cierra el conteo → reanudar la tarea");

        assertEquals(TaskAsyncDispatchEntityStatus.COMPLETED, statusOf(1L, 2L));
    }

    @Test
    void redeliveredSliceAfterCompletionDoesNotRetrigger() {
        repository.open(5L, 6L, 1);
        assertTrue(repository.recordSliceCompleted(5L, 6L).orElseThrow().batchCompleted());

        // Reentrega at-least-once de una slice cuando el scatter ya cerró: no hay progreso (idempotente).
        assertTrue(repository.recordSliceCompleted(5L, 6L).isEmpty(),
                "un scatter COMPLETED no vuelve a contar ni a disparar la reanudación");
    }

    @Test
    void failedSliceTransitionsScatterToFailed() {
        repository.open(7L, 8L, 4);
        repository.recordSliceCompleted(7L, 8L);

        assertTrue(repository.recordSliceFailed(7L, 8L));
        assertEquals(TaskAsyncDispatchEntityStatus.FAILED, statusOf(7L, 8L));

        // Ya FAILED: nuevas slices no cierran el scatter (no se puede completar con una muerta).
        assertTrue(repository.recordSliceCompleted(7L, 8L).isEmpty());
    }

    private String statusOf(long peId, long tdId) {
        return repository.findByExecutionAndTask(peId, tdId).orElseThrow().status;
    }

    /** Constantes de estado para legibilidad de las aserciones. */
    private static final class TaskAsyncDispatchEntityStatus {
        static final String COMPLETED = "COMPLETED";
        static final String FAILED = "FAILED";
    }
}
