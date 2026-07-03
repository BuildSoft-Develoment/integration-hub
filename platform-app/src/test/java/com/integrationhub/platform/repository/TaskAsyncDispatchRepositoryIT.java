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
    void aggregatesUntilLastSliceThenReportsComplete() throws Exception {
        repository.open(1L, 2L, 3);
        repository.open(1L, 2L, 3); // idempotente: no reabre ni duplica

        var first = repository.recordSliceCompleted(1L, 2L).orElseThrow();
        assertEquals(1, first.completed());
        assertFalse(first.terminal(), "1 de 3 aún no cierra");

        var second = repository.recordSliceCompleted(1L, 2L).orElseThrow();
        assertEquals(2, second.completed());
        assertFalse(second.terminal());

        var last = repository.recordSliceCompleted(1L, 2L).orElseThrow();
        assertEquals(3, last.completed());
        assertTrue(last.terminal(), "la última slice cierra el conteo → reanudar la tarea");

        assertEquals(TaskAsyncDispatchEntityStatus.COMPLETED, statusOf(1L, 2L));
    }

    @Test
    void redeliveredSliceAfterCompletionDoesNotRetrigger() {
        repository.open(5L, 6L, 1);
        assertTrue(repository.recordSliceCompleted(5L, 6L).orElseThrow().terminal());

        // Reentrega at-least-once de una slice cuando el scatter ya cerró: no hay progreso (idempotente).
        assertTrue(repository.recordSliceCompleted(5L, 6L).isEmpty(),
                "un scatter COMPLETED no vuelve a contar ni a disparar la reanudación");
    }

    @Test
    void failedSliceTransitionsScatterToFailed() throws Exception {
        repository.open(7L, 8L, 4);
        repository.recordSliceCompleted(7L, 8L);

        assertTrue(repository.recordSliceFailed(7L, 8L, false).orElseThrow().terminal(),
                "fail-fast: una slice fallida cierra el scatter como terminal");
        assertEquals(TaskAsyncDispatchEntityStatus.FAILED, statusOf(7L, 8L));

        // Ya FAILED: nuevas slices no cierran el scatter (no se puede completar con una muerta).
        assertTrue(repository.recordSliceCompleted(7L, 8L).isEmpty());
    }

    @Test
    void continueOnFailureCountsFailuresAndClosesWhenAllAccounted() throws Exception {
        repository.open(9L, 10L, 3);
        assertFalse(repository.recordSliceCompleted(9L, 10L).orElseThrow().terminal()); // 1 ok

        // continueOnFailure: la fallida cuenta pero NO pone FAILED; el scatter sigue PENDING.
        var failed = repository.recordSliceFailed(9L, 10L, true).orElseThrow(); // 1 ok + 1 fail
        assertFalse(failed.terminal());
        assertEquals("PENDING", statusOf(9L, 10L));

        var last = repository.recordSliceCompleted(9L, 10L).orElseThrow(); // 2 ok + 1 fail == 3
        assertTrue(last.terminal(), "todas contadas → cierra");
        assertEquals(1, last.failed(), "completó con 1 fallida");
        assertEquals(TaskAsyncDispatchEntityStatus.COMPLETED, statusOf(9L, 10L));
    }

    private String statusOf(long peId, long tdId) throws Exception {
        // SQL crudo (no la entidad): los UPDATE nativos del tracker bypassan el cache L1 de Hibernate,
        // así que un find podría devolver un estado stale dentro del mismo contexto de test.
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery("select status from task_async_dispatch where process_execution_id = "
                     + peId + " and task_definition_id = " + tdId)) {
            rs.next();
            return rs.getString(1);
        }
    }

    /** Constantes de estado para legibilidad de las aserciones. */
    private static final class TaskAsyncDispatchEntityStatus {
        static final String COMPLETED = "COMPLETED";
        static final String FAILED = "FAILED";
    }
}
