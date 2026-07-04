package com.integrationhub.platform.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import com.integrationhub.platform.entity.TaskSyncProgress;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;

/**
 * Progreso en vivo de tareas SÍNCRONAS a escala (mejora UI/UX). Tabla dedicada {@code task_sync_progress}
 * upserteada <b>out-of-band</b> por el loop batch (throttled) en su propia transacción.
 *
 * <p><b>Por qué una tabla aparte y no una columna en {@code process_task_execution}</b>: el engine
 * actualiza el estado de la tarea vía <i>entity managed</i> y el flush de Hibernate en {@code completeTask}
 * reescribiría (clobber) una columna escrita out-of-band. Esta tabla no es una entity del engine, así que
 * el upsert sobrevive y es visible al poll de progreso durante la corrida.</p>
 */
@ApplicationScoped
public class TaskSyncProgressRepository implements PanacheRepositoryBase<TaskSyncProgress, Long> {

    @Transactional
    public void upsert(Long processExecutionId, Long taskDefinitionId, long processed) {
        // records_processed = GREATEST(...): el valor es un contador ACUMULATIVO absoluto y los upserts
        // pueden llegar fuera de orden bajo lotes/slices concurrentes (el reporter throttled emite valores
        // crecientes por CAS, pero el orden de APLICACIÓN en la DB no está garantizado). GREATEST garantiza
        // monotonía: el progreso visible al poll nunca retrocede. updated_at solo avanza cuando el valor sube.
        getEntityManager().createNativeQuery("""
                insert into task_sync_progress (process_execution_id, task_definition_id, records_processed, updated_at)
                values (?1, ?2, ?3, current_timestamp)
                on conflict (process_execution_id, task_definition_id)
                do update set records_processed = greatest(task_sync_progress.records_processed, ?3),
                              updated_at = case when ?3 > task_sync_progress.records_processed
                                                then current_timestamp else task_sync_progress.updated_at end
                """)
                .setParameter(1, processExecutionId)
                .setParameter(2, taskDefinitionId)
                .setParameter(3, Math.max(0, processed))
                .executeUpdate();
    }

    public List<TaskSyncProgress> findByExecution(Long processExecutionId) {
        return list("processExecutionId = ?1 order by taskDefinitionId", processExecutionId);
    }
}
