package com.integrationhub.platform.service.execution.async;

import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * P9 (recovery-side) — el scheduler solo tiene dos responsabilidades (SRP): respetar el gate y delegar el redrive en el
 * {@link AsyncTaskDlqService} (que ya prueba el DEAD→PENDING real en {@code AsyncTaskDlqIT}). Un fallo del barrido no
 * propaga (no debe tumbar el scheduler).
 */
class AsyncOutboxDeadRedriveSchedulerTest {

    private final AsyncTaskDlqService dlqService = mock(AsyncTaskDlqService.class);

    @Test
    void sweepRedrivesDeadRowsWhenEnabled() {
        when(dlqService.redriveOutboxDead(100)).thenReturn(3L);
        var scheduler = new AsyncOutboxDeadRedriveScheduler(dlqService, true, 100);

        scheduler.sweep();

        verify(dlqService).redriveOutboxDead(eq(100));
    }

    @Test
    void sweepIsNoOpWhenDisabled() {
        var scheduler = new AsyncOutboxDeadRedriveScheduler(dlqService, false, 100);

        scheduler.sweep();

        verify(dlqService, never()).redriveOutboxDead(org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void sweepSwallowsErrorsSoTheSchedulerSurvives() {
        doThrow(new IllegalStateException("db down")).when(dlqService).redriveOutboxDead(50);
        var scheduler = new AsyncOutboxDeadRedriveScheduler(dlqService, true, 50);

        scheduler.sweep(); // no debe propagar: el próximo tick reintenta
    }
}
