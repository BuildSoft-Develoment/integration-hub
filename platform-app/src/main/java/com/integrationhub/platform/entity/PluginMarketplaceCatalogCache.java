package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "plugin_marketplace_catalog_cache")
public class PluginMarketplaceCatalogCache {

    @Id
    @Column(name = "catalog_url", length = 500)
    public String catalogUrl;

    @Column(nullable = false, columnDefinition = "text")
    public String bodyJson;

    @Column(nullable = false, length = 120)
    public String integrity;

    @Column(nullable = false, length = 500)
    public String signature;

    @Column(nullable = false, length = 20)
    public String status = "VERIFIED";

    @Column(length = 1000)
    public String error;

    @Column(name = "fetched_at", nullable = false)
    public LocalDateTime fetchedAt = LocalDateTime.now();

    @Column(name = "expires_at", nullable = false)
    public LocalDateTime expiresAt;

    @Column(name = "last_used_at")
    public LocalDateTime lastUsedAt;
}
