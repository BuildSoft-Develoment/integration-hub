package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.repository.TaskSyncProgressRepository;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit del reporter de progreso sync del fastpath: upsert THROTTLED (cada 50k) + flush de la cola, sin
 * doble-upsert por cruce de umbral, thread-safe bajo lotes concurrentes. Valida que a escala 1M la DB no
 * recibe un upsert por lote, pero la UI ve un valor monótono que termina en el total real.
 */
class SyncProgressReporterTest {

    /** Repo capturador: registra cada valor absoluto upserteado (en orden). */
    private static final class CapturingRepo extends TaskSyncProgressRepository {
        final List<Long> upserts = new CopyOnWriteArrayList<>();
        @Override
        public void upsert(Long processExecutionId, Long taskDefinitionId, long processed) {
            upserts.add(processed);
        }
    }

    @Test
    void doesNotUpsertPerBatchAndFlushesTail() {
        var repo = new CapturingRepo();
        var reporter = new SyncProgressReporter(repo, 1L, 2L);

        // 5 lotes de 10k = 50k: por debajo/igual al umbral se dispara UNA vez al cruzarlo.
        for (int i = 0; i < 5; i++) {
            reporter.batchWritten(10_000);
        }
        assertEquals(List.of(50_000L), repo.upserts, "un solo upsert al cruzar el umbral de 50k");

        // 3k más (cola por debajo del umbral): sólo se persiste con el flush final.
        reporter.batchWritten(3_000);
        assertEquals(1, repo.upserts.size(), "la cola aún no cruza umbral → sin upsert");

        reporter.flush();
        assertEquals(List.of(50_000L, 53_000L), repo.upserts, "flush persiste el total real final");
    }

    @Test
    void smallRunOnlyPersistsOnFlush() {
        var repo = new CapturingRepo();
        var reporter = new SyncProgressReporter(repo, 1L, 2L);

        reporter.batchWritten(2); // como el E2E FILE_READ→DB_WRITE de 2 filas
        assertTrue(repo.upserts.isEmpty(), "por debajo del umbral no hay upsert intermedio");

        reporter.flush();
        assertEquals(List.of(2L), repo.upserts, "el flush final expone el conteo aunque sea chico");
    }

    @Test
    void flushIsIdempotentAndZeroIsNoOp() {
        var repo = new CapturingRepo();
        var reporter = new SyncProgressReporter(repo, 1L, 2L);

        reporter.batchWritten(0);
        reporter.flush();
        assertTrue(repo.upserts.isEmpty(), "run vacío no persiste nada");

        reporter.batchWritten(100);
        reporter.flush();
        reporter.flush(); // segundo flush: sin cambios → sin re-upsert
        assertEquals(List.of(100L), repo.upserts);
    }

    @Test
    void isThreadSafeAndConverges() throws Exception {
        var repo = new CapturingRepo();
        var reporter = new SyncProgressReporter(repo, 1L, 2L);

        // 200 lotes concurrentes de 5k = 1_000_000 registros.
        var futures = new ArrayList<CompletableFuture<Void>>();
        for (int i = 0; i < 200; i++) {
            futures.add(CompletableFuture.runAsync(() -> reporter.batchWritten(5_000)));
        }
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        reporter.flush();

        assertEquals(1_000_000L, repo.upserts.get(repo.upserts.size() - 1),
                "el último valor persistido es el total exacto");
        // Throttling real: a 50k de umbral sobre 1M, muy por debajo de 200 upserts (uno por lote).
        assertTrue(repo.upserts.size() <= 25,
                "throttled: " + repo.upserts.size() + " upserts, no uno por lote");
        // Monotonía: la UI nunca ve el contador retroceder.
        long prev = -1;
        for (long v : repo.upserts) {
            assertTrue(v > prev, "valores monótonos crecientes");
            prev = v;
        }
    }
}
