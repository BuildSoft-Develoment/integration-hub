package com.integrationhub.platform.service.execution.fastpath;

import com.integrationhub.platform.entity.ProcessExecution;
import com.integrationhub.platform.service.execution.ProcessExecutionStateService;

import java.util.List;
import java.util.Map;

/**
 * Interface for strategies that provide an optimized execution path for specific task sequences.
 */
public interface ExecutionFastPath {

    /**
     * Checks if this fast path supports the given task sequence.
     *
     * @param current The current task plan.
     * @param next    The next task plan (if any).
     * @return true if this strategy can execute these tasks optimized.
     */
    boolean supports(ProcessExecutionStateService.TaskPlan current, ProcessExecutionStateService.TaskPlan next);

    /**
     * Executes the optimized path.
     *
     * @param processExecutionId        The ID of the process execution.
     * @param current                   The current task plan (e.g. READ).
     * @param next                      The next task plan (e.g. WRITE/REST).
     * @param executionVariables        The global execution variables.
     * @param selectedFiles             The list of selected file references from the trigger.
     * @param triggerSource             The source of the trigger (for audit).
     * @param taskOutputs               Shared output registry for subsequent tasks.
     * @return The resulting ProcessExecution state or null if a custom fail-fast happened.
     */
    ProcessExecution execute(Long processExecutionId,
                             String executionToken,
                             ProcessExecutionStateService.TaskPlan current,
                             ProcessExecutionStateService.TaskPlan next,
                             Map<String, String> executionVariables,
                             List<String> selectedFiles,
                             String triggerSource,
                             Map<String, Object> taskOutputs);

    /**
     * Returns the number of tasks consumed by this fast path.
     * (e.g. 2 for a READ+WRITE pair).
     */
    int consumedTaskCount();
}
