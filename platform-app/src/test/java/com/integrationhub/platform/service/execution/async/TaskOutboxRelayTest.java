package com.integrationhub.platform.service.execution.async;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.integrationhub.platform.service.execution.async.TaskOutboxStore.PendingTask;
import com.integrationhub.platform.spi.messaging.MessageBrokerProvider;
import com.integrationhub.platform.spi.messaging.MessagePublisher;
import com.integrationhub.platform.spi.messaging.PublishResult;
import com.integrationhub.platform.task.AsyncTaskEnvelope;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class TaskOutboxRelayTest {

    private final TaskDispatchPublisher publisher = new TaskDispatchPublisher();

    private AsyncTaskEnvelope envelope() {
        return new AsyncTaskEnvelope("exec-1", 1L, 2L, "DB_WRITE", "KAFKA", "idem-1", 1, "{}", Map.of());
    }

    private BrokerResolver brokerThat(boolean accept) {
        MessagePublisher messagePublisher = message ->
                accept ? PublishResult.ok("ref") : PublishResult.failed("rejected");
        MessageBrokerProvider broker = new MessageBrokerProvider() {
            @Override
            public String type() {
                return "KAFKA";
            }

            @Override
            public MessagePublisher publisher() {
                return messagePublisher;
            }
        };
        return transport -> broker;
    }

    @Test
    void acceptedWorkItemMarkedSent() {
        var store = new FakeStore(List.of(new PendingTask(10L, 0, envelope())));
        var relay = new TaskOutboxRelay(publisher, new TaskOutboxRetryPolicy(20, 1000L, 300_000L));

        var outcome = relay.drain(store, brokerThat(true), 100);

        assertEquals(1, outcome.sent());
        assertTrue(store.sent.contains(10L));
        assertTrue(store.retried.isEmpty());
        assertTrue(store.dead.isEmpty());
    }

    @Test
    void failedPublishWithinRetriesMarkedRetry() {
        var store = new FakeStore(List.of(new PendingTask(10L, 0, envelope())));
        var relay = new TaskOutboxRelay(publisher, new TaskOutboxRetryPolicy(20, 1000L, 300_000L));

        var outcome = relay.drain(store, brokerThat(false), 100);

        assertEquals(1, outcome.retried());
        assertEquals(1, store.retried.get(10L));
    }

    @Test
    void failedPublishAtMaxAttemptsMarkedDead() {
        var store = new FakeStore(List.of(new PendingTask(10L, 1, envelope())));
        var relay = new TaskOutboxRelay(publisher, new TaskOutboxRetryPolicy(1, 1000L, 300_000L));

        var outcome = relay.drain(store, brokerThat(false), 100);

        assertEquals(1, outcome.dead());
        assertTrue(store.dead.containsKey(10L));
    }

    @Test
    void brokerResolutionFailureIsRetriedNotPropagated() {
        var store = new FakeStore(List.of(new PendingTask(10L, 0, envelope())));
        var relay = new TaskOutboxRelay(publisher, new TaskOutboxRetryPolicy(20, 1000L, 300_000L));
        BrokerResolver failingResolver = transport -> {
            throw new IllegalStateException("broker down");
        };

        var outcome = relay.drain(store, failingResolver, 100);

        assertEquals(1, outcome.retried());
        assertEquals(1, store.retried.get(10L));
    }

    private static final class FakeStore implements TaskOutboxStore {
        private final List<PendingTask> pending;
        final List<Long> sent = new ArrayList<>();
        final Map<Long, Integer> retried = new LinkedHashMap<>();
        final Map<Long, String> dead = new LinkedHashMap<>();

        FakeStore(List<PendingTask> pending) {
            this.pending = pending;
        }

        @Override
        public void enqueue(com.integrationhub.platform.task.AsyncTaskEnvelope envelope) {
            // El relay no encola; irrelevante para este test.
        }

        @Override
        public List<PendingTask> claimPending(int batchSize) {
            return pending;
        }

        @Override
        public void markSent(long outboxId, String reference) {
            sent.add(outboxId);
        }

        @Override
        public void markRetry(long outboxId, int nextAttempt, long backoffMillis) {
            retried.put(outboxId, nextAttempt);
        }

        @Override
        public void markDead(long outboxId, String error) {
            dead.put(outboxId, error);
        }
    }
}
