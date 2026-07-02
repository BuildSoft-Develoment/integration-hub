CREATE TABLE IF NOT EXISTS plugin_descriptor (
    id VARCHAR(120) PRIMARY KEY,
    version VARCHAR(40) NOT NULL,
    spi_version VARCHAR(40) NOT NULL,
    provided_types_json TEXT NOT NULL,
    transport VARCHAR(20) NOT NULL,
    endpoint VARCHAR(500),
    trusted BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    integrity VARCHAR(120),
    signature VARCHAR(500),
    installed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT plugin_descriptor_provided_types_json_non_empty CHECK (length(trim(provided_types_json)) > 0)
);

CREATE INDEX IF NOT EXISTS ix_plugin_descriptor_active
    ON plugin_descriptor (active, id);
