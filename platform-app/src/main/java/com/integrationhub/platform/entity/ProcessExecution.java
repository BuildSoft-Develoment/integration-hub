package com.integrationhub.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "process_execution")
public class ProcessExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @JsonIgnore
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "process_definition_id", nullable = false)
    public ProcessDefinition processDefinition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    public ExecutionStatus status = ExecutionStatus.PENDING;

    @Column(name = "started_at")
    public LocalDateTime startedAt;

    @Column(name = "finished_at")
    public LocalDateTime finishedAt;

    @Column(name = "source_execution_id")
    public Long sourceExecutionId;

    @Column(name = "trigger_source", length = 40)
    public String triggerSource;

    @Column(columnDefinition = "text")
    public String details;
}

