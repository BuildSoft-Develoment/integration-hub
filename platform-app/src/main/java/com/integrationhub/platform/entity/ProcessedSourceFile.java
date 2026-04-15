package com.integrationhub.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "processed_source_file")
public class ProcessedSourceFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @JsonIgnore
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "process_execution_id", nullable = false)
    public ProcessExecution processExecution;

    @JsonIgnore
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "task_definition_id", nullable = false)
    public ProcessTaskDefinition taskDefinition;

    @Column(name = "file_name", nullable = false, length = 255)
    public String fileName;

    @Column(name = "file_path", columnDefinition = "text")
    public String filePath;

    @Column(name = "media_type", length = 120)
    public String mediaType;

    @Column(name = "file_size")
    public Long fileSize;

    @Column(name = "last_modified")
    public Instant lastModified;

    @Column(nullable = false, length = 30)
    public String status;

    @Column(name = "record_count", nullable = false)
    public Integer recordCount = 0;

    @Column(name = "skipped_count", nullable = false)
    public Integer skippedCount = 0;

    @Column(name = "written_count", nullable = false)
    public Integer writtenCount = 0;

    @Column(name = "error_message", columnDefinition = "text")
    public String errorMessage;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;
}
