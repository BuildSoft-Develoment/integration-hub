-- @trace spec 003 T-017 (M-2.1 continuacion downstream post-resume), ADR-009
--
-- Envelope JSON {taskOutputs, executionVariables, triggerSource} capturado al
-- suspender. Permite que, al completar un resume con tareas downstream, el
-- engine rehidrate el contexto y continue el pipeline desde taskOrder+1 en
-- vez de devolver COMPLETED_NEEDS_REDRIVE.

alter table process_task_execution
    add column if not exists suspended_continuation text;
