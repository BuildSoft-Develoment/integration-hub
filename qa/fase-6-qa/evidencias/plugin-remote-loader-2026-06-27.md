# Evidencia loader de remotes con limite de error (ADR-013) - 2026-06-27

Cuarto incremento de [ADR-013](../../fase-3-arquitectura/adr/ADR-013-frontend-module-federation-remote-plugins.md):
la orquestacion de carga de codigo remoto con verificacion criptografica y limite
de error. Mantiene `shared/ui` agnostica del bundler: la funcion real de carga
(Native Federation `loadRemoteModule`) se inyecta desde el host.

## Alcance

- `AppPluginRemoteLoader`: verifica (cripto) y monta el modulo remoto.
- Limite de error: cualquier fallo marca el plugin `degraded` y nunca lanza.
- Estado `degraded` en el runtime registry y en `diagnostics`/vista `/plugins`.
- Seam `REMOTE_MODULE_LOADER` inyectable para la funcion real del bundler.

## Cambios verificados

- `AppPluginRuntimeRegistry`:
  - Senal `degraded` + `markDegraded(id, reason)` (reemplaza el motivo previo).
  - `PluginDiagnostics.degraded` y su inclusion en el `diagnostics` computed.
- Nuevo `AppPluginRemoteLoader` (`app-plugin-remote.loader.ts`):
  - `REMOTE_MODULE_LOADER` + `provideAppPluginRemoteModuleLoader(...)`.
  - `load(manifest)`: sin remote devuelve null; verifica con
    `AppPluginRemoteVerifier`; monta via el loader inyectado; ante fallo de
    verificacion/carga marca `degraded` y devuelve null.
- Vista `/plugins`: nueva seccion de degradados; claves i18n `plugins.degraded` y
  `plugins.empty.degraded` en en/es.
- Exportado desde el barrel de `shared/ui`.

## Casos de prueba

`app-plugin-remote.loader.spec.ts` (verificador y loader stubeados, registry real):
- Sin `remote` devuelve null y no degrada.
- Verifica y monta el modulo en exito.
- Verificacion fallida: degrada con el motivo y NO llama al loader.
- El loader lanza: degrada con `load failed: ...`.
- Sin loader configurado: degrada con `no remote module loader`.

`app-plugin-runtime.registry.spec.ts`:
- `markDegraded` aparece en `diagnostics().degraded` y reemplaza motivos previos.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 78 passed.
- Tests: 355 passed, 0 failed (6 casos nuevos: loader x5, degraded x1).

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins`: "Plugin catalog validation passed".
- Initial total: `1.24 MB`. Estimated transfer initial: `247.70 kB`.

## Wiring pendiente en el host (deploy)

Toda la gobernanza (contrato, procedencia, cripto, loader, limite de error,
diagnostico) esta lista. Falta la configuracion de build, que se hace en el host
para no atar `shared/ui` al bundler:

1. `npm i -D @angular-architects/native-federation` y `ng add` / configurar el
   builder esbuild con `withNativeFederation` y `shareAll` (Angular, router, RxJS,
   `shared/ui`).
2. En `apps/web` proveer:
   `provideAppPluginRemoteModuleLoader((req) => loadRemoteModule(req.remoteEntry, req.exposedModule))`,
   `provideAppPluginRemoteOrigins([...])`, `provideAppPluginRemoteTrustedKeys([...])`,
   `provideAppPluginRemoteKeys({ keyId: jwk })`.
3. Construir un plugin remoto de ejemplo que exponga un componente standalone y
   una prueba e2e (descarga, verificacion, montaje, degradacion ante fallo).

## Riesgo residual

- La reconfiguracion del builder a Native Federation cambia el build del host y se
  deja como paso de deploy dedicado para no arriesgar la build estable actual.
- La rotacion/distribucion de claves (`APP_PLUGIN_REMOTE_KEYS`) es tarea operativa.
