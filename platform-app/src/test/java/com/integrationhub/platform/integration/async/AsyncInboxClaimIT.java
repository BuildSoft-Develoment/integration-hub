package com.integrationhub.platform.integration.async;

import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.service.execution.async.AsyncInboxClaimRecoveryScheduler;
import com.integrationhub.platform.service.execution.async.AsyncNodeIdentity;
import com.integrationhub.platform.service.execution.async.LeaseHeartbeat;
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
import static org.junit.jupiter.api.Assertions.assertNull;
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
    void firstClaimWinsAndAConcurrentSecondDeliveryLoses() {
        // #4: dos ENTREGAS distintas (tokens distintos) del mismo work-item; con el lease vivo, la segunda pierde
        // aunque sea el MISMO nodo/owner (antes el clause same-owner la dejaba ganar → doble efecto con ordered=false).
        var env = envelope("idem-race");
        assertTrue(inbox.claim(env, "node-A", "tok-A", 30), "el primer claim gana");
        assertFalse(inbox.claim(env, "node-A", "tok-B", 30),
                "una SEGUNDA entrega (token distinto, lease vivo) pierde aun con el MISMO owner → NO doble efecto");
        assertEquals("CLAIMED", status("idem-race"));
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
                var token = "tok-" + i; // #4: cada entrega concurrente lleva su propio token
                pool.submit(() -> {
                    try {
                        start.await();
                        if (inbox.claim(env, owner, token, 30)) {
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
    void sameTokenReClaimsForInAppRetry() {
        // #4: el retry in-app de la MISMA entrega reusa su token → re-clama; una entrega distinta (token distinto)
        // con lease vivo NO re-clama (arriba).
        var env = envelope("idem-retry");
        assertTrue(inbox.claim(env, "node-A", "tok-A", 30));
        assertTrue(inbox.claim(env, "node-A", "tok-A", 30),
                "el mismo TOKEN re-toma su claim (retry in-app de la misma entrega)");
    }

    @Test
    void releasedClaimIsImmediatelyReClaimableByAnotherDelivery() {
        // #4 (release-on-failure): tras agotar los retries in-app se LIBERA el claim; una re-entrega del broker
        // (token nuevo) lo re-clama de inmediato, sin esperar a que venza el lease.
        var env = envelope("idem-release");
        assertTrue(inbox.claim(env, "node-A", "tok-A", 30));
        inbox.releaseClaim(env, "tok-A");
        assertTrue(inbox.claim(env, "node-A", "tok-B", 30),
                "un claim liberado se re-clama de inmediato (nueva entrega, token nuevo)");
    }

    @Test
    void expiredLeaseIsTakenOverByAnotherNode() throws Exception {
        var env = envelope("idem-lease");
        assertTrue(inbox.claim(env, "node-A", "tok-A", 30));
        expireClaim("idem-lease");
        assertTrue(inbox.claim(env, "node-B", "tok-B", 30),
                "un lease vencido (nodo caído) lo re-toma otra entrega");
        assertEquals("node-B", owner("idem-lease"));
    }

    @Test
    void finalizingTransitionsClaimedToTerminalAndDedups() {
        var env = envelope("idem-final");
        assertTrue(inbox.claim(env, nodeIdentity.id(), "tok-final", 30));
        assertFalse(inbox.isProcessed("idem-final"), "CLAIMED aún no es terminal");

        inbox.recordProcessed(env, "tok-final", "{\"rows\":1}", "ok");

        assertEquals("PROCESSED", status("idem-final"));
        assertTrue(inbox.isProcessed("idem-final"), "tras finalizar, el pre-check corta la re-entrega");
        assertFalse(inbox.claim(env, "node-B", "tok-B", 30), "no se re-reclama una clave ya terminal");
    }

    @Test
    void finalizeIsFencedByTokenSoAStaleDeliveryCannotFinalizeAReclaimedRow() throws Exception {
        // #4 (fencing por token): tok-A reclama, su lease vence y tok-B lo re-toma. Un finalize REZAGADO de tok-A NO
        // debe pisar el claim de tok-B (token distinto → 0 filas); solo el token actual (B) finaliza.
        var env = envelope("idem-fence");
        assertTrue(inbox.claim(env, "node-A", "tok-A", 30));
        expireClaim("idem-fence");
        assertTrue(inbox.claim(env, "node-B", "tok-B", 30), "un lease vencido lo re-toma otra entrega");

        var stale = QuarkusTransaction.requiringNew().call(() ->
                inboxRepository.finalizeClaimed("idem-fence", "PROCESSED", "{}", "late", null, "tok-A"));
        assertEquals(0, stale, "una entrega con token viejo NO finaliza la fila re-reclamada (fencing por token)");
        assertEquals("CLAIMED", status("idem-fence"), "la fila sigue reclamada por tok-B");

        var owned = QuarkusTransaction.requiringNew().call(() ->
                inboxRepository.finalizeClaimed("idem-fence", "PROCESSED", "{\"rows\":1}", "ok", null, "tok-B"));
        assertEquals(1, owned, "el token actual del claim sí lo finaliza");
        assertEquals("PROCESSED", status("idem-fence"));
    }

    @Test
    void renewLeaseIsTokenScopedAndKeepsTheClaimUntakeable() throws Exception {
        // F3 + #4: el heartbeat renueva el lease solo para el TOKEN dueño; mientras el lease siga vivo (renovado),
        // otra entrega NO puede re-tomar el claim → una reentrega durante una ejecución larga no duplica el efecto.
        var env = envelope("idem-renew");
        assertTrue(inbox.claim(env, nodeIdentity.id(), "tok-R", 30));

        assertFalse(inbox.renewLease(env, "tok-OTHER", 30), "un token ajeno NO renueva el lease");
        assertTrue(inbox.renewLease(env, "tok-R", 30), "el token dueño del claim renueva su lease");
        assertEquals("CLAIMED", status("idem-renew"));

        assertFalse(inbox.claim(env, "node-B", "tok-B", 30),
                "con el lease vivo (renovado), otra entrega no re-toma el claim (no hay doble efecto)");
    }

    @Test
    void heartbeatRenewsTheLeaseAgainstTheRealDbFromItsSchedulerThread() throws Exception {
        // F3 (ruta real): el heartbeat renueva via store.renewLease @Transactional DESDE SU HILO DE SCHEDULER
        // contra la BD real. Se verifica que claimed_until SÍ avanza (heartbeat efectivo de verdad).
        var env = envelope("idem-hb-real");
        assertTrue(inbox.claim(env, nodeIdentity.id(), "tok-HB", 2)); // lease corto (2s) → renueva cada 1s
        var before = claimedUntil("idem-hb-real");

        var heartbeat = new LeaseHeartbeat(inbox, 2, 1); // store REAL (CDI), lease 2s
        heartbeat.runWithHeartbeat(env, "tok-HB", () -> {
            sleepQuietly(2600); // supera lease/2 (1s) varias veces → dispara renovaciones reales
            return null;
        });

        var after = claimedUntil("idem-hb-real");
        assertTrue(after.compareTo(before) > 0,
                "el heartbeat avanzó claimed_until contra la BD real (" + before + " -> " + after + ")");
        assertEquals("CLAIMED", status("idem-hb-real"), "el claim sigue vivo tras la ejecución");
    }

    @Test
    void renewLeaseOnATerminalRowIsANoOp() throws Exception {
        // Un heartbeat que dispara tras finalizar es inofensivo: la fila ya no está CLAIMED → 0 filas.
        var env = envelope("idem-renew-term");
        assertTrue(inbox.claim(env, nodeIdentity.id(), "tok-T", 30));
        inbox.recordProcessed(env, "tok-T", "{}", "ok");
        assertFalse(inbox.renewLease(env, "tok-T", 30),
                "no se renueva un claim ya finalizado (PROCESSED)");
    }

    @Test
    void recoverySweepMarksStaleClaimsDead() throws Exception {
        var env = envelope("idem-stale");
        assertTrue(inbox.claim(env, "node-A", "tok-S", 30));
        expireClaimByMinutes("idem-stale", 30); // lease vencido hace 30 min (> gracia por defecto 5m)

        var recovered = recovery.recoverStaleClaims();

        assertEquals(1, recovered, "el claim estancado se recupera");
        assertEquals("DEAD", status("idem-stale"));
        assertEquals(1, inboxRepository.findDead(10).size(), "queda visible en la consola DLQ");
        // #4 (A): la fila DEAD no deja un token huérfano (higiene, como finalize/release).
        assertNull(claimToken("idem-stale"), "el inbox_claim_token se limpia al marcar DEAD");
    }

    // --- helpers de inspección/manipulación directa ---

    private String status(String key) {
        return single("select status from task_inbox where idempotency_key = '" + key + "'");
    }

    private String owner(String key) {
        return single("select inbox_owner from task_inbox where idempotency_key = '" + key + "'");
    }

    private String claimToken(String key) {
        return single("select inbox_claim_token from task_inbox where idempotency_key = '" + key + "'");
    }

    private String claimedUntil(String key) {
        return single("select claimed_until from task_inbox where idempotency_key = '" + key + "'");
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
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
