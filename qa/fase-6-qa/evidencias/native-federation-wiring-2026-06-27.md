# Evidencia cableado de Native Federation en el host (ADR-013) - 2026-06-27

Implementa la reconfiguracion del builder a Native Federation y el wiring del host,
confirmando el diagnostico rectificado: el bloqueante del test runner era de
CONFIGURACION, no de dependencias, y se resuelve dando al unit-test un target
application-builder limpio.

## Alcance

- Builder del host conmutado a Native Federation (esbuild, dynamic host).
- Test runner reparado con un target de build limpio.
- Gate `validate-plugins` restaurado en el target `build`.
- `REMOTE_MODULE_LOADER` conectado con `loadRemoteModule` de Native Federation.

## Cambios verificados

- `npm i -D @angular-architects/native-federation@~21.2.0` y generador Nx
  `init --type=dynamic-host`: crea `federation.config.js` (shareAll singleton),
  `public/federation.manifest.json`, split `main.ts` -> `bootstrap.ts`, conmuta
  `build` a `@angular-architects/native-federation:build` y conserva el builder
  esbuild original como `esbuild`.
- `apps/web/project.json`:
  - `build` (federacion) con `dependsOn: ["validate-plugins"]` (gate restaurado).
  - Nuevo target `test-build` (`@angular/build:application`) con
    `browser: apps/web/src/bootstrap.ts` (entry limpio, sin `initFederation`) y
    SIN el polyfill `es-module-shims`.
  - `test.buildTarget` -> `web:test-build`.
- `apps/web/src/app/app.config.ts`:
  `provideAppPluginRemoteModuleLoader((req) => loadRemoteModule({ remoteEntry, exposedModule }))`.

## Confirmacion del diagnostico

Con `test.buildTarget = web:test-build` (entry limpio, sin `es-module-shims`) el
suite vuelve a verde. Confirma que el fallo `instrumentForCoverage is not a function`
era por heredar el `main.ts` federado + el polyfill, no por un choque de versiones.

## Pruebas

### Comandos

```bash
npx nx test web --skip-nx-cache
npx nx build web --skip-nx-cache
node --test scripts/validate-plugin-catalog.spec.js scripts/manage-plugin-catalog.spec.js
```

### Resultado

- `nx test web`: 78 test files, 355 passed, 0 failed.
- `nx build web` (federacion): PASS. Gate `validate-plugins` ejecutado
  ("Plugin catalog validation passed"). Building federation artefacts. Initial
  total ~172 kB.
- node plugin tests: 27 passed, 0 failed.

## Riesgo residual / pendiente

- NO se ha verificado la carga de un remoto REAL en runtime: requiere un plugin
  remoto de ejemplo (`init --type=remote`) y el dev server con host+remoto.
- La config de confianza del host (`provideAppPluginRemoteOrigins`,
  `provideAppPluginRemoteTrustedKeys`, `provideAppPluginRemoteKeys`) se anadira con
  el primer plugin remoto real; hoy, sin origenes/claves, cualquier remoto se
  deniega (fail-safe) y se marca `degraded`.
- `serve` quedo apuntando al builder de federacion; verificar el dev server en la
  sesion del remoto de ejemplo.
