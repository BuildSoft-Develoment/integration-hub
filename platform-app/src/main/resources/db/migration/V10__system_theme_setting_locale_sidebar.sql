ALTER TABLE system_theme_setting
ADD COLUMN IF NOT EXISTS locale VARCHAR(10);

ALTER TABLE system_theme_setting
ADD COLUMN IF NOT EXISTS sidebar_mode VARCHAR(20);

UPDATE system_theme_setting
SET locale = COALESCE(NULLIF(locale, ''), 'es'),
    sidebar_mode = COALESCE(NULLIF(sidebar_mode, ''), 'expanded');

ALTER TABLE system_theme_setting
ALTER COLUMN locale SET NOT NULL;

ALTER TABLE system_theme_setting
ALTER COLUMN sidebar_mode SET NOT NULL;
