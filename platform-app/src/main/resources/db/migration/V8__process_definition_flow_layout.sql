ALTER TABLE process_definition
    ADD COLUMN IF NOT EXISTS flow_layout_json TEXT;
