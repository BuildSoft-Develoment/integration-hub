CREATE TABLE IF NOT EXISTS plugin_invocation_metric (
    id BIGSERIAL PRIMARY KEY,
    plugin_id VARCHAR(120) NOT NULL,
    version VARCHAR(40) NOT NULL,
    task_type VARCHAR(120),
    transport VARCHAR(20),
    success BOOLEAN NOT NULL,
    outcome VARCHAR(40) NOT NULL,
    duration_ms BIGINT NOT NULL DEFAULT 0,
    error_message VARCHAR(1000),
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_plugin_invocation_metric_plugin_version_time
    ON plugin_invocation_metric (plugin_id, version, recorded_at DESC);
