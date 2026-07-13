-- Propaga el config-schema por providedType a la tabla de versiones del plugin, para que
-- activar/rollback de una version conserve el schema declarado (paridad con plugin_descriptor,
-- ver V77). Habilita el formulario auto-generado (ih-schema-form) tambien tras un activateVersion.
-- Columna opcional (nullable).
ALTER TABLE plugin_descriptor_version ADD COLUMN config_schemas_json text;
