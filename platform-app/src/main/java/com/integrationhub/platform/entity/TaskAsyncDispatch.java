package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Tracker de agregación <b>scatter-gather N→1</b> de una tarea async por-slice (ADR-015, Opción B).
 * Cuando una tarea {@code batch}/{@code per-record} async se despacha, se parte en N slices (N
 * work-items al broker) y se abre <b>una</b> fila aquí con {@code total_slices=N}. Cada slice que el
 * consumer completa incrementa {@code completed_slices} de forma atómica; la tarea suspendida se
 * reanuda <b>una sola vez</b>, cuando la última slice cierra el conteo (completed == total).
 *
 * <p>Único por {@code (process_execution_id, task_definition_id)}: hay a lo sumo un scatter activo por
 * tarea de una ejecución.</p>
 */
@Entity
@Table(name = "task_async_dispatch")
public class TaskAsyncDispatch {

    /** Slices despachadas, aún agregando. */
    public static final String PENDING = "PENDING";
    /** Todas las slices completaron: la tarea puede reanudarse. */
    public static final String COMPLETED = "COMPLETED";
    /** Al menos una slice murió sin recuperación: el scatter no puede cerrar. */
    public static final String FAILED = "FAILED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "process_execution_id", nullable = false)
    public Long processExecutionId;

    @Column(name = "task_definition_id", nullable = false)
    public Long taskDefinitionId;

    /** Total de slices. {@code null} = aún despachando (streaming/page-chain, "unsealed"). */
    @Column(name = "total_slices")
    public Integer totalSlices;

    @Column(name = "completed_slices", nullable = false)
    public int completedSlices = 0;

    @Column(name = "failed_slices", nullable = false)
    public int failedSlices = 0;

    @Column(nullable = false, length = 16)
    public String status = PENDING;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "completed_at")
    public LocalDateTime completedAt;
}
