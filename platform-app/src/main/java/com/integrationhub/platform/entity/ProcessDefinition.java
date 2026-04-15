package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "process_definition")
public class ProcessDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true, length = 120)
    public String name;

    @Column(length = 255)
    public String description;

    @Column(nullable = false)
    public boolean active = true;

    @Column(nullable = false)
    public boolean scheduled = false;

    @Column(name = "schedule_every", length = 40)
    public String scheduleEvery;

    @Column(name = "next_run_at")
    public LocalDateTime nextRunAt;

    @Column(name = "last_run_at")
    public LocalDateTime lastRunAt;

    @Column(name = "flow_layout_json", columnDefinition = "TEXT")
    public String flowLayoutJson;

    @OneToMany(mappedBy = "processDefinition")
    @OrderBy("taskOrder asc")
    public List<ProcessTaskDefinition> tasks = new ArrayList<>();
}


