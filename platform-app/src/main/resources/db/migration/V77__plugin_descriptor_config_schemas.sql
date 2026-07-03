-- Config-schema por providedType de un plugin backend out-of-process (marketplace).
-- Permite que un plugin externo declare la config de sus tipos y la UI la renderice con
-- ih-schema-form (sin formulario frontend hardcoded). Columna opcional (nullable).
ALTER TABLE plugin_descriptor ADD COLUMN config_schemas_json text;
