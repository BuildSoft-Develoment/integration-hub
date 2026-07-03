package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.TaskAsyncDispatch;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.Optional;

/**
 * Acceso a datos del tracker scatter-gather (ADR-015, Opción B). La operación clave es el
 * <b>incremento atómico</b> {@link #recordSliceCompleted}: un {@code UPDATE ... RETURNING} bajo lock
 * de fila garantiza que <b>exactamente un</b> consumer (el que lleva el conteo a {@code total}) vea
 * {@code batchCompleted=true} y dispare la reanudación de la tarea una sola vez. Una reentrega de una
 * slice ya contada no re-incrementa mal porque el {@code where status='PENDING'} deja de matchear al
 * cerrar (idempotencia de la agregación).
 */
@ApplicationScoped
public class TaskAsyncDispatchRepository implements PanacheRepository<TaskAsyncDispatch> {

    /** Abre el scatter (idempotente): registra que la tarea se despachó en {@code totalSlices} slices. */
    @Transactional
    public void open(Long processExecutionId, Long taskDefinitionId, int totalSlices) {
        getEntityManager().createNativeQuery("""
                insert into task_async_dispatch
                    (process_execution_id, task_definition_id, total_slices, created_at)
                values (?1, ?2, ?3, current_timestamp)
                on conflict (process_execution_id, task_definition_id) do nothing
                """)
                .setParameter(1, processExecutionId)
                .setParameter(2, taskDefinitionId)
                .setParameter(3, Math.max(totalSlices, 0))
                .executeUpdate();
    }

    /**
     * Incrementa atómicamente las slices completadas. Devuelve el progreso si había un scatter activo
     * (PENDING); vacío si no existe o ya cerró (COMPLETED/FAILED) — en cuyo caso el caller no debe
     * disparar la reanudación (dedup de la agregación).
     */
    @Transactional
    public Optional<SliceProgress> recordSliceCompleted(Long processExecutionId, Long taskDefinitionId) {
        // Terminal cuando TODAS las slices están contadas (completadas + fallidas == total). En
        // fail-fast, failed_slices queda en 0 (un fallo pone FAILED y corta), así equivale a
        // completed==total. En continueOnFailure, las fallidas cuentan para el cierre.
        var rows = getEntityManager().createNativeQuery("""
                update task_async_dispatch
                   set completed_slices = completed_slices + 1,
                       status = case when completed_slices + 1 + failed_slices >= total_slices then 'COMPLETED' else status end,
                       completed_at = case when completed_slices + 1 + failed_slices >= total_slices then current_timestamp else completed_at end
                 where process_execution_id = ?1 and task_definition_id = ?2 and status = 'PENDING'
                returning completed_slices, failed_slices, total_slices, status
                """)
                .setParameter(1, processExecutionId)
                .setParameter(2, taskDefinitionId)
                .getResultList();
        return mapProgress(rows, false);
    }

    /**
     * Marca una slice fallida. En <b>fail-fast</b> ({@code continueOnFailure=false}) el scatter pasa a
     * {@code FAILED} de inmediato (la tarea fallará). En <b>continueOnFailure</b> la fallida se cuenta y
     * el scatter cierra ({@code COMPLETED}) cuando todas las slices están contadas — la tarea completa
     * con errores. Devuelve el progreso si había un scatter activo.
     */
    @Transactional
    public Optional<SliceProgress> recordSliceFailed(Long processExecutionId, Long taskDefinitionId,
                                                     boolean continueOnFailure) {
        var sql = continueOnFailure
                ? """
                update task_async_dispatch
                   set failed_slices = failed_slices + 1,
                       status = case when completed_slices + failed_slices + 1 >= total_slices then 'COMPLETED' else status end,
                       completed_at = case when completed_slices + failed_slices + 1 >= total_slices then current_timestamp else completed_at end
                 where process_execution_id = ?1 and task_definition_id = ?2 and status = 'PENDING'
                returning completed_slices, failed_slices, total_slices, status
                """
                : """
                update task_async_dispatch
                   set failed_slices = failed_slices + 1, status = 'FAILED', completed_at = current_timestamp
                 where process_execution_id = ?1 and task_definition_id = ?2 and status = 'PENDING'
                returning completed_slices, failed_slices, total_slices, status
                """;
        var rows = getEntityManager().createNativeQuery(sql)
                .setParameter(1, processExecutionId)
                .setParameter(2, taskDefinitionId)
                .getResultList();
        // fail-fast: transicionar a FAILED es terminal (la tarea falla). continue: terminal solo al cerrar.
        return mapProgress(rows, !continueOnFailure);
    }

    private Optional<SliceProgress> mapProgress(java.util.List<?> rows, boolean terminalIfPresent) {
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        var row = (Object[]) rows.get(0);
        var completed = ((Number) row[0]).intValue();
        var failed = ((Number) row[1]).intValue();
        var total = ((Number) row[2]).intValue();
        var status = String.valueOf(row[3]);
        var terminal = terminalIfPresent
                || TaskAsyncDispatch.COMPLETED.equals(status)
                || TaskAsyncDispatch.FAILED.equals(status);
        return Optional.of(new SliceProgress(completed, failed, total, terminal));
    }

    public Optional<TaskAsyncDispatch> findByExecutionAndTask(Long processExecutionId, Long taskDefinitionId) {
        return find("processExecutionId = ?1 and taskDefinitionId = ?2", processExecutionId, taskDefinitionId)
                .firstResultOptional();
    }

    /**
     * Progreso de la agregación tras contar una slice. {@code terminal} = todas las slices contadas
     * (el que lo ve dispara la reanudación/fallo de la tarea una vez); {@code failed>0} en un cierre
     * terminal ⇒ completó con errores.
     */
    public record SliceProgress(int completed, int failed, int total, boolean terminal) {
    }
}
