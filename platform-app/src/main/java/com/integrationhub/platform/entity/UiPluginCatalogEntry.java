package com.integrationhub.platform.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * A persisted external frontend plugin manifest, managed at runtime from the admin
 * console and served to the shell's boot-time catalog loader.
 */
@Entity
@Table(name = "ui_plugin_catalog_entry")
public class UiPluginCatalogEntry extends PanacheEntityBase {

    @Id
    @Column(name = "plugin_id", nullable = false, length = 120)
    public String pluginId;

    @Column(name = "manifest_json", nullable = false)
    public String manifestJson;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;
}
