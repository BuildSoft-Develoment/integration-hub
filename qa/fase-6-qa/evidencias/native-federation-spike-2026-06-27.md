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

- El `npm install` del generador altera el toolchain y rompe el test runner:
  `@angular/build:unit-test` falla con
  `pluginOptions.instrumentForCoverage is not a function` (plugin angular-compiler),
  en todos los specs. Apuntar `test.buildTarget` al target `esbuild` preservado NO
  lo resuelve: la perturbacion es a nivel de dependencias instaladas
  (`@angular/build`/`@angular-devkit/build-angular` 21.2.6 + federacion), no de
  configuracion del target.
- Por tanto, la reconfiguracion necesita pinning/resolucion de dependencias
  cuidadosa y verificacion con el dev server, fuera del alcance seguro de este pase.

## Procedimiento para la sesion dedicada

1. Rama dedicada. `npm i -D @angular-architects/native-federation@~21.2.0`.
2. `npx nx g @angular-architects/native-federation:init --project=web --type=dynamic-host`.
3. Restaurar el gate y el test runner en `apps/web/project.json`:
   - `build` (federacion) con `dependsOn: ["validate-plugins"]`.
   - `test.buildTarget` -> `web:esbuild` (el builder application preservado).
4. Resolver el conflicto de `instrumentForCoverage`: fijar versiones de
   `@angular/build` / `@angular-devkit/build-angular` coherentes con el unit-test
   builder; si persiste, evaluar `vitest`/`@nx` runner alterno para los specs.
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
esta listo. El unico trabajo restante es de toolchain de build (resolver el test
runner) + un remoto de ejemplo, idoneo para una sesion con verificacion en vivo.
