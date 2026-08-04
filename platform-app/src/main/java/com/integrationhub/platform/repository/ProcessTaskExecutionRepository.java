package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.ProcessTaskExecution;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProcessTaskExecutionRepository implements PanacheRepository<ProcessTaskExecution> {

    public PanacheQuery<ProcessTaskExecution> findByProcessExecutionId(Long processExecutionId) {
        return find("from ProcessTaskExecution e where e.processExecution.id = ?1 order by e.id asc", processExecutionId);
    }

    /**
     * Lookup por {@code resume_token} para el endpoint de callback de M-2.
     * Devuelve {@code null} si no existe o ya fue reanudado.
     *
     * @trace spec 003-diseno-y-ejecucion-procesos T-017, ADR-009
     */
    public ProcessTaskExecution findActiveByResumeToken(String resumeToken) {
        if (resumeToken == null || resumeToken.isBlank()) {
            return null;
        }
        return find("resumeToken = ?1 and resumedAt is null", resumeToken).firstResult();
    }

    /**
     * Token activo mas reciente de una ejecucion (para reportar el nuevo token
     * cuando una tarea downstream se suspende durante la continuacion M-2.1).
     */
    public String findActiveResumeToken(Long processExecutionId) {
        if (processExecutionId == null) {
            return null;
        }
        var taskExecution = find(
                "processExecution.id = ?1 and resumedAt is null and resumeToken is not null order by id desc",
                processExecutionId).firstResult();
        return taskExecution == null ? null : taskExecution.resumeToken;
    }

    /**
     * Lookup de la suspensión activa por ejecución + definición de tarea (ADR-015 Etapa 4). El
     * consumer async conoce estos ids desde el {@code AsyncTaskEnvelope} y con ellos correlaciona la
     * tarea suspendida por despacho async para completarla con el resultado ya calculado. Devuelve
     * {@code null} si no hay ninguna suspendida activa (p.ej. ya reanudada) → la completación es
     * idempotente.
     */
    public ProcessTaskExecution findActiveSuspendedByExecutionAndTask(Long processExecutionId, Long taskDefinitionId) {
        if (processExecutionId == null || taskDefinitionId == null) {
            return null;
        }
        return find("processExecution.id = ?1 and taskDefinition.id = ?2 and resumedAt is null and status = ?3 "
                        + "order by id desc",
                processExecutionId, taskDefinitionId,
                com.integrationhub.platform.spi.execution.ExecutionStatus.SUSPENDED).firstResult();
    }

    /**
     * Suspensiones vencidas para el auto-despertar del scheduler M-2 (modo poll).
     * Soportado por el indice parcial {@code ix_process_task_execution_suspend_expires_at}
     * (V13).
     *
     * @trace spec 003-diseno-y-ejecucion-procesos T-017, ADR-009
     */
    public java.util.List<ProcessTaskExecution> findExpiredSuspensions(java.time.LocalDateTime now, int limit) {
        return find("status = ?1 and resumedAt is null and suspendExpiresAt is not null and suspendExpiresAt <= ?2",
                com.integrationhub.platform.spi.execution.ExecutionStatus.SUSPENDED, now)
                .page(0, Math.max(limit, 1))
                .list();
    }

    /**
     * Cierra las tareas que se quedaron en {@code RUNNING} cuando el nodo que las ejecutaba perdio el
     * lease. Devuelve cuantas cerro.
     *
     * <p><b>Por que hace falta.</b> La recuperacion solo tocaba {@code process_execution}: reencolaba
     * la ejecucion y dejaba las filas de tarea del intento abortado en {@code RUNNING} para siempre.
     * En la base de dev habia 27 asi, dentro de ejecuciones ya terminadas en {@code FAILED} — nadie
     * las iba a cerrar nunca, y cualquier recuento de "tareas en ejecucion" las sumaba.</p>
     *
     * <p><b>Por que ABORTED y no FAILED.</b> No fallaron: se quedaron sin nodo. Contarlas como fallos
     * ensucia la unica cifra que sirve para saber si un proceso va mal, y ademas miente sobre lo que
     * paso. Es la misma distincion que el producto sostiene entre "rechazado" y "sin confirmar".</p>
     *
     * <p><b>Por que se excluye {@code movesMoney}.</b> Una tarea que movio dinero y quedo huerfana es
     * la EVIDENCIA de que hubo un efecto no idempotente: {@code hasStartedMoneyMovement} la lee para
     * enrutar la ejecucion a {@code NEEDS_RECONCILIATION}. Cerrarla aqui la disfrazaria de tarea
     * terminada y borraria el rastro de lo unico que no se puede reejecutar a ciegas. Esas se quedan
     * como estan y las resuelve una persona.</p>
     */
    public int abortOrphanedTasks(Long processExecutionId, java.time.LocalDateTime now) {
        if (processExecutionId == null) {
            return 0;
        }
        return update("status = ?1, finishedAt = ?2, details = ?3 "
                        + "where processExecution.id = ?4 and status = ?5 and movesMoney = false",
                com.integrationhub.platform.spi.execution.ExecutionStatus.ABORTED, now,
                "Aborted: the node running this task lost its lease; the execution was recovered",
                processExecutionId,
                com.integrationhub.platform.spi.execution.ExecutionStatus.RUNNING);
    }
}
