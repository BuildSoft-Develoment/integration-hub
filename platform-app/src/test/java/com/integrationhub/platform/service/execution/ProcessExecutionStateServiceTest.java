package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.domain.ExecutionStatus;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// @covers RF-005 (reingenieria: prueba que cubre el/los RF en produccion)
class ProcessExecutionStateServiceTest {

    private final ProcessDefinitionRepository processDefinitionRepository = mock(ProcessDefinitionRepository.class);
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository = mock(ProcessTaskDefinitionRepository.class);
    private final ProcessExecutionRepository processExecutionRepository = mock(ProcessExecutionRepository.class);
    private final ProcessTaskExecutionRepository processTaskExecutionRepository = mock(ProcessTaskExecutionRepository.class);
    private final AuditService auditService = mock(AuditService.class);

    private final ProcessExecutionStateService service = new ProcessExecutionStateService(
            processDefinitionRepository,
            processTaskDefinitionRepository,
            processExecutionRepository,
            processTaskExecutionRepository,
            auditService);

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
    void markProcessRunningTransitionsPendingToRunning() {
        var execution = pendingExecution(1L);
        when(processExecutionRepository.findById(1L)).thenReturn(execution);

        var result = service.markProcessRunningIfPending(1L);

        assertTrue(result);
        assertEquals(ExecutionStatus.RUNNING, execution.status);
        assertEquals("Process execution started", execution.details);
        verify(auditService).record(eq(execution), isNull(), eq("PROCESS_STARTED"), eq("RUNNING"), any(), any());
    }

    @Test
    void markProcessRunningReturnsFalseWhenNotFound() {
        when(processExecutionRepository.findById(2L)).thenReturn(null);

        assertFalse(service.markProcessRunningIfPending(2L));
    }

    @Test
    void markProcessRunningReturnsFalseWhenNotPending() {
        var execution = pendingExecution(3L);
        execution.status = ExecutionStatus.RUNNING;
        when(processExecutionRepository.findById(3L)).thenReturn(execution);

        assertFalse(service.markProcessRunningIfPending(3L));
    }

    @Test
    void completeProcessSetsCompletedAndFinishedAt() {
        var execution = pendingExecution(4L);
        when(processExecutionRepository.findById(4L)).thenReturn(execution);

        service.completeProcess(4L, "ok");

        assertEquals(ExecutionStatus.COMPLETED, execution.status);
        assertEquals("ok", execution.details);
        assertNotNull(execution.finishedAt);
        verify(auditService).record(eq(execution), isNull(), eq("PROCESS_COMPLETED"), eq("COMPLETED"), eq("ok"), isNull());
    }

    @Test
    void failProcessSetsFailedAndFinishedAt() {
        var execution = pendingExecution(5L);
        when(processExecutionRepository.findById(5L)).thenReturn(execution);

        service.failProcess(5L, "boom");

        assertEquals(ExecutionStatus.FAILED, execution.status);
        assertEquals("boom", execution.details);
        assertNotNull(execution.finishedAt);
        verify(auditService).record(eq(execution), isNull(), eq("PROCESS_FAILED"), eq("FAILED"), eq("boom"), isNull());
    }

    @Test
    void completeProcessWithErrorsSetsCompletedWithErrors() {
        var execution = pendingExecution(6L);
        when(processExecutionRepository.findById(6L)).thenReturn(execution);

        service.completeProcessWithErrors(6L, "parcial");

        assertEquals(ExecutionStatus.COMPLETED_WITH_ERRORS, execution.status);
        assertEquals("parcial", execution.details);
        assertNotNull(execution.finishedAt);
    }

    @Test
    void startTaskPersistsRunningTaskExecution() {
        var execution = pendingExecution(8L);
        var taskDefinition = new ProcessTaskDefinition();
        taskDefinition.id = 11L;
        when(processExecutionRepository.findById(8L)).thenReturn(execution);
        when(processTaskDefinitionRepository.findById(11L)).thenReturn(taskDefinition);

        service.startTask(8L, 11L, "READER", 1);

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
        when(processExecutionRepository.findById(9L)).thenReturn(execution);
        when(processTaskExecutionRepository.findById(21L)).thenReturn(taskExecution);

        service.completeTask(9L, 21L, "done", null);

        assertEquals(ExecutionStatus.COMPLETED, taskExecution.status);
        assertEquals("done", taskExecution.details);
        assertNotNull(taskExecution.finishedAt);
    }

    @Test
    void failTaskSetsFailedStatus() {
        var execution = pendingExecution(10L);
        var taskDefinition = new ProcessTaskDefinition();
        taskDefinition.id = 13L;
        var taskExecution = new ProcessTaskExecution();
        taskExecution.id = 22L;
        taskExecution.taskDefinition = taskDefinition;
        when(processExecutionRepository.findById(10L)).thenReturn(execution);
        when(processTaskExecutionRepository.findById(22L)).thenReturn(taskExecution);

        service.failTask(10L, 22L, "task boom", null);

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
