ALTER TABLE plugin_descriptor
    ADD COLUMN IF NOT EXISTS provided_source_types_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE plugin_descriptor
    ADD COLUMN IF NOT EXISTS provided_reader_types_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE plugin_descriptor
    ADD COLUMN IF NOT EXISTS marketplace_url VARCHAR(500);

ALTER TABLE plugin_descriptor
    ADD COLUMN IF NOT EXISTS channel VARCHAR(80);

ALTER TABLE plugin_descriptor
    ADD COLUMN IF NOT EXISTS pinned_version VARCHAR(40);

ALTER TABLE plugin_descriptor
    ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS ix_plugin_descriptor_pinning
    ON plugin_descriptor (id, pinned_version, pinned);
