-- White-label del shell: nombre de marca, marca corta (p.ej. "IH") y logo opcional embebido
-- como data-URI base64 (registro en preferencias, sin storage de assets aparte). Editable en
-- runtime desde el panel de preferencias. brand_name/brand_mark con default; logo nullable.
ALTER TABLE system_theme_setting ADD COLUMN brand_name varchar(120) NOT NULL DEFAULT 'Integration Hub';
ALTER TABLE system_theme_setting ADD COLUMN brand_mark varchar(8) NOT NULL DEFAULT 'IH';
ALTER TABLE system_theme_setting ADD COLUMN logo_data_uri text;
