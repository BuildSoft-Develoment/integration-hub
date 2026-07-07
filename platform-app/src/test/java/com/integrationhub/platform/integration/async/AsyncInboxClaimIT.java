package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.service.execution.async.AsyncInboxClaimRecoveryScheduler;
import com.integrationhub.platform.service.execution.async.AsyncNodeIdentity;
import com.integrationhub.platform.service.execution.async.TaskInboxStore;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * §5: claim ATÓMICO del inbox contra la DB real. Prueba que dos entregas de la misma trama no ejecutan el
 * efecto dos veces (una gana el claim, la otra lo pierde), que el mismo owner re-toma su claim (retry
 * in-app), que un lease vencido lo re-toma otro nodo (crash-safe), que finalizar transiciona CLAIMED →
 * terminal, y que el sweep de recuperación marca DEAD los claims estancados (fail-safe, visibles en DLQ).
 */
@QuarkusTest
@TestProfile(AsyncExecutionTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncInboxClaimIT {

    @Inject
    TaskInboxStore inbox;

    @Inject
    TaskInboxRepository inboxRepository;

    @Inject
    AsyncInboxClaimRecoveryScheduler recovery;

    @Inject
    AsyncNodeIdentity nodeIdentity;

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("TRUNCATE TABLE task_inbox RESTART IDENTITY CASCADE");
        }
    }

    private static AsyncTaskEnvelope envelope(String key) {
        return new AsyncTaskEnvelope("exec-1", 1L, 2L, "DB_WRITE", "KAFKA", key, 1, "{}", Map.of());
    }

    @Test
    void firstClaimWinsAndAConcurrentSecondClaimLoses() {
        var env = envelope("idem-race");
        assertTrue(inbox.claim(env, "node-A", 30), "el primer claim gana");
        assertFalse(inbox.claim(env, "node-B", 30),
                "un segundo claim de otro nodo (lease vivo) pierde → NO ejecutará el efecto");
        assertEquals("CLAIMED", status("idem-race"));
        assertEquals("node-A", owner("idem-race"));
    }

    @Test
    void concurrentClaimsOnTheSameKeyGrantExactlyOne() throws Exception {
        var env = envelope("idem-concurrent");
        var threads = 8;
        var pool = Executors.newFixedThreadPool(threads);
        var start = new CountDownLatch(1);
        var done = new CountDownLatch(threads);
        var winners = new AtomicInteger(0);
        try {
            for (var i = 0; i < threads; i++) {
                var owner = "node-" + i;
                pool.submit(() -> {
                    try {
                        start.await();
                        if (inbox.claim(env, owner, 30)) {
                            winners.incrementAndGet();
                        }
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                    } finally {
                        done.countDown();
                    }
                });
            }
            start.countDown(); // libera todos a la vez → máxima contención
            assertTrue(done.await(20, TimeUnit.SECONDS), "todos los claims terminaron");
        } finally {
            pool.shutdownNow();
        }
        // Postgres serializa el INSERT ... ON CONFLICT sobre el índice único: exactamente uno gana el efecto.
        assertEquals(1, winners.get(), "exactamente un consumer gana el claim bajo contención real");
        assertEquals("CLAIMED", status("idem-concurrent"));
    }

    @Test
    void sameOwnerReClaimsForInAppRetry() {
        var env = envelope("idem-retry");
        assertTrue(inbox.claim(env, "node-A", 30));
        assertTrue(inbox.claim(env, "node-A", 30),
                "el mismo owner re-toma su claim (retry in-app tras un fallo transitorio)");
    }

    @Test
    void expiredLeaseIsTakenOverByAnotherNode() throws Exception {
        var env = envelope("idem-lease");
        assertTrue(inbox.claim(env, "node-A", 30));
        expireClaim("idem-lease");
        assertTrue(inbox.claim(env, "node-B", 30),
                "un lease vencido (nodo caído) lo re-toma otro nodo");
        assertEquals("node-B", owner("idem-lease"));
    }

    @Test
    void finalizingTransitionsClaimedToTerminalAndDedups() {
        var env = envelope("idem-final");
        // FENCING: recordProcessed finaliza con la identidad del store; para que la finalización sea legítima, el
        // claim debe ser de ESA misma identidad (así reclama el consumer real, que comparte AsyncNodeIdentity).
        assertTrue(inbox.claim(env, nodeIdentity.id(), 30));
        assertFalse(inbox.isProcessed("idem-final"), "CLAIMED aún no es terminal");

        inbox.recordProcessed(env, "{\"rows\":1}", "ok");

        assertEquals("PROCESSED", status("idem-final"));
        assertTrue(inbox.isProcessed("idem-final"), "tras finalizar, el pre-check corta la re-entrega");
        assertFalse(inbox.claim(env, "node-B", 30), "no se re-reclama una clave ya terminal");
    }

    @Test
    void finalizeIsFencedByOwnerSoAStaleNodeCannotFinalizeAReclaimedRow() throws Exception {
        // F (fencing): node-A reclama, su lease vence y node-B lo re-toma. Un finalize REZAGADO de node-A NO debe
        // pisar el claim de B (owner distinto → 0 filas); solo el dueño actual (B) finaliza.
        var env = envelope("idem-fence");
        assertTrue(inbox.claim(env, "node-A", 30));
        expireClaim("idem-fence");
        assertTrue(inbox.claim(env, "node-B", 30), "un lease vencido lo re-toma otro nodo");
        assertEquals("node-B", owner("idem-fence"));

        var stale = QuarkusTransaction.requiringNew().call(() ->
                inboxRepository.finalizeClaimed("idem-fence", "PROCESSED", "{}", "late", null, "node-A"));
        assertEquals(0, stale, "un nodo con lease vencido NO finaliza la fila re-reclamada por otro (fencing)");
        assertEquals("CLAIMED", status("idem-fence"), "la fila sigue reclamada por B");
        assertEquals("node-B", owner("idem-fence"));

        var owned = QuarkusTransaction.requiringNew().call(() ->
                inboxRepository.finalizeClaimed("idem-fence", "PROCESSED", "{\"rows\":1}", "ok", null, "node-B"));
        assertEquals(1, owned, "el dueño actual del claim sí lo finaliza");
        assertEquals("PROCESSED", status("idem-fence"));
    }

    @Test
    void renewLeaseIsOwnerScopedAndKeepsTheClaimUntakeable() throws Exception {
        // F3: el heartbeat renueva el lease solo para el DUEÑO; mientras el lease siga vivo (renovado), otro nodo
        // NO puede re-tomar el claim → una reentrega durante una ejecución larga no duplica el efecto.
        var env = envelope("idem-renew");
        assertTrue(inbox.claim(env, nodeIdentity.id(), 30));

        assertFalse(inbox.renewLease(env, "node-OTHER", 30), "un owner ajeno NO renueva el lease");
        assertTrue(inbox.renewLease(env, nodeIdentity.id(), 30), "el dueño del claim renueva su lease");
        assertEquals("CLAIMED", status("idem-renew"));
        assertEquals(nodeIdentity.id(), owner("idem-renew"));

        assertFalse(inbox.claim(env, "node-B", 30),
                "con el lease vivo (renovado), otro nodo no re-toma el claim (no hay doble efecto)");
    }

    @Test
    void renewLeaseOnATerminalRowIsANoOp() throws Exception {
        // Un heartbeat que dispara tras finalizar es inofensivo: la fila ya no está CLAIMED → 0 filas.
        var env = envelope("idem-renew-term");
        assertTrue(inbox.claim(env, nodeIdentity.id(), 30));
        inbox.recordProcessed(env, "{}", "ok");
        assertFalse(inbox.renewLease(env, nodeIdentity.id(), 30),
                "no se renueva un claim ya finalizado (PROCESSED)");
    }

    @Test
    void recoverySweepMarksStaleClaimsDead() throws Exception {
        var env = envelope("idem-stale");
        assertTrue(inbox.claim(env, "node-A", 30));
        expireClaimByMinutes("idem-stale", 30); // lease vencido hace 30 min (> gracia por defecto 5m)

        var recovered = recovery.recoverStaleClaims();

        assertEquals(1, recovered, "el claim estancado se recupera");
        assertEquals("DEAD", status("idem-stale"));
        assertEquals(1, inboxRepository.findDead(10).size(), "queda visible en la consola DLQ");
    }

    // --- helpers de inspección/manipulación directa ---

    private String status(String key) {
        return single("select status from task_inbox where idempotency_key = '" + key + "'");
    }

    private String owner(String key) {
        return single("select inbox_owner from task_inbox where idempotency_key = '" + key + "'");
    }

    private void expireClaim(String key) throws Exception {
        exec("update task_inbox set claimed_until = now() - interval '1 second' where idempotency_key = '" + key + "'");
    }

    private void expireClaimByMinutes(String key, int minutes) throws Exception {
        exec("update task_inbox set claimed_until = now() - interval '" + minutes
                + " minutes' where idempotency_key = '" + key + "'");
    }

    private void exec(String sql) throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.executeUpdate(sql);
        }
    }

    private String single(String sql) {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement();
             var rs = s.executeQuery(sql)) {
            return rs.next() ? rs.getString(1) : null;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
