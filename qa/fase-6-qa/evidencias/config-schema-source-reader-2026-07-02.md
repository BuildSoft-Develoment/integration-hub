# Evidencia: config-schema extendido a Source/Reader - 2026-07-02

Extiende el contrato de config dirigida por schema (antes solo Task) a **Source** y **Reader**,
para que un plugin que aporte una fuente o un reader también sea configurable en la UI sin
formulario hardcoded.

## Qué se hizo (backend)

- **Paquete neutral `spi.config`**: se movieron `PluginConfigField`/`Option`/`Schema` desde
  `spi.task` (evita que `spi.source`/`spi.reader` dependan de `spi.task`). Imports actualizados
  en `TaskProvider`, `NotificationTaskProvider`, el resource y el test.
- **SPI opt-in**: `SourceProvider.configSchema()` y `ReaderProvider.configSchema()` con default
  vacío (no rompen implementaciones existentes).
- **Ejemplo real**: `CsvReaderProvider.configSchema()` (delimiter + encoding select
  UTF-8/ISO-8859-1/US-ASCII).
- **Endpoint** `GET /api/plugins/config-schema/{type}` ahora resuelve en **task → source →
  reader** (primer schema no vacío gana; vacío si ninguno lo declara).
- i18n `readers.csv.*` (en/es con paridad).

## Pruebas

- **Backend (`mvn test`)**: **3/3, BUILD SUCCESS** (`CsvReaderProviderConfigSchemaTest` +
  `NotificationTaskProviderConfigSchemaTest`). El package move compila todo el módulo (SPI +
  resource con 3 registries).
- **Frontend (`nx test web`)**: **411/411** (paridad de diccionarios tras las claves `readers.csv.*`).

## Alcance / follow-up

- Entregado: el **contrato + endpoint** para los tres dominios (task/source/reader). El wiring
  frontend del host de task-forms ya consume el endpoint (fase 3c); los **editores de
  source/reader** consumirían el mismo endpoint con el mismo patrón (follow-up).
- Follow-up mayor: que el **descriptor remoto** (marketplace, plugins out-of-process) transporte
  el schema, para tipos aportados por plugins backend fuera de proceso.
