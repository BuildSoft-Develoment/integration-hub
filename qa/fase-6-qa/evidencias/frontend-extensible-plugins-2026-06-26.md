# Evidencia frontend modular extensible - 2026-06-26

## Alcance

- Implementacion base de arquitectura frontend extensible por contribuciones.
- Primer SPI real: navegacion global del shell mediante multi-provider.
- Documentacion de arquitectura, ADR y riesgo para futuros plugins externos.
- Gate local para validar catalogos externos metadata-only antes de publicar.
- Contrato JSON Schema publico para catalogos externos de plugin.
- Validacion por pruebas, build productivo y evidencia visual/a11y autenticada.

## Cambios verificados

- Se agregaron contratos frontend para extensiones:
  `AppPluginManifest`, `AppNavigationContribution`, `AppRouteContribution` y
  `AppWorkspaceContribution`.
- Se agrego `APP_PLUGIN_MANIFESTS` y `provideAppPluginManifests(...)` para
  registrar manifests internos o externos.
- Se agrego `buildAppPluginRegistry(...)` para validar identidad,
  compatibilidad de version y colisiones entre plugins.
- Se agrego `provideAppPluginRegistryValidation(...)` para ejecutar la
  validacion durante el bootstrap del shell.
- Se agrego `buildAppRoutesFromPluginManifests(...)` para materializar rutas
  Angular desde manifests validados, conservando lazy loading y metadata
  `pluginSource`/`pluginRouteId`.
- Se agrego `APP_WORKSPACE_CONTRIBUTIONS`,
  `provideAppWorkspaceContributions(...)` y
  `normalizeWorkspaceContributions(...)` para que los workspaces internos se
  extiendan desde manifests.
- Se agrego `AppPluginRuntimeRegistry` para centralizar manifests estaticos y
  manifests externos metadata-only.
- Se agrego `provideExternalAppPluginManifestCatalog(...)` y el catalogo
  `frontend/apps/web/public/plugins/catalog.json`.
- Se agrego `frontend/scripts/validate-plugin-catalog.js` y el comando
  `npm run validate:plugins` para validar catalogos externos antes de release.
- Se agrego el target Nx `web:validate-plugins`; `web:build` depende de este
  target y el workflow CI lo ejecuta como etapa `Plugin catalog gate`.
- Se agrego `frontend/scripts/validate-plugin-catalog.spec.js` y el target
  `web:test-plugins`, que depende de `web:validate-plugins` y prueba el gate.
- Se agrego `frontend/apps/web/public/plugins/catalog.schema.json` como contrato
  JSON Schema publico del catalogo metadata-only.
- `frontend/apps/web/public/plugins/catalog.json` referencia
  `./catalog.schema.json` con `$schema`.
- El gate rechaza campos desconocidos fuera del contrato publico para evitar
  typos silenciosos en manifests externos.
- El gate valida que rutas y capabilities del schema permanezcan sincronizadas
  con el validador.
- Se agrego la guia oficial de instalacion metadata-only:
  `docs/fase-5-construccion/modulos/frontend-plugin-catalog.md`.
- Se agrego `frontend/scripts/manage-plugin-catalog.js` para instalar,
  reemplazar, listar y retirar manifests metadata-only con validacion previa.
- Se agregaron comandos `plugins:install`, `plugins:remove` y `plugins:list`.
- El catalogo runtime externo puede aportar metadata a rutas ya instaladas, pero
  no puede declarar rutas Angular nuevas ni ejecutar codigo remoto.
- Se agrego el token `APP_NAVIGATION_CONTRIBUTIONS` y el helper
  `provideAppNavigationContributions(...)`.
- Se agrego `normalizeNavigationContributions(...)` para ordenar contribuciones
  y fallar temprano ante duplicados por `id` o `route`.
- El shell `AppNavigationComponent` consume contribuciones y conserva el filtro
  por capability.
- La navegacion, rutas y superficies de workspace internas de la plataforma se
  registran como manifest interno `platform`.
- El workspace `/audit/*` consume las cinco superficies audit desde el SPI en vez
  de mantenerlas hardcodeadas en el componente.
- Se endurecio `frontend/scripts/lh-screenshots.js` para esperar login o shell
  Angular, detectar pagina de error de Quarkus y evitar capturas falsas.

## Documentacion asociada

- ADR: `docs/fase-3-arquitectura/adr/ADR-012-frontend-modular-extensible-plugins.md`.
- Arquitectura: `docs/fase-3-arquitectura/03.00-arquitectura.md`.
- Riesgos: `docs/fase-3-arquitectura/anexos/requisitos-no-funcionales-y-riesgos.md`, riesgo `R-07`.

## Validacion de catalogo externo

### Comando

```bash
cmd.exe /c npm run validate:plugins
```

### Resultado

- Estado: PASS.
- Target Nx ejecutado: `web:validate-plugins`.
- Catalogo validado:
  `frontend/apps/web/public/plugins/catalog.json`.
- Schema referenciado: `./catalog.schema.json`.
- Manifests externos: 0.
- Reglas cubiertas: JSON valido, identidad/version/displayName,
  compatibilidad por `platformVersion`, capabilities conocidas, duplicados de
  manifest/navegacion/workspace, prohibicion de rutas Angular en JSON y enlaces
  solamente hacia rutas conocidas del shell, `$schema` soportado y campos dentro
  del contrato publico.

### Chequeo sintactico del gate

```bash
node --check scripts\\validate-plugin-catalog.js
```

- Estado: PASS.

### Target Nx directo

```bash
cmd.exe /c npx nx run web:validate-plugins --skip-nx-cache
```

- Estado: PASS.
- Salida: `Plugin catalog validation passed`.

### Pruebas del gate

```bash
cmd.exe /c npm run test:plugins
```

- Estado: PASS.
- Target Nx ejecutado: `web:test-plugins`.
- Dependencia ejecutada: `web:validate-plugins`.
- Tests Node: 10 passed, 0 failed.
- Casos cubiertos: catalogo vacio, metadata hacia ruta instalada, rechazo de
  rutas Angular en JSON runtime, rechazo de rutas desconocidas, rechazo de
  duplicados de navegacion, version mayor incompatible, capability no soportada,
  campos desconocidos, `$schema` no soportado, rutas del schema sincronizadas
  con el validador y capabilities del schema sincronizadas con el validador.

### Gestor de catalogo

```bash
node --check scripts\\manage-plugin-catalog.js
node --check scripts\\manage-plugin-catalog.spec.js
cmd.exe /c npm run test:plugins
cmd.exe /c npm run plugins:list
```

- Estado: PASS.
- Tests Node totales del target `web:test-plugins`: 17 passed, 0 failed.
- Casos nuevos cubiertos: instalacion de manifest metadata-only, `--dry-run`
  sin escritura, rechazo de overwrite sin `--replace`, reemplazo explicito,
  retiro por id, rechazo de manifest invalido preservando el catalogo y listado
  de manifests instalados.
- Catalogo real listado: `frontend/apps/web/public/plugins/catalog.json`.
- Manifests instalados en el catalogo real: 0.

## Pruebas unitarias

### Comando

```bash
cmd.exe /c npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 68 passed.
- Tests: 296 passed.
- Cobertura funcional nueva: `app-navigation.registry.spec.ts` valida orden,
  compatibilidad con legado y rechazo de duplicados por `id` y `route`;
  `app-plugin.registry.spec.ts` valida normalizacion de manifest, duplicados de
  plugin, incompatibilidad de version y colisiones de rutas/workspaces;
  `app-plugin.routes.spec.ts` valida materializacion de rutas, redirects y
  metadata de trazabilidad; `app-workspace.registry.spec.ts` y
  `audit-workspace-nav.component.spec.ts` validan orden, colisiones, filtrado por
  grupo y render accesible del workspace audit; `app-plugin-runtime.registry.spec.ts`
  valida carga metadata-only y bloqueo de rutas desconocidas o rutas Angular en
  manifests externos.

## Build productivo

### Comando

```bash
cmd.exe /c npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Initial total: `1.23 MB`.
- Estimated transfer initial: `244.28 kB`.
- Sin warnings de presupuesto de build.
- `nx build web` ejecuto previamente `web:validate-plugins` como dependencia.

## Stack local

### Comando

```bash
cmd.exe /c start-platform-stack.cmd
```

### Resultado

- Estado: PASS.
- App: `http://localhost:8080/`.
- Health app: `http://localhost:8080/q/health`.
- Audit consumer: `http://localhost:8082/q/health`.
- Docker Compose: servicios principales levantados, incluido `integration-hub-postgres` healthy y `integration-hub-audit-consumer` iniciado.

## Evidencia visual/a11y

### Comando

```bash
cmd.exe /c node scripts\\lh-screenshots.js
```

Ejecutado desde `frontend/`.

### Resultado

- Estado: PASS.
- Autenticacion: Keycloak con usuario `admin`.
- Screenshots: `lighthouse-report/screenshots/`.
- Metricas: `lighthouse-report/screenshots/metrics.json`.
- Rutas cubiertas: 13.
- Errores de consola: 0 en todas las rutas.
- Botones sin nombre accesible: 0 en todas las rutas.
- `main` landmark y `html[lang]`: presente en todas las rutas.

| Ruta | Nav ms | DOM | KB | Botones | Foco | Errores consola | Botones sin nombre | Landmark/lang |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| overview | 43 | 269 | 1219 | 3 | 17 | 0 | 0 | PASS |
| connections | 20 | 543 | 1358 | 13 | 46 | 0 | 0 | PASS |
| sources | 54 | 487 | 1413 | 14 | 40 | 0 | 0 | PASS |
| readers | 13 | 635 | 1485 | 14 | 47 | 0 | 0 | PASS |
| processes | 10 | 579 | 2145 | 27 | 51 | 0 | 0 | PASS |
| schedules | 13 | 308 | 2168 | 11 | 29 | 0 | 0 | PASS |
| executions | 77 | 323 | 2245 | 11 | 29 | 0 | 0 | PASS |
| audit | 9 | 459 | 2397 | 19 | 42 | 0 | 0 | PASS |
| audit-record-lineage | 24 | 203 | 2397 | 8 | 28 | 0 | 0 | PASS |
| audit-spool | 33 | 281 | 2397 | 6 | 30 | 0 | 0 | PASS |
| audit-mt101-fragments | 22 | 249 | 2397 | 5 | 30 | 0 | 0 | PASS |
| audit-mt101-quarantine | 29 | 338 | 2397 | 9 | 39 | 0 | 0 | PASS |
| payment-rules | 10 | 463 | 2459 | 9 | 38 | 0 | 0 | PASS |

## Riesgos residuales

- La SPI implementada cubre navegacion, materializacion de rutas Angular y
  superficies de workspace desde manifests internos.
- La carga runtime de manifests externos queda implementada solo para metadata
  hacia rutas existentes; la carga remota de codigo/plugin Angular aun no esta
  implementada y debe resolverse con firma/procedencia y pipeline de release.
- El catalogo metadata-only ya tiene gate local, target Nx, dependencia de build
  y etapa explicita en CI. Queda pendiente definir firma/procedencia si se
  habilita carga remota de codigo en una fase posterior.
- La instalacion de plugins externos requiere una fase posterior de gobierno:
  firma/procedencia, compatibilidad de `platformVersion`, sandbox de permisos,
  versionado de facades publicas y proceso de desinstalacion/rollback.
- El arbol Git contiene muchos cambios previos no relacionados; cualquier commit
  debe hacerse con staging selectivo por alcance.

## Conclusion

La base modular extensible queda implementada y verificada como primer paso de
SPI frontend. El shell ya puede recibir contribuciones declarativas sin que cada
modulo toque directamente la navegacion global, manteniendo control de orden,
capabilities y colisiones.
