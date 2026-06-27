# Evidencia frontend plugin actions - 2026-06-27

## Alcance

- Continuacion de la arquitectura frontend modular extensible.
- Nueva superficie SPI: `AppActionContribution`.
- Validacion metadata-only para acciones externas en catalogos de plugin.
- Documentacion alineada en arquitectura, ADR, guia de catalogo y riesgos.

## Cambios verificados

- Se agrego `AppActionContribution` al contrato de manifests frontend.
- Se agregaron `AppActionKind` y `AppActionPlacement` para clasificar acciones.
- Se agrego `APP_ACTION_CONTRIBUTIONS` y
  `provideAppActionContributions(...)`.
- Se agrego `normalizeActionContributions(...)` con validacion de:
  `id`, `labelKey`, duplicados y campo obligatorio segun tipo de accion.
- `buildAppPluginRegistry(...)` ahora incluye `actions` en el snapshot.
- `AppPluginRuntimeRegistry` expone `actions()` y valida que acciones externas
  de navegacion apunten a rutas instaladas del shell.
- Las acciones externas `external-link`, incluso cuando el tipo se infiere por
  presencia de `href`, quedan restringidas a `https://`.
- Se agrego `APP_ACTION_COMMAND_HANDLERS` y
  `provideAppActionCommandHandlers(...)` para resolver comandos desde providers
  estaticos.
- Se agrego `AppActionExecutor` para ejecutar acciones de manera centralizada:
  navegacion por Router, enlaces externos HTTPS y comandos con handler local.
- El executor rechaza comandos sin handler, handlers duplicados y comandos que
  `canExecute` bloquea para el contexto actual.
- Se agrego `AppActionQueryService` para consultar acciones por `placement`,
  `group`, `source`, `kind`, capability y ejecutabilidad.
- `AppActionQueryService` adapta acciones visibles a `ActionBarAction` para
  toolbars flotantes y otras superficies de UI.
- La feature `connections` fue migrada como primer consumo real:
  `platform-plugin.manifest.ts` declara acciones bulk, `connection-catalog-page`
  consulta/ejecuta por SPI y `connection-bulk-action.handlers.ts` registra
  handlers locales para activar/desactivar seleccionados.
- El catalogo publico `catalog.schema.json` incluye acciones, tipos,
  ubicaciones y confirmaciones declarativas.
- El gate `validate-plugin-catalog.js` valida acciones, duplicados, rutas
  conocidas, enlaces HTTPS y enums sincronizados con el schema.

## Documentacion actualizada

- `docs/fase-3-arquitectura/03.00-arquitectura.md`.
- `docs/fase-3-arquitectura/adr/ADR-012-frontend-modular-extensible-plugins.md`.
- `docs/fase-3-arquitectura/anexos/requisitos-no-funcionales-y-riesgos.md`.
- `docs/fase-5-construccion/modulos/frontend-plugin-catalog.md`.

## Validacion de catalogo y tooling

### Comando

```bash
cmd.exe /c npm run test:plugins
cmd.exe /c npx nx run web:test-plugins --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Target Nx ejecutado: `web:test-plugins`.
- Dependencia ejecutada: `web:validate-plugins`.
- Corrida final ejecutada sin cache con `--skip-nx-cache`.
- Catalogo validado:
  `frontend/apps/web/public/plugins/catalog.json`.
- Manifests externos instalados: 0.
- Tests Node: 21 passed, 0 failed.
- Casos nuevos cubiertos: acciones validas, duplicados de `action id`, rutas de
  acciones desconocidas, enlaces externos no HTTPS y enums de acciones
  sincronizados con el schema.

## Pruebas unitarias frontend

### Comando

```bash
cmd.exe /c npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 69 passed.
- Test files posteriores a la integracion en `connections`: 72 passed.
- Tests posteriores a la integracion en `connections`: 316 passed.
- Cobertura nueva: `app-action.registry.spec.ts`,
  `app-action.executor.spec.ts`, `app-action.query.spec.ts`,
  `connection-bulk-action.handlers.spec.ts`, `app-plugin.registry.spec.ts` y
  `app-plugin-runtime.registry.spec.ts`.

## Build productivo

### Comando

```bash
cmd.exe /c npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins` se ejecuto como dependencia de build.
- Initial total: `1.23 MB`.
- Estimated transfer initial: `245.45 kB`.
- Output: `frontend/dist`.

## Riesgo residual

- La SPI de acciones es declarativa. No ejecuta handlers remotos ni codigo de
  terceros desde JSON.
- La resolucion real de comandos debe implementarse en una facade publica del
  shell antes de conectar botones dinamicos a comportamiento operativo.
- La carga de codigo Angular externo sigue fuera de alcance y requiere ADR
  especifica de procedencia, firma, versionado y rollback.
