CREATE TABLE IF NOT EXISTS plugin_marketplace_catalog_cache (
    catalog_url VARCHAR(500) PRIMARY KEY,
    body_json TEXT NOT NULL,
    integrity VARCHAR(120) NOT NULL,
    signature VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED',
    error VARCHAR(1000),
    fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_plugin_marketplace_catalog_cache_status
    ON plugin_marketplace_catalog_cache (status, expires_at);
