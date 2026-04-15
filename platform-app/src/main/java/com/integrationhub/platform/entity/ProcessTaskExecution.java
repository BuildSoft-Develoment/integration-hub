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
}



