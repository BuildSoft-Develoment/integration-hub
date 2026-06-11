package com.integrationhub.platform.spi.task;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record TaskResult(boolean success,
                         boolean suspended,
                         String details,
                         Map<String, Object> outputs,
                         Map<String, Object> suspendedState) {

    public TaskResult {
        outputs = outputs == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(outputs));
        suspendedState = suspendedState == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(suspendedState));
    }

    public static TaskResult success(String details) {
        return new TaskResult(true, false, details, Map.of(), Map.of());
    }

    public static TaskResult success(String details, Map<String, Object> outputs) {
        return new TaskResult(true, false, details, outputs, Map.of());
    }

    public static TaskResult failure(String details) {
        return new TaskResult(false, false, details, Map.of(), Map.of());
    }

    public static TaskResult failure(String details, Map<String, Object> outputs) {
        return new TaskResult(false, false, details, outputs, Map.of());
    }

    /**
     * Marca la tarea como <b>suspended</b>: no se completo, pero tampoco fallo;
     * espera a que un evento externo (callback bancario, scheduler periodico,
     * approval humano) la reanude. Foundation de M-2 (T-017 spec 003, ADR-009).
     *
     * <p>El {@code suspendedState} es JSON-friendly y se persiste a
     * {@code process_task_execution.suspended_state}. El engine reanuda
     * invocando {@link SuspendableTaskProvider#resume} con este state.</p>
     *
     * <p>{@code success} se reporta como {@code true} para que el engine no
     * marque el proceso como fallido; el discriminador real es
     * {@link #suspended()}.</p>
     */
    public static TaskResult suspended(String details, Map<String, Object> suspendedState) {
        return new TaskResult(true, true, details, Map.of(), suspendedState);
    }
}
