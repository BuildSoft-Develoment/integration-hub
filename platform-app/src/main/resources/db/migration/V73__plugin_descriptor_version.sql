CREATE TABLE IF NOT EXISTS plugin_descriptor_version (
    descriptor_key VARCHAR(180) PRIMARY KEY,
    plugin_id VARCHAR(120) NOT NULL,
    version VARCHAR(40) NOT NULL,
    spi_version VARCHAR(40) NOT NULL,
    provided_types_json TEXT NOT NULL,
    provided_source_types_json TEXT NOT NULL DEFAULT '[]',
    provided_reader_types_json TEXT NOT NULL DEFAULT '[]',
    transport VARCHAR(20) NOT NULL,
    endpoint VARCHAR(500),
    trusted BOOLEAN NOT NULL DEFAULT FALSE,
    integrity VARCHAR(120),
    signature VARCHAR(500),
    marketplace_url VARCHAR(500),
    channel VARCHAR(80),
    pinned_version VARCHAR(40),
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    installed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT plugin_descriptor_version_unique UNIQUE (plugin_id, version)
);

CREATE INDEX IF NOT EXISTS ix_plugin_descriptor_version_plugin
    ON plugin_descriptor_version (plugin_id, version);

INSERT INTO plugin_descriptor_version (
    descriptor_key,
    plugin_id,
    version,
    spi_version,
    provided_types_json,
    provided_source_types_json,
    provided_reader_types_json,
    transport,
    endpoint,
    trusted,
    integrity,
    signature,
    marketplace_url,
    channel,
    pinned_version,
    pinned,
    installed_at,
    updated_at
)
SELECT
    id || '@' || version,
    id,
    version,
    spi_version,
    provided_types_json,
    provided_source_types_json,
    provided_reader_types_json,
    transport,
    endpoint,
    trusted,
    integrity,
    signature,
    marketplace_url,
    channel,
    pinned_version,
    pinned,
    installed_at,
    updated_at
FROM plugin_descriptor
ON CONFLICT (descriptor_key) DO NOTHING;
