CREATE TABLE IF NOT EXISTS system_theme_setting (
    id BIGINT PRIMARY KEY,
    scheme VARCHAR(20) NOT NULL,
    preset VARCHAR(20) NOT NULL,
    density VARCHAR(20) NOT NULL,
    primary_color VARCHAR(20) NOT NULL,
    error_color VARCHAR(20) NOT NULL,
    neutral_color VARCHAR(20) NOT NULL
);

INSERT INTO system_theme_setting (id, scheme, preset, density, primary_color, error_color, neutral_color)
SELECT 1, 'light', 'horizon', 'comfortable', '#0F766E', '#E5484D', '#8B8D98'
WHERE NOT EXISTS (
    SELECT 1 FROM system_theme_setting WHERE id = 1
);
