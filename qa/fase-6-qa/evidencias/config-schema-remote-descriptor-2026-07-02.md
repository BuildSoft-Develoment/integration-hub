# Evidencia: config-schema en el descriptor remoto de marketplace - 2026-07-02

Cierra el bucle de config dirigida por schema para **plugins backend out-of-process** (los
instalados desde el marketplace): un plugin externo declara la config de sus tipos y el endpoint
la sirve → la UI la renderiza con `ih-schema-form`, sin formulario frontend hardcoded.

## Qué se hizo (backend)

- **Migración `V77__plugin_descriptor_config_schemas.sql`**: columna `config_schemas_json` (text,
  nullable) en `plugin_descriptor`. Additiva, sin impacto en datos existentes.
- **`PluginDescriptor`** (entidad): campo `configSchemasJson` (opcional).
- **`RemotePluginDescriptor`**: nuevo componente `Map<String, PluginConfigSchema> configSchemas`
  (por `providedType`) + `configSchemaFor(type)`. Se añadió un constructor de **compat** con la
  firma previa (sin schemas → mapa vacío), así ningún llamador existente rompe.
- **`PluginDescriptorCatalogMapper`**: parsea `configSchemasJson` (`{ "<type>": { "fields": [...] }}`)
  con Jackson; un JSON inválido no tumba el catálogo (se ignora → vacío).
- **`RemoteTaskProvider.configSchema()`**: devuelve el schema del descriptor para su `type()`. El
  endpoint `GET /api/plugins/config-schema/{type}` (que resuelve vía `TaskProviderRegistry`) ya
  lo sirve para tipos de plugin remotos.

## Pruebas

- **Backend (`mvn test`)**: **5/5, BUILD SUCCESS** (nuevo `PluginDescriptorConfigSchemaMapperTest`
  + los de notification/csv). Cubre: el descriptor transporta el schema declarado por el plugin;
  un tipo sin schema → vacío; `RemoteTaskProvider.configSchema()` lo expone; JSON ausente/inválido
  → vacío. El módulo compila entero (migración + entidad + record + mapper + provider).

## Estado (item 3)

- ✅ Contrato config-schema para task/source/reader (SPI) — hecho antes.
- ✅ **Descriptor remoto transporta config-schemas** (este commit) → un plugin del marketplace es
  configurable en la UI sin código frontend. Es el desbloqueo completo para plugins externos.
- Follow-up: que el **catálogo firmado del marketplace** incluya los config-schemas en su JSON
  (hoy la columna existe; el install debería poblarla desde el catálogo del plugin); y wiring de
  los editores frontend de source/reader (el de tasks ya consume el endpoint).
