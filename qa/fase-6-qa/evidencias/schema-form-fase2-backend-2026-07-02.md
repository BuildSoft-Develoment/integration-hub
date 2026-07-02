# Evidencia: config dirigida por schema — Fase 2 (contrato backend) - 2026-07-02

Continúa [schema-form-fase1](schema-form-fase1-2026-07-02.md) (renderer frontend). Esta fase
añade la **mitad backend**: que un tipo declare su schema de config y la UI lo pueda obtener.

## Qué se hizo (backend, Quarkus/Java)

- **Modelo de schema** en `spi.task` (espeja el contrato frontend `SchemaFieldDescriptor`):
  `PluginConfigField` (key, type, labelKey, required, options, min/max, pattern, `default`…),
  `PluginConfigOption`, `PluginConfigSchema`. JSON limpio (`@JsonInclude(NON_NULL)`), `default`
  vía `@JsonProperty` para no chocar con la palabra reservada.
- **SPI opt-in**: `TaskProvider.configSchema()` con **default vacío** → los providers existentes
  no cambian (no rompe nada); declarar schema es opcional.
- **Ejemplo real**: `NotificationTaskProvider.configSchema()` declara sus campos reales
  (`channel` select log/webhook/email, `message`, `url`, `bodyTemplate`).
- **Endpoint**: `GET /api/plugins/config-schema/{type}` (`PluginConfigSchemaResource`, gated
  `INTEGRATION_ADMIN`/`PLATFORM_ADMIN`/`OPERATOR`) resuelve el schema vía `TaskProviderRegistry`.
  Devuelve `{ fields: [] }` (200) si el tipo no existe o no declara schema → la UI simplemente
  no muestra formulario dinámico.
- Claves i18n de las etiquetas (`tasks.notification.*`) en en/es (con paridad).

## Pruebas

- **Backend (`mvn test -Dtest=NotificationTaskProviderConfigSchemaTest`)**: **Tests run: 2,
  Failures: 0, BUILD SUCCESS**. Verifica que el tipo expone su schema (campos + opciones del
  select `channel`) y que un provider sin override devuelve schema **vacío** (opt-in). El módulo
  compila entero (records + SPI + resource).
- **Frontend (`nx test web`)**: **406/406**, incluida la paridad de diccionarios tras añadir las
  4 claves `tasks.notification.*`.

## Estado del desbloqueo

- Fase 1 (renderer `ih-schema-form`) ✅ · Fase 2 (contrato + endpoint backend) ✅.
- **Falta Fase 3 (wiring)**: los editores (connection/source/reader/task) consultan
  `GET /api/plugins/config-schema/{type}` y renderizan con `ih-schema-form` por defecto, con
  registro `tipo → form custom` para overrides (JDBC/Mongo). Ahí se cierra el flujo completo:
  un plugin backend-only, configurable en la UI sin remote frontend.
- Follow-up: extender el schema también a `SourceProvider`/`ReaderProvider` y que el
  **descriptor remoto** (marketplace) transporte el schema de plugins out-of-process.
