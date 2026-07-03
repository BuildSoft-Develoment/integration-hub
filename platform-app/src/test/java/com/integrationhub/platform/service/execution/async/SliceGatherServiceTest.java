package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.entity.TaskAsyncDispatch;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository;
import com.integrationhub.platform.repository.TaskAsyncDispatchRepository.SliceProgress;
import com.integrationhub.platform.repository.TaskInboxRepository;
import com.integrationhub.platform.task.AsyncTaskEnvelope;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Doble check del gather (Opción B, F-B2): dedup + incremento atómicos, y el safety net que evita
 * dedupar-sin-contar cuando el tracker aún no existe (carrera) — se relanza para reintentar.
 */
class SliceGatherServiceTest {

    private final TaskInboxRepository inbox = mock(TaskInboxRepository.class);
    private final TaskAsyncDispatchRepository tracker = mock(TaskAsyncDispatchRepository.class);
    private final SliceGatherService service = new SliceGatherService(inbox, tracker);

    private final AsyncTaskEnvelope envelope = new AsyncTaskEnvelope(
            "exec-1", 1L, 2L, "DB_WRITE", "KAFKA", "slice-key", 1, "{}", Map.of());

    private void inboxInsertReturns(long affected) {
        when(inbox.insertIfAbsent(anyString(), any(), anyLong(), anyLong(), anyString(),
                any(), any(), any(), any(), any(), any())).thenReturn(affected);
    }

    @Test
    void countsSliceWhenTrackerActive() {
        inboxInsertReturns(1);
        when(tracker.recordSliceCompleted(1L, 2L)).thenReturn(Optional.of(new SliceProgress(1, 0, 3, false)));

        var progress = service.commitCompletedSlice(envelope, "{}", "ok");

        assertTrue(progress.isPresent());
    }

    @Test
    void duplicateSliceDoesNotIncrement() {
        inboxInsertReturns(0); // ya insertada (reentrega)

        var progress = service.commitCompletedSlice(envelope, "{}", "ok");

        assertTrue(progress.isEmpty());
        verify(tracker, never()).recordSliceCompleted(anyLong(), anyLong());
    }

    @Test
    void absentTrackerThrowsToRetryInsteadOfDedupWithoutCounting() {
        inboxInsertReturns(1);
        when(tracker.recordSliceCompleted(1L, 2L)).thenReturn(Optional.empty());
        when(tracker.findByExecutionAndTask(1L, 2L)).thenReturn(Optional.empty()); // tracker no existe aún

        assertThrows(IllegalStateException.class, () -> service.commitCompletedSlice(envelope, "{}", "ok"));
    }

    @Test
    void alreadyClosedScatterIsLegitSkipNotAnError() {
        inboxInsertReturns(1);
        when(tracker.recordSliceCompleted(1L, 2L)).thenReturn(Optional.empty());
        var closed = new TaskAsyncDispatch();
        closed.status = TaskAsyncDispatch.COMPLETED;
        when(tracker.findByExecutionAndTask(1L, 2L)).thenReturn(Optional.of(closed));

        var progress = service.commitCompletedSlice(envelope, "{}", "ok");

        assertTrue(progress.isEmpty(), "scatter ya cerrado → skip legítimo, sin lanzar");
    }
}
