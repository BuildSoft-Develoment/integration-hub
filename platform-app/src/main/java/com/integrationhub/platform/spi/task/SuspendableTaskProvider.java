package com.integrationhub.platform.spi.task;

import java.util.Map;

/**
 * SPI opcional para tareas <b>long-running</b> con suspend/resume.
 *
 * <p>Foundation de M-2 (T-017 spec 003, ADR-009): introduce el contrato pero
 * NO implementa el mecanismo del engine (suspend persistente +
 * resume mediante callback/scheduler). Lo deja como extension point para una
 * iteracion posterior cuando exista un caso de uso productivo concreto.</p>
 *
 * <p>Casos de uso futuros:</p>
 * <ul>
 *   <li>{@code MT101_STATUS} mode {@code poll}: pollea estado cada N segundos
 *       sin bloquear un worker.</li>
 *   <li>{@code MT101_STATUS} mode {@code callback}: espera un push del gateway
 *       que puede llegar dias despues (MT900/MT910).</li>
 *   <li>Open Banking transacciones con strong customer authentication
 *       (SCA) que requieren confirmacion del usuario.</li>
 *   <li>Approval workflows con steps humanos.</li>
 * </ul>
 *
 * <p><b>Contrato</b>:</p>
 * <ol>
 *   <li>{@link TaskProvider#execute} corre normalmente. Si la tarea NO puede
 *       completarse de inmediato, retorna {@link TaskResult#suspended} con un
 *       {@code suspendedState} serializable (JSON-friendly).</li>
 *   <li>El engine detecta el estado suspended, persiste el state a
 *       {@code process_task_execution.suspended_state} y libera el worker.</li>
 *   <li>Un trigger externo (scheduler periodico o endpoint POST de callback)
 *       invoca {@link #resume} pasando el state previamente persistido.</li>
 *   <li>{@code resume} puede retornar completed (con outputs finales) o
 *       suspended nuevamente (otro ciclo de polling).</li>
 * </ol>
 *
 * <p><b>Implementacion del engine pendiente</b>:</p>
 * <ul>
 *   <li>Migracion V13 con columna {@code suspended_state} TEXT en
 *       {@code process_task_execution}.</li>
 *   <li>Detection en {@code ProcessTaskRuntimeService} del result.suspended().</li>
 *   <li>Endpoint REST {@code POST /api/process-executions/{eid}/tasks/{tid}/resume}.</li>
 *   <li>Scheduler para resumes periodicos (integrado con spec 006).</li>
 * </ul>
 */
public interface SuspendableTaskProvider extends TaskProvider {

    /**
     * Reanuda la ejecucion desde un estado previamente suspendido.
     *
     * @param context contexto fresco (los outputs de tareas anteriores se
     *                rehidratan via {@code taskOutputs}).
     * @param configuration configuracion original de la tarea.
     * @param suspendedState el state que el provider emitio en su ultima
     *                       invocacion via {@link TaskResult#suspended}.
     * @return resultado completado, o suspended nuevamente para otro ciclo.
     */
    TaskResult resume(TaskContext context, Map<String, Object> configuration, Map<String, Object> suspendedState);
}
