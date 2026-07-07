package com.integrationhub.platform.service.execution.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * Productor del scatter-gather (ADR-015 Opción B, Etapa B2): parte en N slices, abre el tracker y
 * encola N work-items con clave por-slice y payload = config + records de la slice.
 */
class AsyncSliceDispatchServiceTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final TaskAsyncDispatchRepository tracker = mock(TaskAsyncDispatchRepository.class);
    private final CapturingOutbox outbox = new CapturingOutbox();
    private final AsyncPageChainService pageChain = mock(AsyncPageChainService.class);
    private final AsyncSliceDispatchService service =
            new AsyncSliceDispatchService(tracker, outbox, mapper, pageChain);

    private ReadRecord record(String id) {
        return new ReadRecord(Map.of("id", id));
    }

    @Test
    void dispatchesOneWorkItemPerSliceAndOpensTracker() throws Exception {
        var slices = List.of(
                List.of(record("a"), record("b")),
                List.of(record("c")));

        var dispatched = service.dispatchSlices(42L, 7L, "DB_WRITE", "KAFKA",
                Map.of("targetTable", "t"), slices);

        assertEquals(2, dispatched);
        verify(tracker).open(42L, 7L, 2);
        assertEquals(2, outbox.enqueued.size());

        // Claves por-slice deterministas y distintas.
        var key0 = outbox.enqueued.get(0).idempotencyKey();
        var key1 = outbox.enqueued.get(1).idempotencyKey();
        assertEquals(TaskIdempotency.key(42L, 7L, "slice-0"), key0);
        assertEquals(TaskIdempotency.key(42L, 7L, "slice-1"), key1);
        assertNotEquals(key0, key1);

        // Payload de la slice 0: config + los 2 records + posición.
        var slice0 = mapper.readValue(outbox.enqueued.get(0).payload(), AsyncSliceWorkItem.class);
        assertEquals(0, slice0.sliceIndex());
        assertEquals(2, slice0.totalSlices());
        assertEquals("t", slice0.configuration().get("targetTable"));
        assertEquals(2, slice0.records().size());
        assertEquals("a", slice0.records().get(0).get("id"));
        assertEquals("DB_WRITE", outbox.enqueued.get(0).taskType());
        assertEquals("0", outbox.enqueued.get(0).headers().get("sliceIndex"));

        var slice1 = mapper.readValue(outbox.enqueued.get(1).payload(), AsyncSliceWorkItem.class);
        assertEquals(1, slice1.sliceIndex());
        assertEquals(1, slice1.records().size());
        assertEquals("c", slice1.records().get(0).get("id"));
    }

    @Test
    void noSlicesDispatchesNothing() {
        assertEquals(0, service.dispatchSlices(1L, 2L, "DB_WRITE", "KAFKA", Map.of(), List.of()));
        assertTrue(outbox.enqueued.isEmpty());
    }

    @Test
    void missingIdentifiersThrows() {
        assertThrows(IllegalStateException.class,
                () -> service.dispatchSlices(null, 2L, "DB_WRITE", "KAFKA", Map.of(),
                        List.of(List.of(record("a")))));
    }

    private static final class CapturingOutbox implements TaskOutboxStore {
        final List<AsyncTaskEnvelope> enqueued = new ArrayList<>();

        @Override
        public void enqueue(AsyncTaskEnvelope envelope) {
            enqueued.add(envelope);
        }

        @Override
        public List<PendingTask> claimPending(int batchSize) {
            return List.of();
        }

        @Override
        public void markSent(long outboxId, String reference) {
        }

        @Override
        public void markRetry(long outboxId, int nextAttempt, long backoffMillis) {
        }

        @Override
        public void markDead(long outboxId, String error) {
        }
    }
}
