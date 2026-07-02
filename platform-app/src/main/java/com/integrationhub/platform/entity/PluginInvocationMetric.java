package com.integrationhub.platform.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "plugin_invocation_metric")
public class PluginInvocationMetric extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "plugin_id", nullable = false, length = 120)
    public String pluginId;

    @Column(name = "version", nullable = false, length = 40)
    public String version;

    @Column(name = "task_type", length = 120)
    public String taskType;

    @Column(name = "transport", length = 20)
    public String transport;

    @Column(name = "success", nullable = false)
    public boolean success;

    @Column(name = "outcome", nullable = false, length = 40)
    public String outcome;

    @Column(name = "duration_ms", nullable = false)
    public long durationMs;

    @Column(name = "error_message", length = 1000)
    public String errorMessage;

    @Column(name = "recorded_at", nullable = false)
    public LocalDateTime recordedAt;
}
