package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.task.AsyncTaskEnvelope;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockingDetails;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * §5 (F3): el heartbeat renueva el lease mientras un efecto largo corre y deja de renovar al terminar. Para
 * tareas rápidas (menos de {@code lease/2}) no renueva nunca — overhead nulo en el caso común.
 */
class LeaseHeartbeatTest {

    private final AsyncTaskEnvelope env = new AsyncTaskEnvelope(
            "exec-1", 1L, 2L, "DB_WRITE", "KAFKA", "idem-hb", 1, "{}", Map.of());

    @Test
    void renewsLeaseWhileWorkRunsAndStopsAfterCompletion() throws Exception {
        var inbox = mock(TaskInboxStore.class);
        when(inbox.renewLease(any(), anyString(), anyInt())).thenReturn(true);
        var heartbeat = new LeaseHeartbeat(inbox, 2, 1); // lease 2s → renueva cada 1s

        heartbeat.runWithHeartbeat(env, "node-A", () -> {
            sleepQuietly(2500); // supera lease/2 (1s) varias veces
            return null;
        });

        // Renovó al menos una vez con el owner correcto mientras el work corría.
        verify(inbox, atLeastOnce()).renewLease(eq(env), eq("node-A"), eq(2));
        // Tras terminar, el ScheduledFuture se canceló: no hay más renovaciones.
        var invocationsAfterWork = mockingDetails(inbox).getInvocations().size();
        Thread.sleep(1500);
        assertEquals(invocationsAfterWork, mockingDetails(inbox).getInvocations().size(),
                "no se renueva el lease tras terminar el work (heartbeat cancelado)");
    }

    @Test
    void fastWorkNeverRenews() {
        var inbox = mock(TaskInboxStore.class);
        var heartbeat = new LeaseHeartbeat(inbox, 30, 1); // renueva a los 15s; el work termina al instante

        var result = heartbeat.runWithHeartbeat(env, "node-A", () -> "done");

        assertEquals("done", result);
        verify(inbox, never()).renewLease(any(), anyString(), anyInt());
    }

    @Test
    void cancelsHeartbeatEvenWhenWorkThrows() {
        var inbox = mock(TaskInboxStore.class);
        var heartbeat = new LeaseHeartbeat(inbox, 2, 1);
        try {
            heartbeat.runWithHeartbeat(env, "node-A", () -> {
                throw new IllegalStateException("boom");
            });
        } catch (IllegalStateException expected) {
            // el finally debe haber cancelado la renovación; sin renovaciones pendientes acumulándose
        }
        verify(inbox, never()).renewLease(any(), anyString(), anyInt());
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }
}
