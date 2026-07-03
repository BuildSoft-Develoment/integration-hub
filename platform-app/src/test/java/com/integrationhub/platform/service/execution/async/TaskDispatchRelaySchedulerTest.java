package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.service.execution.async.TaskOutboxRelay.RelayOutcome;
import com.integrationhub.platform.service.messaging.MessageBrokerRegistry;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifica el bucle de drenaje del relay (ADR-015 F4): un tick drena en lote hasta vaciar el outbox
 * (lote incompleto) o alcanzar el tope de lotes por tick, sin depender de DB ni broker.
 */
class TaskDispatchRelaySchedulerTest {

    private final TaskOutboxStore store = mock(TaskOutboxStore.class);
    private final TaskOutboxRelay relay = mock(TaskOutboxRelay.class);
    private final MessageBrokerRegistry brokers = mock(MessageBrokerRegistry.class);

    private TaskDispatchRelayScheduler scheduler(boolean enabled, int batchSize, int maxBatches) {
        return new TaskDispatchRelayScheduler(store, relay, brokers, enabled, batchSize, maxBatches);
    }

    @Test
    void loopsUntilABatchComesBackNotFull() {
        when(relay.drain(any(), any(), eq(10)))
                .thenReturn(new RelayOutcome(10, 0, 0)) // lote lleno → sigue
                .thenReturn(new RelayOutcome(8, 2, 0))  // lleno (8+2=10) → sigue
                .thenReturn(new RelayOutcome(3, 0, 0));  // incompleto (<10) → corta

        scheduler(true, 10, 50).drain();

        verify(relay, times(3)).drain(any(), any(), eq(10));
    }

    @Test
    void stopsAtMaxBatchesPerTickEvenIfMoreRemain() {
        when(relay.drain(any(), any(), eq(10))).thenReturn(new RelayOutcome(10, 0, 0)); // siempre lleno

        scheduler(true, 10, 3).drain();

        verify(relay, times(3)).drain(any(), any(), eq(10)); // acotado al tope, no infinito
    }

    @Test
    void disabledDoesNotDrain() {
        scheduler(false, 10, 50).drain();

        verify(relay, never()).drain(any(), any(), org.mockito.ArgumentMatchers.anyInt());
    }
}
