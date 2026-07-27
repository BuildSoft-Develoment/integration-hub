package com.integrationhub.platform.service.payments.swift;

import com.integrationhub.platform.domain.ExecutionStatus;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.vertical.swift.mt101.repository.Mt101FragmentRepository;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * v54-fix: cierre de NEEDS_RECONCILIATION con el guard de terminalidad corregido en el doble-check
 * (todos los fragmentos terminales; un ARCHIVED sin enviar BLOQUEA el cierre — no falso-completado).
 */
class Mt101ReconciliationCloseServiceTest {

    private final Mt101FragmentRepository fragmentRepository = mock(Mt101FragmentRepository.class);
    private final ProcessExecutionStateService stateService = mock(ProcessExecutionStateService.class);
    private final Mt101ReconciliationCloseService service =
            new Mt101ReconciliationCloseService(null, null, fragmentRepository, stateService);

    private ProcessExecution execution(ExecutionStatus status) {
        var execution = new ProcessExecution();
        execution.id = 77L;
        execution.status = status;
        return execution;
    }

    @Test
    void blocksCloseWhenAnyFragmentIsNonTerminal() throws Exception {
        // Regla money-path: PAY inicio pero quedaron fragmentos ARCHIVED (nunca enviados) -> NO cerrar como completado.
        when(stateService.getExecution(77L)).thenReturn(execution(ExecutionStatus.NEEDS_RECONCILIATION));
        when(fragmentRepository.reconciliationSummary(any(), eq(77L)))
                .thenReturn(new Mt101FragmentRepository.ReconciliationSummary(5, 2, 0)); // 2 no-terminales

        var error = assertThrows(IllegalStateException.class,
                () -> service.closeReconciledExecution(null, 77L, "ana", "post-reconcile"));

        org.junit.jupiter.api.Assertions.assertTrue(error.getMessage().contains("not in a terminal dispatch"));
        verify(stateService, never()).closeReconciled(any(), anyBoolean(), any());
    }

    @Test
    void closesCompletedWhenAllFragmentsTerminalAndNoneRejected() throws Exception {
        when(stateService.getExecution(77L)).thenReturn(execution(ExecutionStatus.NEEDS_RECONCILIATION));
        when(fragmentRepository.reconciliationSummary(any(), eq(77L)))
                .thenReturn(new Mt101FragmentRepository.ReconciliationSummary(5, 0, 0));
        when(stateService.closeReconciled(eq(77L), eq(false), any())).thenReturn(true);

        var result = service.closeReconciledExecution(null, 77L, "ana", "post-reconcile");

        assertEquals("COMPLETED", result.status());
        verify(stateService).closeReconciled(eq(77L), eq(false), any());
    }

    @Test
    void closesCompletedWithErrorsWhenSomeFragmentsRejected() throws Exception {
        when(stateService.getExecution(77L)).thenReturn(execution(ExecutionStatus.NEEDS_RECONCILIATION));
        when(fragmentRepository.reconciliationSummary(any(), eq(77L)))
                .thenReturn(new Mt101FragmentRepository.ReconciliationSummary(5, 0, 2)); // todos terminales, 2 rejected
        when(stateService.closeReconciled(eq(77L), eq(true), any())).thenReturn(true);

        var result = service.closeReconciledExecution(null, 77L, "ana", "post-reconcile");

        assertEquals("COMPLETED_WITH_ERRORS", result.status());
        verify(stateService).closeReconciled(eq(77L), eq(true), any());
    }

    @Test
    void rejectsWhenExecutionIsNotInNeedsReconciliation() {
        when(stateService.getExecution(77L)).thenReturn(execution(ExecutionStatus.RUNNING));

        assertThrows(IllegalStateException.class,
                () -> service.closeReconciledExecution(null, 77L, "ana", "post-reconcile"));
    }
}
