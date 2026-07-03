package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * IT del adaptador JPA del outbox de despacho (ADR-015) contra Postgres real: verifica el ciclo
 * enqueue → claim (skip locked) → markSent/retry/dead + idempotencia por idempotencyKey.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class JpaTaskOutboxStoreTest {

    @Inject
    JpaTaskOutboxStore store;

    private AsyncTaskEnvelope envelope(String idem) {
        return new AsyncTaskEnvelope("exec-1", 1L, 2L, "REST_CALL", "KAFKA", idem, 1, "{\"slice\":1}", Map.of("traceId", "exec-1"));
    }

    private List<TaskOutboxStore.PendingTask> mine(String idem) {
        return store.claimPending(50).stream()
                .filter(p -> p.envelope().idempotencyKey().equals(idem))
                .toList();
    }

    @Test
    void enqueueIsIdempotentThenClaimAndMarkSent() {
        String idem = "it-sent-" + System.nanoTime();
        store.enqueue(envelope(idem));
        store.enqueue(envelope(idem)); // misma clave → no duplica

        var claimed = mine(idem);
        assertEquals(1, claimed.size());
        assertEquals("REST_CALL", claimed.get(0).envelope().taskType());
        assertEquals("exec-1", claimed.get(0).envelope().headers().get("traceId"));

        store.markSent(claimed.get(0).outboxId(), "broker-ref-1");
        assertTrue(mine(idem).isEmpty(), "un SENT ya no se reclama");
    }

    @Test
    void markDeadRemovesItFromTheClaimableSet() {
        String idem = "it-dead-" + System.nanoTime();
        store.enqueue(envelope(idem));
        var claimed = mine(idem);
        assertEquals(1, claimed.size());

        store.markDead(claimed.get(0).outboxId(), "poison");
        assertTrue(mine(idem).isEmpty(), "un DEAD ya no se reclama");
    }

    @Test
    void markRetryMakesItClaimableAgainWithBumpedAttempt() {
        String idem = "it-retry-" + System.nanoTime();
        store.enqueue(envelope(idem));
        var first = mine(idem);
        assertEquals(1, first.size());

        store.markRetry(first.get(0).outboxId(), 2, 0L); // backoff 0 → vencido ya

        var again = mine(idem);
        assertEquals(1, again.size());
        assertEquals(2, again.get(0).attempt());
    }
}
