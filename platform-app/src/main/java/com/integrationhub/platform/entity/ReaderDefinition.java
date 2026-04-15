package com.integrationhub.platform.entity;

import com.integrationhub.platform.domain.ReaderType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "reader_definition")
public class ReaderDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true, length = 120)
    public String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "reader_type", nullable = false, length = 40)
    public ReaderType readerType;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "configuration_json", nullable = false, columnDefinition = "text")
    public String configurationJson;
}


