package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.repository.TaskDispatchOutboxRepository;
import com.integrationhub.platform.repository.TaskInboxRepository;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * IT de la retención de las tablas async (ADR-015, F3): verifica que la limpieza borra los registros
 * terminales transitorios viejos (SENT/PROCESSED/FAILED) y conserva los recientes y el DLQ
 * (DEAD/POISON) hasta su retención más larga.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncTaskRetentionIT {

    @Inject
    TaskInboxRepository inboxRepository;

    @Inject
    TaskDispatchOutboxRepository outboxRepository;

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        exec("TRUNCATE TABLE task_inbox, task_dispatch_outbox RESTART IDENTITY");
    }

    @Test
    void inboxCleanupRemovesOldProcessedKeepsRecentAndDead() throws Exception {
        // Viejas (10 días): PROCESSED + FAILED → deben borrarse con retención de 7 días.
        exec("insert into task_inbox (idempotency_key, status, created_at) values "
                + "('old-ok','PROCESSED', now() - interval '10 days'),"
                + "('old-fail','FAILED', now() - interval '10 days'),"
                + "('recent-ok','PROCESSED', now())," // reciente → se conserva
                + "('old-dead','DEAD', now() - interval '10 days')," // DEAD → retención larga, se conserva a 7d
                + "(null,'POISON', now() - interval '40 days')"); // POISON muy viejo

        var removed = inboxRepository.cleanupProcessedOlderThan(LocalDateTime.now().minusDays(7), 10000);
        assertEquals(2, removed, "borra el PROCESSED y el FAILED viejos");
        assertEquals(1, count("select count(*) from task_inbox where status = 'PROCESSED'"), "conserva el reciente");
        assertEquals(1, count("select count(*) from task_inbox where status = 'DEAD'"), "no toca DEAD");

        var deadRemoved = inboxRepository.cleanupDeadOlderThan(LocalDateTime.now().minusDays(30), 10000);
        assertEquals(1, deadRemoved, "borra el POISON de 40 días");
        assertEquals(1, count("select count(*) from task_inbox where status = 'DEAD'"), "el DEAD de 10 días sigue (< 30d)");
    }

    @Test
    void outboxCleanupRemovesOldSentKeepsRecentAndDead() throws Exception {
        exec("insert into task_dispatch_outbox (idempotency_key, transport, envelope_json, status, sent_at, created_at) values "
                + "('o-old','KAFKA','{}','SENT', now() - interval '10 days', now() - interval '10 days'),"
                + "('o-recent','KAFKA','{}','SENT', now(), now())," // reciente
                + "('o-dead','KAFKA','{}','DEAD', null, now() - interval '40 days')");

        var removedSent = outboxRepository.cleanupSentOlderThan(LocalDateTime.now().minusDays(7), 10000);
        assertEquals(1, removedSent, "borra solo el SENT viejo");
        assertEquals(1, count("select count(*) from task_dispatch_outbox where status = 'SENT'"), "conserva el SENT reciente");

        var removedDead = outboxRepository.cleanupDeadOlderThan(LocalDateTime.now().minusDays(30), 10000);
        assertEquals(1, removedDead, "borra el DEAD de 40 días");
    }

    private long count(String query) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             var rs = statement.executeQuery(query)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private void exec(String sql) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }
}
