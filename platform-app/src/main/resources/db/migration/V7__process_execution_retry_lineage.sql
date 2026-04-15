ALTER TABLE process_execution
    ADD COLUMN IF NOT EXISTS source_execution_id BIGINT,
    ADD COLUMN IF NOT EXISTS trigger_source VARCHAR(40);

CREATE INDEX IF NOT EXISTS idx_process_execution_source_execution_id
    ON process_execution(source_execution_id);
