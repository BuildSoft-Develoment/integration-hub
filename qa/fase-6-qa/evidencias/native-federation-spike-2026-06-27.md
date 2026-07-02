# Spike Native Federation: hallazgos y procedimiento (ADR-013) - 2026-06-27

Intento controlado (desechable, sin commit) de reconfigurar el builder del host a
Native Federation. Se revirtio para mantener la rama estable; aqui quedan los
hallazgos para una sesion dedicada.

## Resultado

- COMPATIBLE: `@angular-architects/native-federation@~21.2.0` (21.2.5) acompana a
  Angular 21.2; instala sin conflictos de peer deps.
- El generador Nx convierte el host limpiamente:
  `npx nx g @angular-architects/native-federation:init --project=web --type=dynamic-host`
  crea `federation.config.js` (shareAll singleton), `public/federation.manifest.json`,
  hace el split `main.ts` -> `bootstrap.ts` (`initFederation(...)` antes de
  `bootstrapApplication`), cambia el executor de `build` a
  `@angular-architects/native-federation:build` y CONSERVA el builder esbuild
  original como target `esbuild` (+ `serve-original`).
- BUILD DE FEDERACION VERDE: `nx build web` con el builder de federacion compila,
  genera artefactos de federacion y prepara los shared packages. Initial total
  ~171 kB, con `bootstrap` y `plugin-diagnostics-page-component` como chunks lazy.

## Bloqueante (motivo del revert)

- El test runner `@angular/build:unit-test` falla con
  `pluginOptions.instrumentForCoverage is not a function` (plugin angular-compiler)
  tras correr el generador, en todos los specs. Esto motivo el revert.

## Diagnostico rectificado (investigacion read-only posterior)

La causa NO es una perturbacion de dependencias del toolchain. Comprobado sin
instalar nada (estado limpio vs `npm install --dry-run`):

- `@angular/build`, `@angular/compiler-cli` y `@angular-devkit/build-angular` son
  IDENTICOS en limpio y tras la federacion (21.2.6 / 21.2.7 / 21.2.6).
- `esbuild` se queda en `0.27.3` (0 add/change/remove en el dry-run).
- Los unicos paquetes que cambian son 4 utilidades WASM
  (`@tybys/wasm-util`, `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`),
  irrelevantes para la instrumentacion de coverage.

Por tanto el fallo es de CONFIGURACION de build, no de dependencias:

- El fallo con `test.buildTarget = web:build` esta explicado: el generador cambio
  `build` al builder de federacion, cuyo plugin no expone `instrumentForCoverage`.
- Con `test.buildTarget = web:esbuild` persistio, lo que apunta a una herencia
  residual del target esbuild reescrito por el generador: `browser` pasa a apuntar
  al `main.ts` federado (`initFederation(...)`) y se anade el polyfill
  `es-module-shims`. El unit-test debe construir contra un `main` limpio y sin ese
  polyfill.

El blocker es por tanto mas tratable de lo estimado: separar el target de test del
builder de federacion, no resolver un choque de ecosistema.

## Procedimiento para la sesion dedicada

1. Rama dedicada. `npm i -D @angular-architects/native-federation@~21.2.0`.
2. `npx nx g @angular-architects/native-federation:init --project=web --type=dynamic-host`.
3. Restaurar el gate y el test runner en `apps/web/project.json`:
   - `build` (federacion) con `dependsOn: ["validate-plugins"]`.
   - `test.buildTarget` -> `web:esbuild` (el builder application preservado).
4. Resolver `instrumentForCoverage` por CONFIGURACION (no es choque de versiones):
   dar al unit-test un target application-builder limpio, con su propio `main`
   (no el `main.ts` federado) y SIN el polyfill `es-module-shims`. Si persiste:
   `npm ci` + `npx nx reset` para descartar daemon/cache antes de concluir.
5. Wiring del host (ya soportado por el codigo):
   `provideAppPluginRemoteModuleLoader((req) => loadRemoteModule(req.remoteEntry, req.exposedModule))`
   + `provideAppPluginRemoteOrigins([...])` + `provideAppPluginRemoteTrustedKeys([...])`
   + `provideAppPluginRemoteKeys({ keyId: jwk })`.
6. Plugin remoto de ejemplo (proyecto Nx `--type=remote`) y prueba e2e: descarga,
   verificacion (`AppPluginRemoteVerifier`), montaje y degradacion ante fallo.

## Estado de la rama

- Revertido por completo al checkpoint `a8da0566`. `nx test web` verde:
  78 test files, 355 tests. Sin residuos de la prueba.

## Conclusion

La viabilidad esta probada (build de federacion verde) y todo el codigo de
aplicacion (contrato, procedencia, cripto, loader, limite de error, diagnostico)
esta listo. El trabajo restante es de configuracion de build (separar el target de
test del builder de federacion y su `main`/polyfills) + un remoto de ejemplo,
idoneo para una sesion con verificacion en vivo. No es un choque de dependencias.
