package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Descriptor persistente de un plugin backend out-of-process (ADR-014).
 *
 * <p>El core no carga codigo del plugin: esta tabla solo declara identidad,
 * procedencia ya verificada por el flujo de instalacion y los tipos remotos que
 * el motor puede resolver via {@code RemotePluginInvoker}.</p>
 */
@Entity
@Table(name = "plugin_descriptor")
public class PluginDescriptor {

    @Id
    @Column(length = 120)
    public String id;

    @Column(nullable = false, length = 40)
    public String version;

    @Column(name = "spi_version", nullable = false, length = 40)
    public String spiVersion;

    @Column(name = "provided_types_json", nullable = false, columnDefinition = "text")
    public String providedTypesJson;

    @Column(nullable = false, length = 20)
    public String transport;

    @Column(length = 500)
    public String endpoint;

    @Column(nullable = false)
    public boolean trusted = false;

    @Column(nullable = false)
    public boolean active = false;

    @Column(length = 120)
    public String integrity;

    @Column(length = 500)
    public String signature;

    @Column(name = "installed_at", nullable = false)
    public LocalDateTime installedAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt = LocalDateTime.now();
}
