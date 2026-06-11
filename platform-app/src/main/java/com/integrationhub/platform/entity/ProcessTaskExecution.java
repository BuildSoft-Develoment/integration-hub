package com.integrationhub.platform.entity;

import com.integrationhub.platform.domain.ExecutionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "process_task_execution")
public class ProcessTaskExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "process_execution_id", nullable = false)
    public ProcessExecution processExecution;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "task_definition_id", nullable = false)
    public ProcessTaskDefinition taskDefinition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    public ExecutionStatus status = ExecutionStatus.PENDING;

    @Column(name = "executed_at")
    public LocalDateTime executedAt;

    @Column(name = "started_at")
    public LocalDateTime startedAt;

    @Column(name = "finished_at")
    public LocalDateTime finishedAt;

    @Column(columnDefinition = "text")
    public String details;

    // --- M-2 suspension fields (V13) ---
    //
    // suspendedState: JSON serializado del estado que el provider necesita para
    // reanudar (e.g. {nextPollAt, attemptNumber, externalRef}). El engine lo
    // rehidrata como Map<String,Object> al invocar SuspendableTaskProvider.resume.
    @Column(name = "suspended_state", columnDefinition = "text")
    public String suspendedState;

    // resumeToken: opaco generado por SecureRandom; identificador estable que
    // el callback externo presenta en POST /api/process-executions/resume/{token}.
    @Column(name = "resume_token", length = 64, unique = true)
    public String resumeToken;

    @Column(name = "suspended_at")
    public LocalDateTime suspendedAt;

    // suspendExpiresAt: NULL => sin expiracion (callback puro). Si esta seteado,
    // un scheduler puede invocar resume automaticamente cuando llegue el momento.
    @Column(name = "suspend_expires_at")
    public LocalDateTime suspendExpiresAt;

    @Column(name = "resumed_at")
    public LocalDateTime resumedAt;

    // resumeCount: cuantas veces se reanudo (un provider puede re-suspenderse).
    // Util para metricas y para topes de retry.
    @Column(name = "resume_count", nullable = false)
    public int resumeCount = 0;
}



