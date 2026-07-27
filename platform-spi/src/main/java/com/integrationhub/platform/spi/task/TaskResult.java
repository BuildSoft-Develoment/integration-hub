package com.integrationhub.platform.spi.task;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record TaskResult(boolean success,
                         boolean suspended,
                         String details,
                         Map<String, Object> outputs,
                         Map<String, Object> suspendedState,
                         boolean needsReconciliation,
                         boolean reconciliationResolved) {

    public TaskResult {
        outputs = outputs == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(outputs));
        suspendedState = suspendedState == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(suspendedState));
    }

    public static TaskResult success(String details) {
        return new TaskResult(true, false, details, Map.of(), Map.of(), false, false);
    }

    public static TaskResult success(String details, Map<String, Object> outputs) {
        return new TaskResult(true, false, details, outputs, Map.of(), false, false);
    }

    public static TaskResult failure(String details) {
        return new TaskResult(false, false, details, Map.of(), Map.of(), false, false);
    }

    public static TaskResult failure(String details, Map<String, Object> outputs) {
        return new TaskResult(false, false, details, outputs, Map.of(), false, false);
    }

    /**
     * G1 — resultado de negocio no-exitoso donde quedó <b>dinero en estado ambiguo</b> (p.ej. MT101_PAY normal con
     * fragmentos {@code UNCERTAIN}): no es un fallo técnico ni un éxito. El motor NO debe cerrar la ejecución como
     * {@code COMPLETED} silencioso ni {@code FAILED} opaco; la enruta a {@code NEEDS_RECONCILIATION} para forzar
     * conciliación (STATUS/RECONCILE), reusando el ciclo de cierre existente. Señal genérica (cualquier provider de
     * money-path puede emitirla), no acopla el motor a MT101.
     */
    public static TaskResult needsReconciliation(String details, Map<String, Object> outputs) {
        return new TaskResult(false, false, details, outputs, Map.of(), true, false);
    }

    /**
     * G1 (opción B) — resultado <b>exitoso</b> de un resolutor (p.ej. MT101_STATUS con {@code resolveNormalPay}) que
     * <b>resolvió toda la ambigüedad</b> de dinero previa (0 pendientes, 0 conflictos, 0 errores de gateway). El motor
     * <b>limpia</b> el flag de reconciliación: si no queda dinero incierto, el proceso puede cerrar {@code COMPLETED} en
     * vez de quedar en {@code NEEDS_RECONCILIATION}. Señal genérica, espejo de {@link #needsReconciliation}.
     */
    public static TaskResult resolvedReconciliation(String details, Map<String, Object> outputs) {
        return new TaskResult(true, false, details, outputs, Map.of(), false, true);
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
        return new TaskResult(true, true, details, Map.of(), suspendedState, false, false);
    }
}
