package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "source_definition")
public class SourceDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true, length = 120)
    public String name;

    @Column(name = "source_type", nullable = false, length = 40)
    public String sourceType;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "configuration_json", nullable = false, columnDefinition = "text")
    public String configurationJson;
}


