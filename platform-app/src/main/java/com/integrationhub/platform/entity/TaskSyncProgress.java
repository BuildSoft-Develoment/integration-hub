package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Progreso en vivo de una tarea SÍNCRONA (batch) por ejecución. Tabla dedicada, upserteada out-of-band
 * por el loop batch (ver {@code TaskSyncProgressRepository}). Clave compuesta {@code (peId, tdId)}.
 */
@Entity
@Table(name = "task_sync_progress")
@IdClass(TaskSyncProgress.Key.class)
public class TaskSyncProgress {

    @Id
    @Column(name = "process_execution_id")
    public Long processExecutionId;

    @Id
    @Column(name = "task_definition_id")
    public Long taskDefinitionId;

    @Column(name = "records_processed", nullable = false)
    public long recordsProcessed;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt = LocalDateTime.now();

    public static class Key implements Serializable {
        public Long processExecutionId;
        public Long taskDefinitionId;

        public Key() {
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof Key key)) {
                return false;
            }
            return Objects.equals(processExecutionId, key.processExecutionId)
                    && Objects.equals(taskDefinitionId, key.taskDefinitionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(processExecutionId, taskDefinitionId);
        }
    }
}
