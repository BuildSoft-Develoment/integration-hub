package com.integrationhub.platform.repository;

import com.integrationhub.platform.spi.execution.ExecutionStatus;
import com.integrationhub.platform.entity.ProcessExecution;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;
import java.util.List;

@ApplicationScoped
public class ProcessExecutionRepository implements PanacheRepository<ProcessExecution> {

    public long countByTriggerSource(String triggerSource) {
        return count("triggerSource", triggerSource);
    }

    public ProcessExecution findRequired(Long id) {
        var execution = findById(id);
        if (execution == null) {
            throw new IllegalArgumentException("Execution not found: " + id);
        }
        return execution;
    }

    public PanacheQuery<ProcessExecution> findExecutions(String query, Map<String, Object> parameters) {
        return find(query, parameters);
    }

    public PanacheQuery<ProcessExecution> findRecent(int page, int size) {
        var query = find("from ProcessExecution e order by e.id desc");
        query.page(page, size);
        return query;
    }

    public PanacheQuery<ProcessExecution> findRecentFailed(int page, int size) {
        var query = find("from ProcessExecution e where e.status in ?1 order by e.id desc", java.util.List.of(ExecutionStatus.FAILED, ExecutionStatus.COMPLETED_WITH_ERRORS));
        query.page(page, size);
        return query;
    }

    public PanacheQuery<ProcessExecution> findChildrenBySourceExecutionId(Long sourceExecutionId) {
        return find("from ProcessExecution e where e.sourceExecutionId = ?1 order by e.id desc", sourceExecutionId);
    }

    public long countPendingExecutions() {
        return count("status", ExecutionStatus.PENDING);
    }

    public List<ProcessExecution> listPendingExecutions(int limit) {
        var query = find("from ProcessExecution e where e.status = ?1 order by e.id asc", ExecutionStatus.PENDING);
        query.page(0, Math.max(limit, 1));
        return query.list();
    }

    /**
     * v53-fix (#8): claim ATOMICO distribuido PENDING -> RUNNING. Devuelve 1 si ESTE nodo gano (el UPDATE afecto la
     * fila), 0 si otro nodo la tomo antes. Fija owner/token y el lease/heartbeat iniciales; incrementa el intento.
     */
    public int claimForRunning(Long id, String owner, String token,
                               java.time.LocalDateTime leaseUntil, java.time.LocalDateTime now) {
        return update("status = ?1, executionOwner = ?2, executionToken = ?3, executionLeaseUntil = ?4, "
                        + "executionHeartbeatAt = ?5, executionAttempt = executionAttempt + 1, "
                        + "startedAt = coalesce(startedAt, ?5) where id = ?6 and status = ?7",
                ExecutionStatus.RUNNING, owner, token, leaseUntil, now, id, ExecutionStatus.PENDING);
    }

    /**
     * P2 (fencing): transición TERMINAL del proceso (COMPLETED/FAILED/COMPLETED_WITH_ERRORS) guardada por
     * {@code executionToken} + {@code status='RUNNING'}. Devuelve 1 si ESTE worker sigue siendo el dueño RUNNING;
     * 0 si perdió el token (lease vencido y recuperado por otro nodo) → el caller aborta sin sobrescribir estado ajeno.
     */
    public int transitionRunningProcess(Long id, String token, ExecutionStatus toStatus, String details,
                                        java.time.LocalDateTime now) {
        return update("status = ?1, finishedAt = ?2, details = ?3 "
                        + "where id = ?4 and executionToken = ?5 and status = ?6",
                toStatus, now, details, id, token, ExecutionStatus.RUNNING);
    }

    /**
     * P2 (fencing): confirma atómicamente que ESTE worker sigue siendo el dueño RUNNING (token coincide) antes de una
     * mutación no-terminal (start/complete/fail de una tarea, suspensión). Refresca el heartbeat de paso. Devuelve 1
     * si sigue siendo dueño; 0 si perdió el token → el caller aborta.
     */
    public int touchRunningOwner(Long id, String token, java.time.LocalDateTime now) {
        return update("executionHeartbeatAt = ?1 where id = ?2 and executionToken = ?3 and status = ?4",
                now, id, token, ExecutionStatus.RUNNING);
    }

    /** v53-fix: renueva el lease/heartbeat SOLO si este nodo sigue siendo el dueño (token) y sigue RUNNING. */
    public int renewLease(Long id, String token, java.time.LocalDateTime leaseUntil, java.time.LocalDateTime now) {
        return update("executionLeaseUntil = ?1, executionHeartbeatAt = ?2 "
                        + "where id = ?3 and executionToken = ?4 and status = ?5",
                leaseUntil, now, id, token, ExecutionStatus.RUNNING);
    }

    /** v53-fix: ejecuciones RUNNING con lease vencido (nodo caido) = huerfanas candidatas a recuperacion. */
    public List<Long> listExpiredRunningIds(java.time.LocalDateTime now, int limit) {
        var query = find("from ProcessExecution e where e.status = ?1 and e.executionLeaseUntil is not null "
                + "and e.executionLeaseUntil < ?2 order by e.id asc", ExecutionStatus.RUNNING, now);
        query.page(0, Math.max(limit, 1));
        return query.list().stream().map(execution -> execution.id).toList();
    }

    /** v53-fix: ¿la ejecucion ya inicio (o corrio) una tarea de {@code taskType} (p.ej. MT101_PAY)? */
    public boolean hasStartedTaskType(Long executionId, String taskType) {
        var count = getEntityManager().createQuery(
                        "select count(t) from ProcessTaskExecution t "
                                + "where t.processExecution.id = ?1 and t.taskDefinition.taskType = ?2", Long.class)
                .setParameter(1, executionId)
                .setParameter(2, taskType)
                .getSingleResult();
        return count != null && count > 0;
    }

    /**
     * v53-fix: recupera ATOMICAMENTE una ejecucion RUNNING huerfana (lease vencido) hacia {@code toStatus}
     * ({@code PENDING} para re-encolar, o {@code NEEDS_RECONCILIATION} si ya inicio PAY). Limpia owner/token/lease.
     * Devuelve 1 si la gano (evita doble recuperacion entre nodos).
     */
    public int recoverExpiredRunning(Long id, ExecutionStatus toStatus, String details,
                                     java.time.LocalDateTime now) {
        return update("status = ?1, details = ?2, executionOwner = null, executionToken = null, "
                        + "executionLeaseUntil = null "
                        + "where id = ?3 and status = ?4 and executionLeaseUntil is not null and executionLeaseUntil < ?5",
                toStatus, details, id, ExecutionStatus.RUNNING, now);
    }

    /**
     * v54-fix: cierra ATOMICAMENTE una ejecucion desde {@code NEEDS_RECONCILIATION} hacia {@code toStatus}
     * ({@code COMPLETED} o {@code COMPLETED_WITH_ERRORS}). El {@code WHERE status='NEEDS_RECONCILIATION'} evita cerrar
     * dos veces o desde otro estado. Devuelve 1 si cerro, 0 si no estaba en NEEDS_RECONCILIATION.
     */
    public int closeFromNeedsReconciliation(Long id, ExecutionStatus toStatus, String details,
                                            java.time.LocalDateTime now) {
        return update("status = ?1, details = ?2, finishedAt = ?3 where id = ?4 and status = ?5",
                toStatus, details, now, id, ExecutionStatus.NEEDS_RECONCILIATION);
    }
}
