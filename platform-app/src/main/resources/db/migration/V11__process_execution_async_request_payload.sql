ALTER TABLE process_execution
    ADD COLUMN IF NOT EXISTS request_payload_json TEXT;
