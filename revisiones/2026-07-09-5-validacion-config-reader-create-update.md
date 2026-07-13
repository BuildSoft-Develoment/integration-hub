# #5 — validación temprana de la configuración de reader (create/update, sin diferir a runtime)

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis app_htoh(63) #5 ("un CSV sin campos se acepta y revienta recién al ejecutar"), re-validado contra el código real.

## Qué reveló la validación contra el código

- El check de campos del CSV existía **solo en runtime**: `CsvReaderProvider.readInBatches` lanzaba
  `IllegalArgumentException("CSV requires field definitions")` cuando ya se leía el archivo (dentro de una ejecución).
- `ReaderCatalogService.create/update` **solo** validaba que `readerType` no fuera vacío. Aceptaba:
  1. un CSV **sin `fields`** → la definición quedaba guardada y fallaba recién al ejecutar el proceso;
  2. un `readerType` **inexistente** (sin provider) → mismo diferimiento.
- El `ApiExceptionMapper` global mapea `IllegalArgumentException` → **500**, no 400. El patrón establecido (G2 en
  `ProcessDefinitionResource`) es que el **resource** capture `IllegalArgumentException` y relance `BadRequestException`.

## Cambio (SPI + wiring, sin camino paralelo)

- **SPI** `ReaderProvider.validateConfiguration(Map<String,Object>)`: **default no-op** (opt-in; los readers que no
  validan no se afectan). Cada provider valida **solo lo suyo** (SRP). Debe lanzar `IllegalArgumentException` con un
  mensaje accionable si la config es inválida.
- **`CsvReaderProvider`**: override que reusa **exactamente** la misma comprobación que `readInBatches`
  (`requireFields` = una sola fuente de verdad, sin duplicar la regla) → un CSV sin campos falla en create/update.
- **`ReaderCatalogService.apply`**: tras fijar el `readerType`, resuelve el provider por tipo
  (`ReaderProviderRegistry.resolve` → **falla-fast en tipos no soportados**, sin fallback) y llama
  `validateConfiguration` con la config parseada **sin resolver secretos** (`toMapUnresolved`: aquí solo importa la
  estructura, p.ej. `fields`, no los valores de secreto ni si el vault los tiene ahora).
- **`ReaderDefinitionResource.create/update`**: `try/catch (IllegalArgumentException) → BadRequestException` (400),
  mismo patrón que G2. Config inválida o tipo no soportado → **400 claro en la consola**, no 500.

Sin código fallback: no se acepta una definición inválida "por si acaso". Falla temprano y explícito.

## Alcance / no-rotura

- Todas las creaciones de reader en tests/E2E usan `CSV` **con `fields`** (`CatalogAndExecutionResourceIT`,
  `SyncProgressExecuteByModeIT`, `Mt101AllTasksProcessE2EIT`, `Mt101MillionFileProcessE2EIT`) o `SWIFT_MT` (default
  no-op) → todas siguen resolviendo y validando en verde.
- La regla aplica **igual al ACTUALIZAR**: quitar los campos en un PUT devuelve 400 (no se degrada una definición ya
  válida).

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `CsvReaderProviderTest` (unit) | **8/8** | `validateConfiguration` sin campos → lanza `"CSV requires field definitions"`; con campos → no lanza |
| `ReaderDefinitionValidationIT` (@QuarkusTest+Postgres) | **(ver corrida)** | POST CSV sin campos → 400; POST tipo no soportado → 400; POST CSV válido → 200; PUT que quita campos → 400 |
