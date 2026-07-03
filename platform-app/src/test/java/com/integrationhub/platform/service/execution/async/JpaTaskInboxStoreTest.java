package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * IT del adaptador JPA del ledger de idempotencia (ADR-015) contra Postgres real: verifica el
 * registro terminal, el dedup por idempotencyKey y que la carrera del índice único se degrade a
 * duplicado (sin excepción). Las tramas POISON no participan del dedup.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class JpaTaskInboxStoreTest {

    @Inject
    JpaTaskInboxStore store;

    private AsyncTaskEnvelope envelope(String idem) {
        return new AsyncTaskEnvelope("exec-1", 1L, 2L, "REST_CALL", "KAFKA", idem, 1, "{\"slice\":1}",
                Map.of("traceId", "exec-1"));
    }

    @Test
    void recordProcessedMakesItDeduped() {
        String idem = "it-inbox-ok-" + System.nanoTime();
        assertFalse(store.isProcessed(idem), "antes de registrar no está procesada");

        store.recordProcessed(envelope(idem), "{\"rows\":3}", "ok");

        assertTrue(store.isProcessed(idem), "tras registrar, una reentrega se descarta");
    }

    @Test
    void duplicateRecordIsSwallowedNotThrown() {
        String idem = "it-inbox-dup-" + System.nanoTime();
        store.recordProcessed(envelope(idem), null, "ok");

        // Carrera: otro consumer registra la misma clave → el índice único aflora y se trata como
        // duplicado, sin propagar excepción (el efecto ya quedó asentado una vez).
        assertDoesNotThrow(() -> store.recordProcessed(envelope(idem), null, "ok-again"));
        assertTrue(store.isProcessed(idem));
    }

    @Test
    void deadIsAlsoTerminalForDedup() {
        String idem = "it-inbox-dead-" + System.nanoTime();
        store.recordDead(envelope(idem), "tipo desconocido");

        assertTrue(store.isProcessed(idem), "un DEAD también bloquea reprocesar la misma clave");
    }

    @Test
    void poisonDoesNotParticipateInDedup() {
        assertDoesNotThrow(() -> {
            store.recordPoison("basura-1", "KAFKA", "tasks.x", "no decodificable");
            store.recordPoison("basura-2", "KAFKA", "tasks.x", "no decodificable");
        });
        assertFalse(store.isProcessed(null), "isProcessed(null) siempre es falso");
    }
}
