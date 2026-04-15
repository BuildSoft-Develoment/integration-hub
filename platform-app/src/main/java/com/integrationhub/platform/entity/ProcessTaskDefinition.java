package com.integrationhub.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.integrationhub.platform.domain.TaskType;
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

@Entity
@Table(name = "process_task_definition")
public class ProcessTaskDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @JsonIgnore
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "process_definition_id", nullable = false)
    public ProcessDefinition processDefinition;

    @Column(name = "task_order", nullable = false)
    public Integer taskOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 50)
    public TaskType taskType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_definition_id")
    public SourceDefinition sourceDefinition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reader_definition_id")
    public ReaderDefinition readerDefinition;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "configuration_json", nullable = false, columnDefinition = "text")
    public String configurationJson;
}

