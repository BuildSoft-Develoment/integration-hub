CREATE TABLE IF NOT EXISTS ui_plugin_catalog_entry (
    plugin_id VARCHAR(120) PRIMARY KEY,
    manifest_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
