package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.spi.execution.ExecutionStatus;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.entity.ProcessTaskDefinition;
import com.integrationhub.platform.entity.ProcessTaskExecution;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.repository.ProcessExecutionRepository;
import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.repository.ProcessTaskExecutionRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

// @covers RF-005 (reingenieria: prueba que cubre el/los RF en produccion)
class ProcessExecutionStateServiceTest {

    private final ProcessDefinitionRepository processDefinitionRepository = mock(ProcessDefinitionRepository.class);
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository = mock(ProcessTaskDefinitionRepository.class);
    private final ProcessExecutionRepository processExecutionRepository = mock(ProcessExecutionRepository.class);
    private final ProcessTaskExecutionRepository processTaskExecutionRepository = mock(ProcessTaskExecutionRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final com.integrationhub.platform.service.execution.async.TaskOutboxStore taskOutboxStore =
            mock(com.integrationhub.platform.service.execution.async.TaskOutboxStore.class);
    private final com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService sliceDispatchService =
            mock(com.integrationhub.platform.service.execution.async.AsyncSliceDispatchService.class);

    private final MoneyMovementDetector moneyMovementDetector = mock(MoneyMovementDetector.class);

    private final ProcessExecutionStateService service = new ProcessExecutionStateService(
            processDefinitionRepository,
            processTaskDefinitionRepository,
            processExecutionRepository,
            processTaskExecutionRepository,
            auditService,
            taskOutboxStore,
            sliceDispatchService,
            moneyMovementDetector);

    private ProcessExecution pendingExecution(Long id) {
        var definition = new ProcessDefinition();
        definition.id = 7L;
        definition.name = "carga";

        var execution = new ProcessExecution();
        execution.id = id;
        execution.processDefinition = definition;
        execution.status = ExecutionStatus.PENDING;
        return execution;
    }

    @Test
    void claimProcessForExecutionSucceedsWhenAtomicUpdateAffectsTheRow() {
        var execution = pendingExecution(1L);
        when(processExecutionRepository.claimForRunning(eq(1L), eq("nodeA"), eq("tok"), any(), any())).thenReturn(1);
        when(processExecutionRepository.findById(1L)).thenReturn(execution);

        var result = service.claimProcessForExecution(1L, "nodeA", "tok", 30);

        assertTrue(result);
        verify(auditService).record(eq(execution), isNull(), eq("PROCESS_STARTED"), eq("RUNNING"), any(), any());
    }

    @Test
    void claimProcessForExecutionReturnsFalseWhenAnotherNodeWonTheClaim() {
        // El UPDATE ... WHERE status='PENDING' no afecto ninguna fila -> otro nodo la reclamo antes.
        when(processExecutionRepository.claimForRunning(eq(2L), any(), any(), any(), any())).thenReturn(0);

        assertFalse(service.claimProcessForExecution(2L, "nodeB", "tok2", 30));
    }

    @Test
    void recoverRoutesAnExpiredExecutionThatStartedPayToNeedsReconciliation() {
        // Regla de seguridad money-path: una huerfana que YA inicio MT101_PAY NO se re-ejecuta -> NEEDS_RECONCILIATION.
        var execution = pendingExecution(30L);
        when(processExecutionRepository.listExpiredRunningIds(any(), eq(50))).thenReturn(java.util.List.of(30L));
        when(processExecutionRepository.hasStartedMoneyMovement(30L)).thenReturn(true);
        when(processExecutionRepository.recoverExpiredRunning(eq(30L), eq(ExecutionStatus.NEEDS_RECONCILIATION), any(), any()))
                .thenReturn(1);
        when(processExecutionRepository.findById(30L)).thenReturn(execution);

        var recovered = service.recoverExpiredExecutions(50);

        assertEquals(1, recovered);
        verify(processExecutionRepository).recoverExpiredRunning(eq(30L), eq(ExecutionStatus.NEEDS_RECONCILIATION), any(), any());
    }

    @Test
    void recoverProtectsAnyTaskThatMovedMoneyNotJustTheOnesNamedLikeAPayment() {
        // ADR-021, en dos pasos. Primero el motor dejo de traer el literal "MT101_PAY" y paso a preguntar
        // por la CAPACIDAD declarada, de modo que la tarea de pago de un vertical nuevo tambien quedaba
        // protegida. Despues (bloque E) dejo de preguntar por el TIPO: la decision se toma al arrancar
        // cada tarea —incluyendo la entrega generica a una fuente marcada como banco— y queda persistida.
        // Aca el barrido solo lee esa marca, asi que ya no depende de que la definicion siga igual.
        var execution = pendingExecution(32L);
        when(processExecutionRepository.listExpiredRunningIds(any(), eq(50))).thenReturn(java.util.List.of(32L));
        when(processExecutionRepository.hasStartedMoneyMovement(32L)).thenReturn(true);
        when(processExecutionRepository.recoverExpiredRunning(eq(32L), eq(ExecutionStatus.NEEDS_RECONCILIATION), any(), any()))
                .thenReturn(1);
        when(processExecutionRepository.findById(32L)).thenReturn(execution);

        var recovered = service.recoverExpiredExecutions(50);

        assertEquals(1, recovered);
        verify(processExecutionRepository).recoverExpiredRunning(eq(32L), eq(ExecutionStatus.NEEDS_RECONCILIATION), any(), any());
    }

    @Test
    void recoverReQueuesAnExpiredExecutionThatDidNotStartPay() {
        var execution = pendingExecution(31L);
        when(processExecutionRepository.listExpiredRunningIds(any(), eq(50))).thenReturn(java.util.List.of(31L));
        when(processExecutionRepository.hasStartedMoneyMovement(31L)).thenReturn(false);
        when(processExecutionRepository.recoverExpiredRunning(eq(31L), eq(ExecutionStatus.PENDING), any(), any()))
                .thenReturn(1);
        when(processExecutionRepository.findById(31L)).thenReturn(execution);

        var recovered = service.recoverExpiredExecutions(50);

        assertEquals(1, recovered);
        verify(processExecutionRepository).recoverExpiredRunning(eq(31L), eq(ExecutionStatus.PENDING), any(), any());
    }

    @Test
    void closeReconciledClosesAtomicallyFromNeedsReconciliationAndAudits() {
        var execution = pendingExecution(40L);
        when(processExecutionRepository.closeFromNeedsReconciliation(eq(40L),
                eq(ExecutionStatus.COMPLETED_WITH_ERRORS), any(), any())).thenReturn(1);
        when(processExecutionRepository.findById(40L)).thenReturn(execution);

        assertTrue(service.closeReconciled(40L, true, "reconciled"));
        verify(auditService).record(eq(execution), isNull(), eq("PROCESS_RECONCILED_CLOSED"),
                eq("COMPLETED_WITH_ERRORS"), any(), any());
    }

    @Test
    void closeReconciledReturnsFalseWhenNotInNeedsReconciliation() {
        when(processExecutionRepository.closeFromNeedsReconciliation(eq(41L), any(), any(), any())).thenReturn(0);

        assertFalse(service.closeReconciled(41L, false, "reconciled"));
        verifyNoInteractions(auditService);
    }

    @Test
    void completeProcessTransitionsWhenTokenMatchesRunning() {
        var execution = pendingExecution(4L);
        when(processExecutionRepository.transitionRunningProcess(eq(4L), eq("tok"), eq(ExecutionStatus.COMPLETED), eq("ok"), any())).thenReturn(1);
        when(processExecutionRepository.findById(4L)).thenReturn(execution);

        service.completeProcess(4L, "tok", "ok");

        verify(processExecutionRepository).transitionRunningProcess(eq(4L), eq("tok"), eq(ExecutionStatus.COMPLETED), eq("ok"), any());
        verify(auditService).record(eq(execution), isNull(), eq("PROCESS_COMPLETED"), eq("COMPLETED"), eq("ok"), isNull());
    }

    @Test
    void completeProcessThrowsFencingWhenTokenLost() {
        // P2: el UPDATE guardado no afecta filas (token perdido / no RUNNING) -> fencing, sin auditar ni cerrar.
        when(processExecutionRepository.transitionRunningProcess(eq(4L), eq("stale"), any(), any(), any())).thenReturn(0);

        assertThrows(FencingTokenLostException.class, () -> service.completeProcess(4L, "stale", "ok"));
        verifyNoInteractions(auditService);
    }

    @Test
    void failProcessTransitionsWhenTokenMatchesRunning() {
        var execution = pendingExecution(5L);
        when(processExecutionRepository.transitionRunningProcess(eq(5L), eq("tok"), eq(ExecutionStatus.FAILED), eq("boom"), any())).thenReturn(1);
        when(processExecutionRepository.findById(5L)).thenReturn(execution);

        service.failProcess(5L, "tok", "boom");

        verify(auditService).record(eq(execution), isNull(), eq("PROCESS_FAILED"), eq("FAILED"), eq("boom"), isNull());
    }

    @Test
    void completeProcessWithErrorsTransitionsWhenTokenMatchesRunning() {
        var execution = pendingExecution(6L);
        when(processExecutionRepository.transitionRunningProcess(eq(6L), eq("tok"), eq(ExecutionStatus.COMPLETED_WITH_ERRORS), eq("parcial"), any())).thenReturn(1);
        when(processExecutionRepository.findById(6L)).thenReturn(execution);

        service.completeProcessWithErrors(6L, "tok", "parcial");

        verify(processExecutionRepository).transitionRunningProcess(eq(6L), eq("tok"), eq(ExecutionStatus.COMPLETED_WITH_ERRORS), eq("parcial"), any());
    }

    @Test
    void startTaskPersistsRunningTaskExecution() {
        var execution = pendingExecution(8L);
        var taskDefinition = new ProcessTaskDefinition();
        taskDefinition.id = 11L;
        when(processExecutionRepository.touchRunningOwner(eq(8L), eq("tok"), any())).thenReturn(1);
        when(processExecutionRepository.findById(8L)).thenReturn(execution);
        when(processTaskDefinitionRepository.findById(11L)).thenReturn(taskDefinition);

        service.startTask(8L, "tok", 11L, "READER", 1);

        verify(processTaskExecutionRepository).persist(any(ProcessTaskExecution.class));
        verify(auditService).record(eq(execution), eq(taskDefinition), eq("TASK_STARTED"), eq("RUNNING"), any(), any());
    }

    @Test
    void completeTaskSetsCompletedStatus() {
        var execution = pendingExecution(9L);
        var taskDefinition = new ProcessTaskDefinition();
        taskDefinition.id = 12L;
        var taskExecution = new ProcessTaskExecution();
        taskExecution.id = 21L;
        taskExecution.taskDefinition = taskDefinition;
        when(processExecutionRepository.touchRunningOwner(eq(9L), eq("tok"), any())).thenReturn(1);
        when(processExecutionRepository.findById(9L)).thenReturn(execution);
        when(processTaskExecutionRepository.findById(21L)).thenReturn(taskExecution);

        service.completeTask(9L, "tok", 21L, "done", null);

        assertEquals(ExecutionStatus.COMPLETED, taskExecution.status);
        assertEquals("done", taskExecution.details);
        assertNotNull(taskExecution.finishedAt);
    }

    @Test
    void completeTaskThrowsFencingWhenTokenLost() {
        // P2: assertOwner (touchRunningOwner) no afecta filas -> fencing antes de mutar la tarea.
        when(processExecutionRepository.touchRunningOwner(eq(9L), eq("stale"), any())).thenReturn(0);

        assertThrows(FencingTokenLostException.class, () -> service.completeTask(9L, "stale", 21L, "done", null));
        verifyNoInteractions(processTaskExecutionRepository);
    }

    @Test
    void failTaskSetsFailedStatus() {
        var execution = pendingExecution(10L);
        var taskDefinition = new ProcessTaskDefinition();
        taskDefinition.id = 13L;
        var taskExecution = new ProcessTaskExecution();
        taskExecution.id = 22L;
        taskExecution.taskDefinition = taskDefinition;
        when(processExecutionRepository.touchRunningOwner(eq(10L), eq("tok"), any())).thenReturn(1);
        when(processExecutionRepository.findById(10L)).thenReturn(execution);
        when(processTaskExecutionRepository.findById(22L)).thenReturn(taskExecution);

        service.failTask(10L, "tok", 22L, "task boom", null);

        assertEquals(ExecutionStatus.FAILED, taskExecution.status);
        assertEquals("task boom", taskExecution.details);
        assertNotNull(taskExecution.finishedAt);
    }

    @Test
    void getExecutionDelegatesToRepository() {
        var execution = pendingExecution(14L);
        when(processExecutionRepository.findById(14L)).thenReturn(execution);

        assertSame(execution, service.getExecution(14L));
    }

    @Test
    void countPendingProcessesDelegatesToRepository() {
        when(processExecutionRepository.countPendingExecutions()).thenReturn(3L);

        assertEquals(3L, service.countPendingProcesses());
    }
}
